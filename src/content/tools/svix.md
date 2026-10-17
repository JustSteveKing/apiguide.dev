---
name: "Svix"
description: "Webhook sending as a service: one API call per event, with retries, signing, an embeddable consumer portal and receiving through Svix Ingest. The server is MIT-licensed and can be self-hosted."
category: "webhooks"
lifecycleStages: ["development", "deployment", "monitoring"]
url: "https://www.svix.com"
pricing: "freemium"
---

## What is Svix?

Svix is webhook infrastructure for API providers. Instead of building a delivery system, you make one API call per event and Svix handles delivery to every subscribed endpoint: retries, signing, logging and endpoint management. The main products are:

* **Dispatch**, the sending service.
* **The application portal**, an embeddable UI where your customers add endpoints, choose event types, see delivery attempts and replay failures.
* **Ingest**, for receiving webhooks from other providers reliably.

Svix implements the [Standard Webhooks](/specifications/standard-webhooks) specification, which it co-created. It sends `svix-id`, `svix-timestamp` and `svix-signature` headers, which are Svix-branded aliases of the specification's `webhook-id`, `webhook-timestamp` and `webhook-signature`, so any Standard Webhooks library can verify its messages.

A delivery succeeds on a `2xx` response within 30 seconds; anything else, including a redirect, is a failure. Failed messages are retried with exponential backoff: immediately, then after 5 seconds, 5 minutes, 30 minutes, 2 hours, 5 hours and two 10-hour waits. An endpoint that fails every attempt for five days is disabled by default.

There is a free plan, and paid plans above it. The server is open source under the MIT license in the `svix/svix-webhooks` repository, with official client libraries in many languages, so it can also be run on your own infrastructure.

## Why use it in the API Lifecycle?

* **Delivery is harder than it looks.** Queues, backoff, per-endpoint isolation, secret rotation and a record of every attempt are each small; together they are a product. See [Webhooks](/guides/webhooks).
* **A standard signature format.** Consumers verify with a published algorithm and off-the-shelf libraries instead of reverse-engineering a bespoke scheme.
* **Customer self-service.** The portal gives receivers the delivery history and replay control that otherwise arrive as support tickets. See [Webhook Delivery History](/guides/webhook-delivery-history).
* **An exit.** Because the server is open source, a hosted integration is not a dead end if you later need to run it yourself.

## Best Practices

* **Define event types explicitly.** Register each event type with a schema, so consumers subscribe to what they need and payloads are a versioned contract rather than whatever the code happened to send.
* **Tell consumers to verify the raw body.** The signature covers the exact bytes. A receiver that parses the JSON and re-serializes it before verifying will reject valid messages.
* **Publish the retry schedule in your own docs.** Consumers need it to size their replay window and to tell a late delivery from a lost one.
* **Use the event's message ID for deduplication.** Retries reuse the same `webhook-id`, so a receiver that records it can drop duplicates; at-least-once delivery means duplicates will happen. See [Idempotency](/guides/idempotency).
* **Do not hide the portal.** Disabled endpoints and failing deliveries are only actionable if the customer who owns the endpoint can see them.
