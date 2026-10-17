---
name: "Authentication-Info"
description: "Returns scheme-specific information to the client after its credentials have been accepted, such as the next nonce in Digest authentication."
category: "response"
standard: true
reference:
  title: "RFC 9110, Section 11.6.3"
  url: https://www.rfc-editor.org/rfc/rfc9110.html#section-11.6.3
updatedDate: 2026-10-14
---

## What is the Authentication-Info header?

The `Authentication-Info` response header, defined in RFC 9110 Section 11.6.3, lets an HTTP authentication scheme send information back to the client once its credentials have been accepted. That can be a finalization message, such as the server proving its own identity. RFC 9110 defines only the generic format, a list of `name=value` parameters; each scheme defines which parameters exist and what they mean, based on the scheme named in the request's [`Authorization`](/headers/authorization) header.

It can appear on any response regardless of method or status code, and it can be sent as a trailer field when the scheme explicitly allows it. A proxy forwarding the response MUST NOT modify it. Its proxy counterpart is `Proxy-Authentication-Info`, which works the same way for [`Proxy-Authorization`](/headers/proxy-authorization) but applies only to the next outbound client.

## API Usage & Best Practices

* **You will rarely need it**: `Bearer` tokens (RFC 6750), API keys and `Basic` do not define any `Authentication-Info` parameters. The best-known user is HTTP Digest (RFC 7616 Section 3.5), which defines `nextnonce`, `qop`, `rspauth`, `cnonce` and `nc`. If your API uses bearer tokens, do not invent parameters for it.
* **Do not use it to hand out new tokens**: Token refresh belongs in your token endpoint's response body, as [OAuth 2.0](/specifications/oauth2) does it, not in an ad hoc header on every response. Credentials in response headers get logged by proxies and observability tools.
* **Mind the pipelining cost of `nextnonce`**: RFC 7616 warns that requiring a fresh nonce on every request prevents pipelining, and suggests the `nc` counter as a way to keep most of the security benefit without that cost.
* **Read it if your scheme defines it**: A Digest client that ignores `nextnonce` may be asked to re-authenticate with `stale=true`, costing an extra round trip.

## Examples

A Digest server rotating the nonce and proving its identity with `rspauth` (illustrative values):

```http
HTTP/1.1 200 OK
Content-Type: application/json
Authentication-Info: nextnonce="5ccc069c403ebaf9f0171e9517f40e41", qop=auth, rspauth="6629fae49393a05397450978507c4ef1", cnonce="0a4f113b", nc=00000001
```
