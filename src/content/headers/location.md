---
name: "Location"
description: "Indicates the URL to redirect the client to, or the URL of a newly created resource."
category: "response"
standard: true
relatedCodes: [201, 301, 302, 303, 307, 308]
---

## What is the Location header?

The `Location` response header serves two main functions: redirecting the client to a new URL, or pointing to the URI of a newly created resource.

## API Usage & Best Practices

* **Use on 201 Created**: When a resource is successfully created via POST, always include the Location header pointing to the GET path of the new resource.
* **Relative references resolve against the target URI**: RFC 9110 defines the value as a URI-reference, so `Location: /v1/leads/lead_123` is valid and the client resolves it against the request's target URI. Absolute URLs remove any doubt about which host and scheme a client lands on behind proxies, so prefer them when your public origin differs from what the application sees.
* **Fragments carry over on redirects**: If a `Location` in a 3xx response has no fragment, the user agent keeps the fragment of the original reference. A link to `/docs#auth` that is redirected with `Location: /v2/docs` ends up at `/v2/docs#auth`.
* **Not the same as Content-Location**: `Location` points at a different resource: the one created by a `201`, or the redirect target of a 3xx. [`Content-Location`](/headers/content-location) identifies the resource whose representation is in this response's body. Do not use one in place of the other.

## Examples

```http
HTTP/1.1 201 Created
Location: https://api.apiguide.dev/v1/leads/lead_123
```
