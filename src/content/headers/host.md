---
name: "Host"
description: "Specifies the target host and port of the resource being requested."
category: "request"
standard: true
relatedCodes: [400, 421]
reference:
  title: "RFC 9110, Section 7.2"
  url: https://www.rfc-editor.org/rfc/rfc9110.html#section-7.2
updatedDate: 2026-07-10
---

## What is the Host header?

The `Host` request header names the domain (and optional port) of the server the request targets. It is mandatory in HTTP/1.1: every request must include exactly one `Host` header so the server knows which host the client intends to reach.

## API Usage & Best Practices

* **Enables virtual hosting**: Multiple domains can share one IP address because `Host` disambiguates which site or API the request is for.
* **Missing or duplicate values fail**: An HTTP/1.1 request without a `Host`, or with more than one, must be answered with `400 Bad Request`.
* **Ties to 421**: If a server receives a request for a host it cannot serve on that connection, it may respond with `421 Misdirected Request`.

## Examples

```http
GET /v1/users HTTP/1.1
Host: api.example.com:443
```
