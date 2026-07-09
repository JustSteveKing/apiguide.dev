---
title: Validation Failed
statusCode: 422
statusText: Unprocessable Entity
category: client-error
relatedCodes: ['unprocessable-query', 'malformed-request-body']
publishedDate: 2026-06-22
---

## When to use it

Use 422 Validation Failed when the request payload is syntactically correct and readable (like valid JSON), but fails to meet the server's business constraints or data validation rules.

Typical examples include a required field being missing, a string failing to meet a min/max length, or a field violating dependency rules (e.g. `start_date` must be before `end_date`).

Type and format errors (a malformed email string, a number sent as a boolean) belong to 400 Bad Request, not 422 — see `unprocessable-query` for where that line sits.

## When not to use it

Do not use 422 for syntactically invalid payloads (use `malformed-request-body` / 400 instead). Do not use this code for authorization checks (use 401 or 403) or resource existence failures (use 404).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The end_date must be a date after start_date.",
  "errors": {
    "end_date": [
      "The end_date must be a date after start_date."
    ]
  },
  "instance": "/v1/leads"
}
```
