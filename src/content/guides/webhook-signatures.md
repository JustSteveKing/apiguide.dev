---
title: "Webhook Signature Verification"
description: "How to verify incoming webhooks with HMAC-SHA256 signatures, signing secrets, timestamp-based replay protection, and constant-time comparison."
category: "security"
---

## Introduction to Webhook Signatures

A webhook endpoint is a public URL that accepts unsolicited HTTP requests. Because anyone who discovers the URL can POST to it, the receiver needs a way to confirm that a request genuinely came from the expected sender and that its body was not altered in transit. Signature verification solves this: the sender computes a cryptographic signature over the payload using a shared secret, transmits it in a header, and the receiver independently recomputes and compares it. This guide covers the dominant approach, HMAC-SHA256, along with the replay and timing protections that make it safe in practice.

---

## 1. HMAC-SHA256 and Shared Secrets

The most widely deployed scheme is a Hash-based Message Authentication Code (HMAC) built on SHA-256. Providers such as Stripe, GitHub, Shopify, Zendesk, and Slack all use SHA-256 for webhook signing. HMAC combines a **secret key**, shared out of band between sender and receiver, with the request payload to produce a signature that cannot be forged without the key.

The flow is symmetric:

* **Sender**: computes `HMAC-SHA256(secret, payload)` and sends the result in a custom header.
* **Receiver**: recomputes `HMAC-SHA256(secret, payload)` over the raw body and compares it to the header value.

Because the secret never travels over the wire, an attacker who intercepts a request cannot produce valid signatures for modified payloads.

Do not use MD5 or SHA-1. Both are considered cryptographically broken. HMAC is standardized in NIST FIPS 198-1, and SHA-256 (from FIPS 180-4) is the minimum recommended hash. Stripe explicitly forbids weaker hashes to prevent downgrade attacks.

```
signature = HMAC-SHA256(signing_secret, raw_request_body)
```

---

## 2. Sign the Raw Body

The single most common implementation bug is signing a re-serialized payload. The signature must be computed over the **raw request body exactly as received**, encoded as UTF-8. If you parse JSON and then re-stringify it, key ordering, whitespace, and Unicode escaping can all differ from what the sender signed, and verification will fail intermittently.

Capture the raw bytes before any body-parsing middleware runs, and hash those bytes directly.

```http
POST /webhooks/orders HTTP/1.1
Host: api.apiguide.dev
Content-Type: application/json
X-Hub-Signature-256: sha256=7d38c... (hex-encoded HMAC)

{"id":"evt_123","type":"order.created","data":{"amount":4200}}
```

Signatures are transmitted in a provider-specific header and encoded as either lowercase hex or base64. Common conventions include `X-Hub-Signature-256` (GitHub), `X-Shopify-Hmac-SHA256` (Shopify), `Qlik-Signature` (Qlik Cloud), and `webhook-signature` (Standard Webhooks). The algorithm is often prefixed to the value (`sha256=`) so the scheme is unambiguous.

---

## 3. Constant-Time Comparison

Once you have recomputed the expected signature, do not compare it with an ordinary string equality operator. Most language-native comparisons return as soon as they hit the first differing byte, which leaks, through response timing, how many leading bytes were correct. Over many requests an attacker can use that signal to reconstruct a valid signature byte by byte.

Use a **constant-time comparison** function that always inspects the full length regardless of where a mismatch occurs:

* Node.js: `crypto.timingSafeEqual()`
* .NET: `CryptographicOperations.FixedTimeEquals()`
* Go: `hmac.Equal()`
* Python: `hmac.compare_digest()`

```
expected = HMAC-SHA256(secret, raw_body)
received = decode(header["X-Hub-Signature-256"])

if not constant_time_equal(expected, received):
    reject(400)
```

The comparison inputs must be equal length, so decode both sides to bytes first. Remote timing attacks are noisy over a network, but the mitigation is cheap and unconditional, so always use it.

---

## 4. Replay Protection with Timestamps

A valid signed request that an attacker captures can be replayed verbatim, and the signature will still verify. HMAC alone does not prevent this. The standard defense is a **signed timestamp**.

The sender includes a timestamp in the signed content and typically also in a header. The receiver checks that the timestamp is within a small tolerance window of the current server time before accepting the request.

* Include the timestamp **inside the signed digest** so it cannot be tampered with.
* Reject requests outside a tolerance window, commonly **3 to 5 minutes** (Stripe's SDK defaults to 5 minutes).
* Keep server clocks synchronized via NTP, or legitimate requests will be falsely rejected.
* Use a Unix timestamp to avoid format ambiguity.

The Standard Webhooks specification defines the signed content as the message ID, timestamp, and payload joined by full stops, and sends metadata in the `webhook-id`, `webhook-timestamp`, and `webhook-signature` headers:

```
signed_content = f"{webhook_id}.{webhook_timestamp}.{raw_body}"
signature      = base64(HMAC-SHA256(secret, signed_content))
```

Note that a tolerance window can conflict with provider retries: if a sender retries after the window has elapsed, the retry will be rejected. Size the window with retry behavior in mind.

---

## 5. Nonces and Idempotency

Timestamps narrow the replay window but do not close it. A request can still be replayed within the tolerance period. Two complementary techniques harden the endpoint further:

* **Nonces**: the sender attaches a unique one-time identifier per delivery; the receiver tracks seen nonces and rejects duplicates.
* **Idempotency**: the receiver is designed to process each event exactly once, keyed on a stable event ID, regardless of how many times it arrives.

Idempotency is the most robust solution because it neutralizes duplicates from any cause (replays, retries, or at-least-once delivery), not just malicious ones. If your handler is fully idempotent, replay protection becomes a defense-in-depth measure rather than the sole safeguard. See [webhooks](/guides/webhooks) for delivery and retry design.

---

## 6. Secret Management and Rotation

The signing secret is the root of trust, so treat it accordingly.

| Practice | Rationale |
| --- | --- |
| Individualize secrets per listener | Limits the blast radius if one endpoint's secret leaks. |
| Support zero-downtime rotation | Sign with both old and new keys during a grace period so no delivery is dropped. |
| Rotate on a schedule and after incidents | Regular rotation caps the lifetime of any undetected leak. |
| Use random secrets (24-64 bytes) | Long, high-entropy keys resist brute force. |

Zero-downtime rotation means the sender signs each message with multiple active keys during the transition, letting receivers validate against either. This capability is rare in the wild, and surveys suggest under 10% of implementations offer it, so build it in deliberately.

---

## 7. Asymmetric Signatures

HMAC uses one shared secret, which means the receiver also holds a key capable of *forging* signatures. When the sender wants receivers to verify but never sign, asymmetric signatures are used instead: the sender signs with a private key and publishes a public key for verification.

The Standard Webhooks spec supports Ed25519 (identified as `v1a`) alongside symmetric HMAC (`v1`). Some providers issue signed JWTs, for example using ES384, with the public key exposed at a known endpoint. RFC 9421 "HTTP Message Signatures" generalizes this further, allowing signatures over selected headers and body components with algorithms including HMAC-SHA256, ECDSA, and EdDSA. For token-based schemes, see [JWT](/specifications/jwt).

### The signature outlives the request

Forgery risk is the usual argument for asymmetric signing, and it is the weaker half. The stronger one is what happens after verification.

A receiver handling anything consequential does not verify a payload and discard it. It stores the raw body, because that is the evidence of what it was told and when. The question is whether that stored copy still means anything a month later.

With HMAC it does not, in any way a third party can rely on:

* **Verifying requires the ability to forge.** Anyone who can check the stored payload holds the secret, and anyone holding the secret could have written it. The receiver cannot use it to demonstrate to an auditor, a customer or a court what the sender sent, because the receiver could have produced the same bytes.
* **Rotation invalidates the archive.** Rotate the shared secret, which section 6 recommends doing on a schedule, and every payload signed with the old one becomes uncheckable unless you keep retired secrets indefinitely. That is the opposite of what rotation is for.

An asymmetric signature has neither problem. The verifier holds only a public key, so checking a payload proves the sender produced it and does not enable anyone else to produce another. Rotation publishes a new key and leaves the old public key available, so archived payloads stay verifiable for as long as you publish the key that signed them. The check needs nothing agreed in advance and nothing that the two parties must both keep secret, which means it still works once the body has been copied out of the request and filed.

**Choose on that basis rather than on threat model alone.** HMAC is the right default for ordinary notifications, and it is what Stripe, GitHub, Shopify, Zendesk and Slack use. Prefer asymmetric signing when the event is something a receiver may later need to prove: financial movements, audit and compliance records, anything a regulator or a dispute could reach. The useful test is whether a receiver storing your payload would ever need to show it to a third party. If so, give them something that a third party can check without trusting either of you.

A practical consequence worth designing for: **a body that is independently signed does not need transport-level authentication to remain meaningful.** Put the signature over the payload itself rather than over a reconstruction of the HTTP request, and include the location of the key list in the body. Verification then needs nothing rebuilt from headers and nothing looked up from an agreement, which is exactly what makes a filed copy checkable years later.

---

## 8. Defense in Depth

Signature verification is necessary but not sufficient on its own. Layer additional controls:

* Serve the endpoint over **HTTPS** only, so payloads and headers are encrypted in transit.
* Return **generic error responses** to callers while logging detailed diagnostics internally.
* Log every request with timestamp, source, and verification outcome for auditing.
* Apply **rate limiting** to blunt abuse, and consider **IP allowlisting** when the sender publishes static IP ranges.
* Validate and sanitize all payload fields. A verified signature proves origin, not that the content is well-formed.

Avoid the recurring pitfalls: skipping constant-time comparison, omitting replay protection, using weak hashes, and signing anything other than the raw body. Getting these four right is the core of a secure webhook receiver. See [API security](/guides/api-security) for the broader picture.
