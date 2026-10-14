---
title: URI Too Long
statusCode: 414
statusText: URI Too Long
category: client-error
relatedCodes: ['request-header-fields-too-large', 'payload-too-large', 'invalid-query-parameter']
publishedDate: 2026-10-14
---

## When to use it

Use 414 URI Too Long when the target URI is longer than the server is willing to interpret. RFC 9110 defines it that way, and RFC 9112 makes it mandatory for HTTP/1.1: a server that receives a request-target "longer than any URI it wishes to parse MUST respond with a 414".

RFC 9110 calls it a "rare condition" and names three causes: a client that converted a `POST` into a `GET` with long query information, a client caught in a redirect loop that keeps growing the URI, and an attack probing for security holes. In APIs the first is by far the most common: a `GET` that filters by a long list of IDs, or a search encoded entirely in the query string, which grows with the user's input until it hits a limit.

There is no fixed maximum. RFC 9110 recommends that senders and recipients support URIs of at least 8000 octets, and RFC 9112 recommends request lines of at least 8000 octets. Every hop between client and application has its own limit, and the smallest one wins. nginx, for example, rejects a request line longer than one `large_client_header_buffers` buffer, 8K by default, with 414. Find the lowest limit on your path and document it.

## When not to use it

Do not use it when the header section is too large, for example because of oversized cookies or a large bearer token. That is `request-header-fields-too-large` (431). Do not use it when the request body is too large; that is `payload-too-large` (413).

Do not use it when the URI fits within your limits but asks for more than your business rules allow, such as 500 IDs on a filter capped at 100. The server read the URI fine, so that is `invalid-query-parameter` (400), naming the parameter and the cap.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/uri-too-long",
  "title": "URI Too Long",
  "status": 414,
  "detail": "The request URI is 11204 bytes long. This API accepts URIs up to 8000 bytes. Send large queries as a QUERY or POST request with the query in the body.",
  "instance": "/v1/leads",
  "maxLength": 8000
}
```

The fix belongs in the API design as well as the client. If a query can legitimately grow beyond a few kilobytes, give it a body: [`QUERY`](/methods/query), standardized in RFC 10008, is safe and idempotent and carries the query in the content, and a `POST` to a search resource works where `QUERY` is not yet supported. Do not tell clients to split one logical query across several `GET` requests and merge the results themselves.

The limit usually trips at a proxy or load balancer before the request reaches your application, so the body above comes from whatever generates that edge's error pages. Configure it to return `application/problem+json`. RFC 9110 also makes 414 heuristically cacheable, so a cache may reuse it without explicit freshness information.
