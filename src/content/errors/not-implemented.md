---
title: Not Implemented
statusCode: 501
statusText: Not Implemented
category: server-error
relatedCodes: ['method-not-allowed', 'resource-not-found', 'invalid-query-parameter']
publishedDate: 2026-10-14
---

## When to use it

Use 501 Not Implemented when the server does not recognize the request method and cannot support it on any resource. RFC 9110 defines 501 as a server that "does not support the functionality required to fulfill the request", names the unrecognized method as the case it is meant for, and says an origin server that receives a method that is "unrecognized or not implemented SHOULD respond with the 501 (Not Implemented) status code".

The test is server-wide. If no route on the server handles the method, it is 501. A typical API example is a client sending [`QUERY`](/methods/query) (RFC 10008) to a server that has not implemented it, or a WebDAV method such as [`PROPFIND`](/methods/propfind) to an API that has never supported WebDAV.

RFC 9112 gives two more cases for HTTP/1.1. A server that receives a method longer than any it implements SHOULD respond with 501, and so should a server that receives a request with a transfer coding it does not understand.

RFC 9110 requires every general-purpose server to support [`GET`](/methods/get) and [`HEAD`](/methods/head), so never return 501 for either.

## When not to use it

Do not use it when the server implements the method but this resource does not accept it. That is `method-not-allowed` (405). RFC 9110 draws the line exactly: a method that is "recognized and implemented, but not allowed for the target resource" gets 405. `DELETE` on a read-only collection is 405 when other routes accept `DELETE`, even if this one never will.

The [`Allow`](/headers/allow) header follows the same split. RFC 9110 says an origin server MUST send `Allow` in a 405 response and MAY send it in any other. A 405 without `Allow` breaks the spec. On a 501 it is optional, and it describes only the target resource, so it does not tell the client which methods the server recognizes overall.

Do not use 501 for an endpoint you have not built yet. Until the route exists, it is `resource-not-found` (404). A 501 on a planned route tells clients the server does not understand the method, which is not true.

Do not use it for an unsupported option within a request the server otherwise understands, such as a filter or sort field the endpoint does not offer. That is `invalid-query-parameter` (400): the client can fix it, and a 5xx tells generic clients and dashboards that the server is at fault.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/not-implemented",
  "title": "Not Implemented",
  "status": 501,
  "detail": "This server does not implement the QUERY method. Send the query as a POST to /v1/leads/search instead.",
  "instance": "/v1/leads"
}
```

The request that triggers it uses a method no route on the server handles:

```http
QUERY /v1/leads HTTP/1.1
Host: api.example.com
Content-Type: application/json
```

501 is a 5xx, and many retry policies retry every 5xx. Retrying a 501 never helps, so clients should treat it as permanent until the server changes. RFC 9110 also makes 501 heuristically cacheable, so a cache may reuse it without explicit freshness information. Send `Cache-Control` if you plan to add the method soon.
