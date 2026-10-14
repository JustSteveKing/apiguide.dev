---
title: "Standard Webhooks"
description: "An open specification for sending webhooks consistently: the webhook-id, webhook-timestamp and webhook-signature headers, HMAC-SHA256 and Ed25519 signing, and delivery rules."
currentVersion: "1.0.0"
officialUrl: "https://www.standardwebhooks.com/"
---

## What is Standard Webhooks?

Every webhook provider invented its own signing scheme. One puts a hex HMAC in a vendor-prefixed header, another a comma-separated timestamp and signature, a third signs only the body and has no replay protection at all. A consumer integrating with ten providers writes ten verifiers, and a provider designing a new system starts from a blank page and usually repeats someone else's mistakes.

Standard Webhooks is an open specification, with reference libraries, that fixes one answer: three headers, one signed-content format, a symmetric and an asymmetric scheme, and delivery rules for retries and failure. It is community-driven, guided by a technical steering committee drawn from webhook-sending companies. If you are designing a new webhook system, adopt it rather than inventing a format; your consumers may already have a verifier for it. For the wider design of webhook delivery see [webhooks](/guides/webhooks), and for the reasoning behind each verification step see [webhook signatures](/guides/webhook-signatures).

---

## 1. The Three Headers

```http
POST /webhooks/orders HTTP/1.1
Host: consumer.example.com
Content-Type: application/json
webhook-id: msg_2KWPBgLlAfxdpx2AI54pPJ85f4W
webhook-timestamp: 1767225600
webhook-signature: v1,K5oZfzN95Z9UVu1EsfQmfVNQhnkZ2pj9o9NDN/H/pI4=

{"type":"order.created","timestamp":"2026-01-01T00:00:00Z","data":{"id":"ord_9f8e7d6c"}}
```

The signature value is illustrative; it was not computed over this body.

| Header | Contents |
| :--- | :--- |
| `webhook-id` | A unique identifier for the message. It stays the **same across retries** of that message. |
| `webhook-timestamp` | Integer Unix timestamp, in seconds, of **this delivery attempt**. It changes on each retry. |
| `webhook-signature` | A space-delimited list of signatures, each `<version>,<base64 signature>`. |

The two IDs behave differently on purpose. `webhook-id` is stable, so it is the consumer's idempotency key: record it and drop any message you have already processed. `webhook-timestamp` is fresh each attempt, so a retry hours later still falls inside the consumer's replay window.

---

## 2. What Gets Signed

The signed content is the message ID, the timestamp and the raw body, joined with full stops:

```text
signed_content = "{webhook-id}.{webhook-timestamp}.{body}"
```

Including the ID and timestamp is what makes the signature worth having. An attacker who captures a delivery cannot change its timestamp without invalidating the signature, so once the window passes the captured request is useless.

The body must be the exact bytes sent. A consumer that parses the JSON and re-serializes it before verifying will fail intermittently, on key order, whitespace or escaping.

---

## 3. Signature Schemes

| Identifier | Algorithm | Key format |
| :--- | :--- | :--- |
| `v1` | HMAC-SHA256 | Shared secret, base64, prefixed `whsec_` |
| `v1a` | Ed25519 | Secret key prefixed `whsk_`, public key prefixed `whpk_`, both base64 |

For `v1`, the secret is random and between 24 and 64 bytes. The `whsec_` prefix identifies the secret; the key material is the base64-decoded remainder, which is what the reference libraries use as the HMAC key. The prefix exists so that a secret pasted into a log, a ticket or a repository is recognizable, and so that secret scanners can find it.

### Verifying

1. Reject the request if `webhook-timestamp` is outside your tolerance of the current time. The spec leaves the window to you; a few minutes is typical, with NTP-synchronized clocks.
2. Build the signed content from the headers and the raw body.
3. Compute the expected signature and compare it with **each** entry in `webhook-signature` using a constant-time comparison. Accept if any entry with a version you support matches.

Entries with a version you do not implement simply never match, so a sender can add a new scheme without breaking existing consumers.

The list exists for zero-downtime secret rotation: during a rotation the sender signs with both the old and the new secret, and a consumer holding either one verifies successfully.

### Choosing between them

Default to `v1`. Use `v1a` when consumers should be able to verify but never forge, for example when the consumer stores payloads as evidence and may later need to show a third party what the sender said. An HMAC secret lets anyone who can verify also sign.

---

## 4. Payload and Delivery Rules

The recommended payload is JSON with three top-level fields: `type`, a full-stop-delimited event type such as `order.created`; `timestamp`, the time of the event in ISO 8601; and `data`, the event itself.

The spec also defines how senders treat responses:

| Response | Sender behavior |
| :--- | :--- |
| `2xx` | Delivered. |
| `3xx` | Failure. Redirects are not followed; the consumer should update the endpoint URL. |
| [`410 Gone`](/status-codes/410) | Disable the endpoint and stop sending to it. |
| [`429 Too Many Requests`](/status-codes/429), [`502 Bad Gateway`](/status-codes/502), [`504 Gateway Timeout`](/status-codes/504) | Failure, and throttle further deliveries. |
| Anything else | Failure, retry later. |

Senders should time out a delivery after somewhere between 15 and 30 seconds, honor [`Retry-After`](/headers/retry-after), and retry with exponential backoff and jitter over a period of days rather than minutes. See [retries and backoff](/guides/retries-backoff).

For consumers, the consequence is simple: acknowledge fast. Verify, persist the message, return `2xx`, and do the work asynchronously. A handler that does the work inline and takes longer than the sender's timeout gets the same message again.

---

## Best Practices

* Use the reference libraries for verification rather than writing your own. The common bugs (verifying a re-serialized body, ordinary string comparison, ignoring all but the first signature) are already handled there.
* Deduplicate on `webhook-id`, never on the signature or the timestamp, both of which change between retries.
* Do not send `3xx` from a webhook endpoint to move it. Senders following the spec treat it as a failure.
