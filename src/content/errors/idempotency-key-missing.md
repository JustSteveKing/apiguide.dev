---
title: Idempotency Key Missing
statusCode: 400
statusText: Bad Request
category: client-error
relatedCodes: ['idempotency-key-conflict', 'precondition-required', 'validation-failed']
publishedDate: 2026-10-17
updatedDate: 2026-10-17
---

## When to use it

Use [`400 Bad Request`](/status-codes/400) with an Idempotency Key Missing error when an operation is documented as requiring an [`Idempotency-Key`](/headers/idempotency-key) header and the request arrives without one. Payment, transfer and order-creation endpoints often make the key mandatory, because a retried [`POST`](/methods/post) without one can charge a customer twice.

This follows the IETF HTTPAPI working group's Internet-Draft `draft-ietf-httpapi-idempotency-key-header` (revision -07), which says the resource SHOULD reply with 400 and a body that links to documentation explaining the requirement. The draft has expired and is not an RFC, so treat it as the best available convention rather than a standard.

Reject the request before doing any work. The whole point of requiring the key is that an unkeyed request cannot be made safe to retry, so processing it anyway defeats the requirement. The [idempotency guide](/guides/idempotency) covers how the key, the stored response and the payload fingerprint fit together.

## When not to use it

Do not use it on endpoints where the key is optional. If you accept unkeyed requests, process them without idempotency protection; refusing them only some of the time is worse than either policy.

Do not use it when the key is present but has been misused. A key reused with a different payload, or a retry that arrives while the original request is still running, is `idempotency-key-conflict` (422 or 409).

Do not use it when the key is present but malformed, such as a value that is not a Structured Fields String as the draft requires, or one longer than your documented limit. That is still a 400, but it is a validation problem with a header the client did send, so say what is wrong with the value rather than that it is missing.

Do not reach for [`428 Precondition Required`](/status-codes/428) here. 428 means a conditional header such as [`If-Match`](/headers/if-match) is missing, which is `precondition-required`, and an idempotency key is not a precondition on the resource's state.

Do not start requiring the key on an existing endpoint without warning. Every client that sends unkeyed requests today begins failing on its next call, so treat the change as a breaking one and announce it first.

## Example response

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json
Link: <https://developer.example.com/idempotency>; rel="describedby"; type="text/html"

{
  "type": "https://apiguide.dev/errors/idempotency-key-missing",
  "title": "Idempotency Key Missing",
  "status": 400,
  "detail": "POST /v1/charges requires an Idempotency-Key header. Generate a unique key, such as a UUID, for each new charge and send the same key on every retry of it.",
  "instance": "/v1/charges",
  "documentation": "https://developer.example.com/idempotency"
}
```

The draft shows both ways of pointing at documentation: a link in the problem body, and a `Link` header with `rel="describedby"`. Sending both costs nothing and serves clients that read only one of them.
