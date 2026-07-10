---
name: "Expires"
description: "The absolute date and time after which a cached response is considered stale."
category: "response"
standard: true
relatedCodes: [200]
---

## What is the Expires header?

The `Expires` response header, defined in RFC 9111, contains an HTTP-date that marks when a response should no longer be considered fresh. After that moment, a cache must revalidate the resource before reusing it.

## API Usage & Best Practices

* **Superseded by Cache-Control**: When both `Expires` and `Cache-Control: max-age` are present, the relative `max-age` directive wins and `Expires` is ignored.
* **Invalid dates mean stale**: A malformed date, or the value `0`, is treated as already expired, forcing revalidation on the next request.

## Examples

```http
HTTP/1.1 200 OK
Expires: Thu, 09 Jul 2026 12:00:00 GMT
```
