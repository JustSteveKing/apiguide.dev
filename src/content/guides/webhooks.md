---
title: "Webhooks & Event-Driven API Design"
description: "Best practices for webhooks, covering secure payload signing, retry scheduling, receiver idempotency, and typed payloads whose changes are new event types rather than quiet mutations."
category: "security"
---

## Introduction to Webhooks

Webhooks allow your application to send real-time HTTP [POST](/methods/post) notifications to client servers when events occur, reversing the request/response pattern. 

Because webhooks execute over the public internet, designing them demands rigorous attention to delivery reliability and receiver security.

---

## 1. Secure Payload Signing (HMAC)

Since clients expose public endpoints to receive webhooks, they need a mechanism to verify that incoming requests originated from your server and were not tampered with.

### Implementation steps:
1. Provide the user with a shared secret key (e.g., in their developer dashboard).
2. Before sending the webhook, compute a hash signature of the raw request body using HMAC SHA-256 and the shared secret:
   ```
   signature = HMAC-SHA256(secret, request_body)
   ```
3. Send the signature in a custom header, along with a timestamp (to prevent replay attacks):
   ```http
   X-Webhook-Signature: t=1720440000,v1=5b7a192c0199cf8e184e27f...
   ```
4. The client computes the same hash using their copy of the secret and verifies it matches `v1`. They should also reject requests where the timestamp `t` differs significantly from the current time.

---

## 2. Delivery & Retry Logic

Network glitches are inevitable. If a client server fails to respond, execute a structured retry strategy:

* **Timeouts**: Limit HTTP request timeouts to 5-10 seconds to avoid blocking outbound worker threads.
* **Retry Schedule**: Implement exponential backoff (e.g., retrying after 1 min, 5 mins, 30 mins, 2 hours, 6 hours) over a 24-hour period before disabling the webhook subscription.
* **Status Codes**: Only treat `2xx` responses as success. Treat redirects (3xx), client errors (4xx), and server errors (5xx) as delivery failures.

Publish the schedule you actually implement. A receiver cannot size its own replay window, or tell "still coming" apart from "given up", against a policy it has not been told.

Record every attempt while you are at it, rather than the current state of each delivery. See [webhook delivery history](/guides/webhook-delivery-history) for why the distinction matters and what each record should hold.

---

## 3. Idempotency on the Receiver

Webhook consumers must design their endpoints to be idempotent. Due to delivery retries, they may receive the same event multiple times. They should check the event UUID against a local cache or database before executing business operations.

---

## 4. Typed, Versioned Payloads

Every payload should carry an explicit event `type`, and that type is a contract in its own right.

The reason is stronger than readability. Two payloads over the same underlying object are often structurally similar enough to be mistaken for one another, and a receiver that dispatches on shape rather than on a declared type can be led into treating one as the other. An explicit type removes the ambiguity, and when the payload is signed, it means the signature covers what the message *claims to be* as well as what it contains.

```json
{
  "id": "evt_9d3d1f",
  "type": "invoice.paid",
  "created": "2026-09-24T10:15:00Z",
  "data": { }
}
```

### Changing a payload

Once consumers are parsing an event, its shape is published. The rules are the same as for any other part of an API contract, with one difference: you cannot see who is depending on which field, because a receiver never tells you what it read.

* **Adding an optional field is safe.** Receivers should be tolerant readers and ignore what they do not recognize.
* **Removing a field, renaming one, or changing what an existing field means is a breaking change**, and it is worse than the equivalent break in a request/response API because it fails silently on someone else's server, hours later, in code you cannot see.
* **A breaking change is therefore a new event type, not a quiet mutation** of the existing one. Emit `invoice.paid.v2` alongside `invoice.paid`, let subscribers choose, and retire the old one on a published timeline the way you would retire an endpoint.

Never reuse an existing type with different semantics. A receiver that was working will keep accepting the message, keep verifying the signature, and start doing the wrong thing.

See [versioning](/guides/versioning) and [deprecation and sunsetting](/guides/deprecation-sunsetting) for the retirement half, and [CloudEvents](/specifications/cloudevents) for a standard envelope that already carries `type`, `id` and `time`.
