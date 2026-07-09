---
title: "Webhooks & Event-Driven API Design"
description: "Best practices for webhooks, including secure payload signing (HMAC) and retry scheduling."
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

---

## 3. Idempotency on the Receiver

Webhook consumers must design their endpoints to be idempotent. Due to delivery retries, they may receive the same event multiple times. They should check the event UUID against a local cache or database before executing business operations.
