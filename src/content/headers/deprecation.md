---
name: "Deprecation"
description: "Signals that an endpoint or resource is deprecated and may be removed in future."
category: "response"
standard: true
relatedCodes: []
---

## What is the Deprecation header?

The `Deprecation` response header, defined in RFC 9745, tells clients that the resource they are using is deprecated. Its value is either the boolean `true` for an already-deprecated resource, or an HTTP-date announcing when deprecation takes (or took) effect.

## API Usage & Best Practices

* **Give consumers warning**: Emit the header well before removal so integrators have time to migrate away from the endpoint.
* **Pair with Sunset**: Combine it with a `Sunset` header to state when the resource will actually stop working, giving a concrete deadline.
* **Link to guidance**: Add a `Link` header with `rel="deprecation"` pointing to documentation that explains the replacement and migration path.

## Examples

```http
HTTP/1.1 200 OK
Deprecation: Wed, 01 Jul 2026 00:00:00 GMT
Sunset: Sat, 31 Oct 2026 23:59:59 GMT
Link: <https://api.example.com/docs/v2>; rel="deprecation"
```
