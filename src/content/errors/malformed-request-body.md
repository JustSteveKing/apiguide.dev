---
title: Malformed Request Body
statusCode: 400
statusText: Bad Request
category: client-error
relatedCodes: ['validation-failed', 'unsupported-media-type']
publishedDate: 2025-11-17
---

## When to use it

Use 400 with a Malformed Request Body error when the server cannot parse the payload sent in the HTTP request body. This occurs at the syntax level—for example, if the client sends invalid JSON (such as missing a closing brace, trailing commas, or unescaped characters).

Since the server cannot read the payload, it cannot run any validation or domain logic.

## When not to use it

Do not use this error if the JSON itself is well-formed, but lacks required fields or contains invalid parameter values. In those cases, use `validation-failed` or `unprocessable-query`.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/malformed-request-body",
  "title": "Malformed Request Body",
  "status": 400,
  "detail": "The request body could not be parsed as valid JSON: Syntax error.",
  "instance": "/v1/leads"
}
```
