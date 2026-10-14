---
title: "Outbound Request Safety and SSRF"
description: "How to fetch user-supplied URLs (webhooks, image imports, link previews, OAuth discovery) without letting a caller reach your internal network or cloud metadata service."
category: "security"
---

## When Your API Makes the Request

Most API security is about requests coming in. Server-side request forgery (SSRF) is about the requests your API sends out on a caller's behalf. Any feature that takes a URL from a user and fetches it gives that user a client running inside your network, with your network position, your firewall exemptions and your cloud credentials within reach.

The classic target is the cloud instance metadata service at `169.254.169.254`, which on most clouds hands out the machine's own credentials to anything that can reach it. The OWASP API Security Top 10 (2023) lists this as **API7:2023 Server Side Request Forgery**, and its second example scenario is precisely a webhook test feature that fetched an attacker's metadata URL and returned the credentials in the response.

A URL check at input time is not enough on its own, because the hostname that resolves to a public address when you validate it can resolve to a private one when you connect. The defenses below are layered for that reason: each one closes a gap the others leave.

---

## 1. Know Where You Fetch URLs

SSRF surfaces are easy to miss because they rarely look like "fetch a URL" in the product spec.

| Feature | URL supplied as |
| --- | --- |
| [Webhooks](/guides/webhooks) | The subscription endpoint, plus any "send test event" button |
| Image or file import | `avatar_url`, `source_url`, "import from link" |
| Link previews and unfurling | Any URL inside user content |
| OAuth and OpenID Connect | Issuer metadata at `/.well-known/oauth-authorization-server` (RFC 8414), and `jwks_uri` or `logo_uri` in dynamic client registration (RFC 7591) |
| Document conversion | HTML-to-PDF renderers that follow `<img>` and `<link>` tags in the input |
| Import from another API | Feed URLs, OpenAPI import, remote schema `$ref` resolution |
| Callbacks for [async operations](/guides/async-operations) | A `callback_url` on the job request |

Inventory these, then route every one of them through a single outbound client that applies the rules below. Five features each doing their own validation is five chances to get it slightly wrong.

---

## 2. Allowlist Scheme and Port

Accept `https` and nothing else. Every other scheme your HTTP library happens to support (`file:`, `gopher:`, `ftp:`, `dict:`) is attack surface with no product use. Allowing plain `http` also lets an attacker reach internal services that never bothered with TLS, so require `https` for webhooks and imports alike; customers who need plain HTTP are rarely the ones you want to make an exception for.

Restrict ports to `443`, or to a short published list. An attacker who can choose the port can probe internal services by response timing even when the response body is never returned, which is OWASP's first API7 scenario.

Parse URLs with one well-maintained, standards-conforming parser, and make the decision on the parsed result, not on the raw string. Parsers disagree on edge cases such as userinfo (`https://trusted.example@evil.example/`), backslashes and numeric hosts, and an attack that exploits a disagreement needs your validator and your HTTP client to use different parsers. Reject URLs containing userinfo outright; RFC 9110 already forbids senders from generating it in `http` and `https` URIs.

---

## 3. Block Non-Public Address Ranges

The destination must be a publicly routable address. The authoritative lists are the IANA IPv4 and IPv6 Special-Purpose Address Registries, which mark each block as globally reachable or not. Block every block marked not globally reachable. The ones that matter most:

| Block | What it is | Why it matters |
| --- | --- | --- |
| `127.0.0.0/8`, `::1/128` | Loopback | Services bound to localhost, admin ports, sidecars |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | Private-use (RFC 1918) | Your internal network |
| `169.254.0.0/16` | Link-local | AWS, Azure and Google Cloud metadata at `169.254.169.254` |
| `100.64.0.0/10` | Shared address space (carrier-grade NAT) | Often used inside cloud and Kubernetes networks |
| `0.0.0.0/8`, `::/128` | "This network", unspecified | `0.0.0.0` reaches localhost on many systems |
| `fc00::/7` | Unique-local (includes all of `fd00::/8`) | AWS metadata over IPv6 at `fd00:ec2::254`, Google Cloud at `fd20:ce::254` |
| `fe80::/10` | IPv6 link-local | The IPv6 equivalent of `169.254.0.0/16` |
| `::ffff:0:0/96` | IPv4-mapped IPv6 | `::ffff:169.254.169.254` is the metadata service written in IPv6 |
| `192.0.0.0/24`, `198.18.0.0/15`, `240.0.0.0/4`, `255.255.255.255/32` | Protocol assignments, benchmarking, reserved, broadcast | Not legitimate webhook destinations |

Three traps:

- **Check the address, not the string.** `2130706433`, `0x7f.1` and `017700000001` are all ways of writing `127.0.0.1` that URL parsers accept. Resolve to a binary address first, then compare it against CIDR ranges.
- **Unwrap embedded IPv4.** IPv4-mapped addresses and NAT64 prefixes such as `64:ff9b::/96` carry an IPv4 address inside an IPv6 one. Extract it and check it against the IPv4 rules too.
- **Do not hand-maintain the list from memory.** Use a library that tracks the IANA registries, and re-check when the registries change; the IPv6 registry gained new non-reachable blocks in recent years.

Blocking ranges is necessary and not sufficient. Your own infrastructure may have internal services on public addresses, and none of this stops the rebinding attack in the next section.

---

## 4. Resolve Once, Then Connect to That Address

The naive implementation resolves the hostname, checks the address, then hands the URL to an HTTP client, which resolves it again. Between the two lookups, an attacker who controls the domain's DNS can change the answer: a public address with a short TTL for the check, `169.254.169.254` for the connection. This is DNS rebinding, and it defeats every validator that checks a hostname rather than the socket.

The defense is to make the check and the connection use the same resolution:

```text
addresses = resolve(host)                  # all A and AAAA records
if any address is not globally reachable:  # reject if ANY fails, not just the first
    reject
connect to addresses[0] directly
    send Host / SNI = original hostname     # so TLS and virtual hosting still work
    verify certificate against original hostname
```

Most HTTP clients let you supply a custom resolver or a dial hook that receives the resolved address before the socket opens; do the check there, at connect time, on the actual address being dialed. That also covers connection pools and retries, which may resolve again behind your back.

Validate at subscription time as well, so customers get an immediate error for an obviously bad URL. But treat that as a usability check. The security check is the one at connect time, on every delivery, because DNS answers change.

---

## 5. Re-Validate Every Redirect

An HTTP client that follows redirects automatically will happily follow `302 Found` with `Location: http://169.254.169.254/latest/meta-data/` from a perfectly public server. OWASP's API7 guidance is to disable redirects.

- **For webhooks, do not follow redirects at all.** Treat a `3xx` as a delivery failure, as the [webhooks guide](/guides/webhooks) already recommends. The customer can update their endpoint.
- **For fetches where redirects are legitimate** (image imports, link previews), follow them manually: take the [`Location`](/headers/location), run it through the full scheme, port and address checks again, cap the number of hops at a small number, and refuse a redirect from `https` to anything else.

---

## 6. Bound Time and Size

A user-supplied URL can point at a server that never finishes responding, or that streams forever. Without bounds, each fetch ties up a worker, and a handful of them is a denial of service against your delivery pipeline.

| Bound | Why |
| --- | --- |
| Connect timeout | Unroutable addresses can hang for the OS default, which is far too long |
| Total request timeout | A slow-drip response defeats a per-read timeout |
| Maximum response size | Stop reading at the cap; do not trust [`Content-Length`](/headers/content-length) |
| Decompressed size | A small compressed body can expand enormously; cap after decoding |
| Allowed content types | An avatar import expects an image, not HTML; check what you received |
| Concurrency per destination | One customer's slow endpoint should not starve everyone else's deliveries |

Pick numbers that fit the feature and publish the ones customers can hit, such as the webhook timeout.

---

## 7. Isolate the Fetcher

Application-level checks fail eventually: a new feature bypasses the shared client, a library upgrade changes parsing, a redirect path gets missed. Put a network boundary behind them so that a bypass reaches nothing valuable.

- **Use an egress proxy.** Route all user-directed outbound traffic through a forward proxy that performs the address checks itself and is the only path to the internet for that workload. Stripe's open-source [Smokescreen](https://github.com/stripe/smokescreen) is one example: an HTTP CONNECT proxy that resolves each destination and refuses internal addresses by default.
- **Run fetchers on a separate network segment** with no route to internal services, databases or the metadata endpoint. The fetcher only needs the internet; give it only the internet.
- **Harden the metadata service.** On AWS, require IMDSv2, which only issues credentials in response to a session token obtained by a `PUT` request, and keep the response hop limit at 1 where your containers allow it. Azure's metadata service requires a `Metadata: true` header and rejects requests carrying [`X-Forwarded-For`](/headers/x-forwarded-for); Google Cloud's requires `Metadata-Flavor: Google`. These help against the simplest SSRF, where the attacker controls only the URL, but treat them as defense in depth, not as a reason to skip the address checks.
- **Give the fetching workload minimal credentials**, so that if metadata is reached, what it yields is worth little.

---

## 8. Do Not Echo the Response

The worst SSRF outcomes come from features that return what they fetched. A webhook "test" button that shows the receiver's response body, or an import that reports the remote server's error page verbatim, turns a blind SSRF into one that reads internal data.

Return the status code, the timing and a classified error ("connection refused", "TLS handshake failed", "timed out", "destination not allowed"), and nothing from the response body. Make the "destination not allowed" error generic: telling the caller which rule matched helps them map your network. See [webhook delivery history](/guides/webhook-delivery-history) for what to record about each attempt, and [API security](/guides/api-security) for where SSRF sits among the other OWASP risks.
