---
name: "Content-Language"
description: "Describes the natural language(s) of the intended audience for the message body."
category: "both"
standard: true
relatedCodes: [200]
---

## What is the Content-Language header?

The `Content-Language` header states the natural language(s) that the representation body is intended for, using language tags such as `en`, `en-US`, or `fr-CA`. It describes the audience, not necessarily every language present in the content.

## API Usage & Best Practices

* **Pair with `Accept-Language`**: Use it to confirm which language variant was returned in response to a client's `Accept-Language` preferences.
* **Support content negotiation**: Set it on localized API responses so clients and caches can distinguish between language variants of the same resource.
* **Multiple tags allowed**: A comma-separated list can indicate content intended for several audiences at once.

## Examples

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Language: en-US
```
