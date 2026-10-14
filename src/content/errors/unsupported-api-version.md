---
title: Unsupported API Version
statusCode: 400
statusText: Bad Request
category: client-error
relatedCodes: ['gone', 'resource-not-found', 'not-acceptable', 'invalid-query-parameter']
publishedDate: 2026-10-14
---

## When to use it

Use 400 with an Unsupported API Version error when the client selects an API version through a request header or query parameter, and the server does not serve that version. This covers date-based version headers such as Stripe's `Stripe-Version`, custom headers such as `Api-Version: 2019-04-01`, and query parameters such as `?api-version=2019-04-01`. The version may be unknown (a typo, a date that was never released) or retired.

The status code depends on where the version lives, because that decides which part of the request is wrong. This type is for the header and query parameter case, and 400 is the right code there:

| Version carried in | Example | Status | Error type |
| :--- | :--- | :--- | :--- |
| Header or query parameter | `Api-Version: 2019-04-01` | 400 | `unsupported-api-version` |
| Path, never existed | `/v9/orders` | 404 | `resource-not-found` |
| Path, retired | `/v1/orders` after sunset | 410 | `gone` |
| Media type in `Accept` | `application/vnd.example.v9+json` | 406 | `not-acceptable` |

400 is right for header versions because the target resource still exists and is still available. Only the version selector the client sent is unacceptable, which is a defect in the request. GitHub takes a different view and returns 410 Gone for a retired `X-GitHub-Api-Version`. 410 says the target resource is no longer available, and here it still is, under every supported version, so use 400 and reserve 410 for a URI that has actually gone.

Always list the supported versions in the response. The client's next step is to pick one, and it should not have to read your docs to find out what they are.

## When not to use it

Do not use it for a path-versioned URI. `/v9/orders` is a URI that does not identify a resource, so it is `resource-not-found` (404), and a retired `/v1/orders` is `gone` (410), where the body can name the successor.

Do not use it for a version requested through a media type parameter or vendor media type in [`Accept`](/headers/accept). That is content negotiation failing, so it is `not-acceptable` (406).

Do not use it when the client sent no version at all and your API requires one. That is a missing required input; describe it in the same 400 if you like, but do not report a missing version as an unsupported one. If your API falls back to a default version when none is sent, say which version you used in a response header so the client can pin it.

Do not use it for an ordinary unsupported query parameter that has nothing to do with versioning. That is `invalid-query-parameter`.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/unsupported-api-version",
  "title": "Unsupported API Version",
  "status": 400,
  "detail": "API version 2019-04-01 is not supported. Supported versions are 2025-01-15, 2025-09-01 and 2026-06-01.",
  "instance": "/v1/orders",
  "requestedVersion": "2019-04-01",
  "supportedVersions": ["2025-01-15", "2025-09-01", "2026-06-01"]
}
```

The request that triggers it names a version the server no longer serves:

```http
GET /v1/orders HTTP/1.1
Host: api.example.com
Api-Version: 2019-04-01
Accept: application/json
```

Do not silently fall back to another version when the client asked for one you do not have. A client that pinned a version expects that version's response shapes; serving a different version breaks it in ways that surface far from the cause.
