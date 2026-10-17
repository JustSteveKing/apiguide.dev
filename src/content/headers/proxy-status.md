---
name: "Proxy-Status"
description: "Lets each proxy, gateway or CDN on the path say what it did with a response and, on a 502 or 504, exactly which error it hit."
category: "response"
standard: true
relatedCodes: [502, 503, 504]
---

## What is the Proxy-Status header?

The `Proxy-Status` response header, defined in [RFC 9209](https://www.rfc-editor.org/rfc/rfc9209.html), is how an intermediary explains what it did with a response. Its main job is the one every API operator needs at 3 a.m.: when a gateway returns [`502 Bad Gateway`](/status-codes/502) or [`504 Gateway Timeout`](/status-codes/504), `Proxy-Status` says whether DNS failed, the connection was refused, the TLS handshake broke or the upstream simply stopped answering.

It is a [Structured Field](/specifications/structured-fields) List. Each member names one intermediary, as a token or string, followed by parameters. The first member is the intermediary **closest to the origin** and the last is the one closest to the client; each intermediary should preserve the members already present. Origin servers must not generate it: it is for proxies, gateways and CDNs only.

| Parameter | Type | Meaning |
| :--- | :--- | :--- |
| `error` | Token | The proxy error type, from the registry below |
| `next-hop` | String or Token | The intermediary or origin this one selected to get the response |
| `next-protocol` | Token or Byte Sequence | The ALPN protocol ID used to reach the next hop, such as `h2` |
| `received-status` | Integer | The status code the next hop returned |
| `details` | String | Implementation-specific extra information |

RFC 9209 creates the IANA "HTTP Proxy Error Types" registry, which pairs each error type with a recommended status code. The ones you will meet most often:

| Error type | Recommended status | Meaning |
| :--- | :--- | :--- |
| `dns_timeout` | 504 | DNS lookup for the next hop timed out |
| `dns_error` | 502 | DNS lookup failed; optional `rcode` and `info-code` parameters carry the DNS response code and extended error |
| `destination_not_found` | 500 | The intermediary cannot determine a next hop for the request, for example because none is configured |
| `destination_unavailable` | 503 | The intermediary considers the next hop unavailable, for example because recent attempts to reach it failed |
| `destination_ip_prohibited` | 502 | The next hop's address is forbidden by configuration |
| `connection_refused` | 502 | The next hop refused the connection |
| `connection_terminated` | 502 | The connection closed before a complete response arrived |
| `connection_timeout` | 504 | Opening the connection timed out |
| `connection_read_timeout` | 504 | Reading from the next hop timed out |
| `connection_limit_reached` | 503 | The intermediary hit its own limit on upstream connections |
| `tls_certificate_error` | 502 | The next hop's certificate failed validation |
| `tls_alert_received` | 502 | The next hop sent a TLS alert; optional `alert-id` and `alert-message` say which |
| `http_response_incomplete` | 502 | The response from the next hop was incomplete |
| `http_response_header_section_size` | 502 | The upstream response headers were too large |
| `http_response_timeout` | 504 | The next hop did not respond in time |
| `http_protocol_error` | 502 | The next hop violated HTTP |
| `http_request_denied` | 403 | The intermediary refused the request by policy |
| `proxy_loop_detected` | 502 | The request looped back through the intermediary |
| `proxy_configuration_error` | 500 | The intermediary is misconfigured |

The registry has more (`connection_write_timeout`, `tls_protocol_error`, `http_response_body_size`, `http_upgrade_failed`, `proxy_internal_error` and others). RFC 9209 says to use the most specific type that applies.

## API Usage & Best Practices

* **Turn it on at your gateway.** A bare 502 tells you something between client and origin failed. `error=connection_refused; next-hop=orders-v2` tells you the orders service is down and which pool the gateway tried. That is the difference between paging the right team and paging everyone.
* **Prefer it to a vendor `X-` header.** If your gateway or CDN supports `Proxy-Status`, use it instead of a home-grown `X-Upstream-Error`. One format across every layer means one parser in your log pipeline and tooling that already understands it.
* **Return the recommended status.** The registry pairs each error with a status for a reason: `connection_timeout` is a 504, `connection_refused` is a 502, `destination_unavailable` is a 503. A gateway that sends 500 for everything throws away the distinction clients use to decide whether to retry.
* **Record success too.** It is not only for errors. `received-status` and `next-hop` on a 200 show which upstream served the response, which is useful when debugging a canary or a misrouted request.
* **Mind what you expose.** RFC 9209's security section warns that the field can reveal backend topology and configuration to attackers. Every parameter, and the field itself, is optional. A sound default is to emit the full detail on internal hops and to your logs, and to strip `next-hop` and `details` at the public edge, or send them only to authenticated operators.
* **Do not treat it as verified.** The field's content is a claim by each intermediary, not proof. Use it for diagnosis, not for security decisions.
* **It sits beside your problem details, not instead of them.** For an error the gateway generates, also return an RFC 9457 body, such as [Bad Gateway](/errors/bad-gateway) or [Gateway Timeout](/errors/gateway-timeout), so client code has something structured to read. `Proxy-Status` is for operators; the problem type is for clients.
* **Related fields:** [`Cache-Status`](/headers/cache-status) does the same job for caches, and [`Via`](/headers/via) records which intermediaries a message passed through without saying what happened.

## Examples

The gateway could not open a connection to the upstream:

```http
HTTP/1.1 502 Bad Gateway
Content-Type: application/problem+json
Proxy-Status: api-gateway; error=connection_refused; next-hop=orders-v2
```

A CDN in front of a gateway. The gateway (closest to the origin, listed first) timed out reading from the upstream; the CDN passed the 504 through:

```http
HTTP/1.1 504 Gateway Timeout
Proxy-Status: api-gateway; error=http_response_timeout; next-hop="10.0.4.17:8080", ExampleCDN; received-status=504
```

DNS resolution of the next hop failed with NXDOMAIN:

```http
HTTP/1.1 502 Bad Gateway
Proxy-Status: ExampleCDN; error=dns_error; rcode="NXDOMAIN"
```

A successful response, recording which upstream served it and over which protocol:

```http
HTTP/1.1 200 OK
Proxy-Status: api-gateway; next-hop=orders-v2; next-protocol=h2; received-status=200
```
