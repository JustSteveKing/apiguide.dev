---
title: Misdirected Request
statusCode: 421
statusText: Misdirected Request
category: client-error
relatedCodes: ['resource-not-found', 'bad-gateway', 'too-early']
publishedDate: 2026-10-17
---

## When to use it

Use [`421 Misdirected Request`](/status-codes/421) when a request reached a server that cannot give an authoritative response for its target URI. RFC 9110 says an origin server, or a gateway acting for it, sends 421 to reject a target URI that does not match an origin the server is configured for, or that does not match the connection the request arrived on.

The common cause is connection reuse. HTTP/2 and HTTP/3 clients may send requests for several hostnames over one connection when those hostnames resolve to the same server and share a TLS certificate. If the certificate covers `*.example.com` but `billing.example.com` is served by a different cluster, a request for it can land on the wrong one. 421 tells the client to open a new connection.

The other is a mismatch between the TLS server name and the [`Host`](/headers/host) or `:authority` the request names, which some servers reject deliberately so that one tenant's hostname cannot be reached through another tenant's TLS session.

RFC 9110 says a client that receives 421 MAY retry the request over a different connection, "whether or not the request method is idempotent". That is unusual, and it is the point: the server is promising it did nothing with the request.

## When not to use it

Do not use it when the host is right and the path does not exist. That is `resource-not-found` (404). 421 is about the wrong server, not the wrong resource.

Do not use it unless you are certain the request was not processed. A client may resend a [`POST`](/methods/post) after a 421 with no idempotency protection, so returning it after doing any work invites a duplicate.

Do not generate it from a proxy. RFC 9110 says "A proxy MUST NOT generate a 421 response." A proxy that cannot reach the right upstream has a gateway problem, which is `bad-gateway` (502).

Do not use it to send a client to a different hostname, such as a regional endpoint. A 421 retry goes to the same URI on a new connection, so it will not carry the client anywhere new. Use a redirect, or a problem type that names the correct base URL.

## Example response

```http
HTTP/1.1 421 Misdirected Request
Content-Type: application/problem+json

{
  "type": "https://apiguide.dev/errors/misdirected-request",
  "title": "Misdirected Request",
  "status": 421,
  "detail": "This server is not configured to serve billing.example.com. Retry the request on a new connection.",
  "instance": "/v1/invoices"
}
```

Most HTTP/2 and HTTP/3 clients handle 421 by retrying on a fresh connection without surfacing it, so this body is mainly for logs and for clients that do not. If you see 421s in volume, the fix is usually at the edge: separate certificates for hostnames served by different backends, or the HTTP/2 `ORIGIN` frame from RFC 8336, which tells clients which origins a connection actually serves.
