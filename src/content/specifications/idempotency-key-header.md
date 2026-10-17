---
title: "Idempotency-Key Header Field (Internet-Draft)"
description: "A reference for draft-ietf-httpapi-idempotency-key-header, the IETF HTTPAPI draft that standardizes the Idempotency-Key request header for making POST and PATCH safely retryable: key syntax, fingerprints, expiry and the 400, 409 and 422 error cases. Expired, not an RFC."
currentVersion: "draft-ietf-httpapi-idempotency-key-header-07 (expired)"
officialUrl: "https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/"
---

## What is the Idempotency-Key header draft?

[`POST`](/methods/post) and [`PATCH`](/methods/patch) are not idempotent. When a client sends a payment request and the connection drops before the response arrives, it cannot tell whether the charge happened, and retrying may charge twice. Payment providers solved this years ago with a client-generated key sent in an [`Idempotency-Key`](/headers/idempotency-key) header: the server remembers the key, and a retry with the same key returns the original result instead of repeating the operation.

`draft-ietf-httpapi-idempotency-key-header` is the IETF HTTPAPI working group's effort to write that convention down, so that servers agree on the syntax and on what each failure looks like.

**Status as of October 2026:** the latest revision is -07, dated 15 October 2025. The draft has **expired** (datatracker state "Expired & archived"; WG state "WG Document", IESG state "Expired"). It was never published as an RFC and the header is not in the IANA field name registry. An expired working group draft can be revived with a new revision, but until that happens there is no IETF standard for this header, only a well-documented convention.

That is not a reason to avoid it. The pattern is widely deployed, and the draft is the clearest description of it. Implement what it says, and cite revision -07 in your documentation so clients know which text you followed.

---

## 1. Syntax

`Idempotency-Key` is an Item [Structured Field](/specifications/structured-fields) whose value must be a String, which means it is quoted on the wire:

```http
POST /payments HTTP/1.1
Host: api.example.com
Content-Type: application/json
Idempotency-Key: "8e03978e-40d5-43e8-bc93-6894a57f9324"

{"amount": 1000, "currency": "USD", "source": "card_123"}
```

The key must be unique, and must not be reused for a request with a different payload. The draft recommends a UUID or a similar random identifier. Generate it on the client, once per logical operation, and reuse the same key for every retry of that operation.

Vendor conventions that predate the draft, Stripe's among them, send the key as a bare token without quotes. If you are a server, accept both forms; if you are a client of a server that follows the draft, send it quoted.

---

## 2. Fingerprints

A key alone cannot tell the server whether a retry is really the same request. The draft introduces an optional **idempotency fingerprint**, which the server derives from the request and stores alongside the key:

| Approach | What it compares |
| :--- | :--- |
| Checksum | A hash of the whole payload, or of selected elements |
| Field matching | All fields, or a chosen subset, compared by value |
| Digest or signature | A request digest or signature the client already sent |

Use a fingerprint. Without one, a client bug that reuses a key for a different payment silently returns the first payment's result, and nobody finds out until reconciliation. A SHA-256 over the canonical request body is enough for most APIs.

---

## 3. What the server does with a key

| Situation | Server behavior |
| :--- | :--- |
| New key (and fingerprint) | Process normally and return the result |
| Retry after the original completed | Return the stored result, success or error |
| Retry while the original is still in progress | Return a conflict error |

"Success or error" matters. If the first attempt failed with a validation error, the retry gets the same validation error. Replaying only successful responses invites a client to fix the payload and resend under the old key, which is exactly the reuse the draft forbids.

---

## 4. Error responses

The draft specifies three failure cases, each as a [Problem Details](/specifications/problem-details) response:

| Case | Status | Draft's problem title |
| :--- | :--- | :--- |
| Key missing on an operation that requires one | [`400 Bad Request`](/status-codes/400) | "Idempotency-Key is missing" |
| Key reused with a different payload | [`422 Unprocessable Content`](/status-codes/422) | "Idempotency-Key is already used" |
| Retry while the original request is outstanding | [`409 Conflict`](/status-codes/409) | "A request is outstanding for this Idempotency-Key" |

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://apiguide.dev/errors/idempotency-key-conflict",
  "title": "Idempotency-Key is already used",
  "status": 422,
  "detail": "This key was used with a different request payload."
}
```

The draft's own examples use a placeholder type URI, so pick a stable one; [Idempotency Key Conflict](/errors/idempotency-key-conflict) is one you can use directly. After a `400` or `422` the client must change the request before retrying. After a `409` it should wait and retry the same request with the same key.

For any other error, [`429`](/status-codes/429), [`503`](/status-codes/503) and the rest, the client follows the resource's documented behavior.

---

## 5. Expiry and documentation

Keys do not have to live forever. A resource may expire keys after a time and purge them, and it should publish that policy. Whatever window you pick, it must be longer than any client's realistic retry window, including retries after an outage.

The draft also says a resource must publish its idempotency specification: which operations require a key, how long keys last, and whether a fingerprint is used. A general-purpose client cannot assume a server honors the header without that knowledge.

---

## 6. Implementation notes

* **Scope keys per client.** Store keys against the authenticated principal, not globally, or one tenant's key can collide with another's.
* **Record the key before doing the work.** Insert it with an "in progress" marker in the same transaction that starts the operation, so a concurrent retry finds it and gets the `409`.
* **Do not require it on idempotent methods.** [`GET`](/methods/get), [`PUT`](/methods/put) and [`DELETE`](/methods/delete) are already idempotent by definition in RFC 9110; the header is for operations that are not.
* **Do not treat it as a security control.** It prevents accidental duplicates, not malicious replay. Use authentication and, where it matters, [request signing](/guides/request-signing).

For the full design, storage and testing advice see [idempotency](/guides/idempotency).
