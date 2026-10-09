---
title: Invalid Query Parameter
statusCode: 400
statusText: Bad Request
category: client-error
relatedCodes: ['unprocessable-query', 'invalid-pagination-cursor', 'malformed-request-body', 'validation-failed']
publishedDate: 2026-10-08
---

## When to use it

Use 400 Invalid Query Parameter when the query string is the problem. The path resolves and the body, if there is one, is fine, but a parameter in the URL cannot be accepted. That covers four cases:

- A parameter the endpoint does not support, such as `?region=emea` on an endpoint with no `region` filter.
- A parameter name that breaks the API's naming rules, such as `?Sort=name` on an API whose parameter names are all lowercase.
- An unsupported value for a known parameter, such as an `include` path the endpoint cannot expand or a `sort` field it cannot order by.
- A filter value that cannot be used, such as `?filter[status]=archived` when `status` only accepts `open` or `closed`.

JSON:API 1.1 makes 400 Bad Request mandatory for several of these. A server that does not support an include path, or does not support sorting by a requested field, MUST respond with 400, and so must a server that receives a query parameter whose name breaks the specification's naming rules or that it does not know how to process. That is why APIs built on JSON:API use 400 here, where others reach for 422.

Tell the client which parameter failed. A JSON:API error object has `source.parameter` for exactly this. In an RFC 9457 response, add an extension member such as `parameter`, as the example below does, so a client can read the name without parsing `detail`.

## When not to use it

Do not use it when the body is the problem. A body that cannot be parsed is `malformed-request-body`, and a body that parses but breaks the rules is `validation-failed`.

Do not use it for a pagination cursor that cannot be decoded. That is `invalid-pagination-cursor`, which clients handle differently: the fix is usually to start again from the first page, not to edit the query.

Do not use it when the path or resource does not exist. That is `resource-not-found` (404), not a query string problem.

400 and 422 are both defensible for query string errors. 400 says the server will not accept the request as sent; 422 says it understood the request but cannot act on the values. JSON:API settles the question for APIs that follow it. Outside JSON:API, pick one and use it on every endpoint. If your API already returns 422 for query semantics, keep doing that and use `unprocessable-query` instead of this type. Do not mix the two at random, because clients branch on the status code before they read `type`. If you want a split, make it a rule: 400 for a value the endpoint never accepts, 422 for a value that is valid on its own but cannot be satisfied against the current data, such as page 2 of a one page collection.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/invalid-query-parameter",
  "title": "Invalid Query Parameter",
  "status": 400,
  "detail": "The sort parameter does not support the field nickname. Supported fields are created_at, name and status.",
  "parameter": "sort",
  "instance": "/v1/leads?sort=nickname"
}
```

The request that triggers this response asks to sort by a field the endpoint cannot order by:

```http
GET /v1/leads?sort=nickname HTTP/1.1
Host: api.example.com
Accept: application/json
```

To recover, the client should correct or remove the parameter named in `parameter` and send the request again. Resending it unchanged fails the same way, so do not retry it automatically. If the value came from user input, show the error to the user rather than silently dropping the parameter: a dropped filter returns a wider result set than the user asked for.
