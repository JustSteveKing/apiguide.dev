---
name: "Proxy-Authenticate"
description: "Carries the authentication challenge a forward proxy sends with a 407 response before it will relay the request."
category: "response"
standard: true
relatedCodes: [407]
reference:
  title: "RFC 9110, Section 11.7.1"
  url: https://www.rfc-editor.org/rfc/rfc9110.html#section-11.7.1
updatedDate: 2026-10-14
---

## What is the Proxy-Authenticate header?

The `Proxy-Authenticate` response header, defined in RFC 9110 Section 11.7.1, holds one or more challenges naming the authentication schemes a proxy accepts. A proxy MUST send at least one in every [`407 Proxy Authentication Required`](/status-codes/407) response it generates. The client answers by repeating the request with a [`Proxy-Authorization`](/headers/proxy-authorization) header.

It is the proxy-side twin of [`WWW-Authenticate`](/headers/www-authenticate), with the same syntax and parsing rules, but a narrower scope: it applies only to the next outbound client on the response chain, because only the client that chose a proxy is likely to hold credentials for it.

## API Usage & Best Practices

* **Your API should not send it**: `407` and `Proxy-Authenticate` belong to forward proxies that a client is configured to use, typically corporate egress proxies. An API gateway or reverse proxy in front of your service is the origin as far as the client is concerned, so it challenges with [`401 Unauthorized`](/status-codes/401) and `WWW-Authenticate`. Sending `407` from a gateway tells clients to look for proxy credentials they do not have.
* **Expect to receive it in API clients**: SDKs and integrations that run inside customer networks will meet `407` from an egress proxy. Surface it as a proxy configuration error, distinct from an authentication failure against your API, so the customer knows which credentials to fix.
* **HTTPS goes through CONNECT**: For an `https` API behind a forward proxy, the client opens a tunnel with [`CONNECT`](/methods/connect), and that is the request the proxy challenges. The `407` arrives in response to the `CONNECT`, before any TLS to your API begins.
* **Prefer a scheme that does not expose the secret**: A `Basic` challenge means the proxy password travels base64-encoded, which is not encryption. Over a plaintext connection to the proxy it can be read by anyone on the path.

## Examples

```http
HTTP/1.1 407 Proxy Authentication Required
Proxy-Authenticate: Basic realm="corp-egress"
Content-Length: 0
```
