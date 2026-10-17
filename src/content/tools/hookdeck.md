---
name: "Hookdeck"
description: "Webhook infrastructure in both directions: Event Gateway queues, filters and retries incoming webhooks, and Outpost, open source under Apache-2.0, delivers outbound webhooks and events to customers."
category: "webhooks"
lifecycleStages: ["development", "deployment", "monitoring"]
url: "https://hookdeck.com"
pricing: "freemium"
updatedDate: 2026-10-17
---

## What is Hookdeck?

Hookdeck builds webhook infrastructure for both sides of the exchange.

**Event Gateway** sits in front of your application for webhooks you receive. A **source** is a service that sends requests to Hookdeck, a **destination** is where events are delivered, and a **connection** routes one to the other. Between the two, Hookdeck queues events and controls delivery rate, retries failed deliveries automatically or by hand, filters and routes on payload content, runs JavaScript transformations, deduplicates, and raises issues when deliveries fail. There is a free Developer plan and paid plans above it.

**Outpost** is for webhooks you send. It is open source under Apache-2.0 in the `hookdeck/outpost` repository, written in Go, and can be self-hosted (it needs Redis, PostgreSQL and a supported message queue) or used as a managed service. It provides multi-tenant delivery with at-least-once guarantees, topic-based subscriptions, automatic and manual retries, a portal for your customers, OpenTelemetry output, and signature and timestamp headers by default. Besides plain webhooks it can deliver to destinations such as Amazon EventBridge, SQS, GCP Pub/Sub, Azure Service Bus, RabbitMQ and Kafka.

The **Hookdeck CLI** forwards events received on Event Gateway to a server on localhost, and the **Console** captures and inspects requests at a test URL with no account required.

## Why use it in the API Lifecycle?

* **Receiving is a reliability problem too.** A provider that sends a burst of webhooks during your deploy will retry on its own schedule, or not at all. A queue in front of your handler turns that burst into a controlled rate.
* **Local development against real webhooks.** The CLI makes a provider's real events reach a handler on your laptop without exposing it publicly.
* **Self-hostable sending.** Outpost gives you a delivery system with retries, tenancy and a customer portal under a permissive license, with the managed service as an option rather than a requirement.

## Best Practices

* **Verify signatures at the edge as well as in the handler.** Configure the source to verify the provider's signature so forged requests never reach the queue, and keep verification in your application for defense in depth. See [Webhook Signatures](/guides/webhook-signatures).
* **Make handlers idempotent.** Retries and replays mean the same event can arrive more than once. Deduplicate on the provider's event ID. See [Idempotency](/guides/idempotency).
* **Filter early.** Drop event types you do not handle at the gateway rather than acknowledging and discarding them in code, so your metrics reflect work you actually do.
* **Do not let transformations become business logic.** A transformation that reshapes a payload is configuration; one that decides what the business does is code living outside your repository and its tests.
* **For outbound webhooks, publish your retry schedule and expose delivery history.** Outpost's portal covers the second; the first belongs in your API documentation. See [Webhook Delivery History](/guides/webhook-delivery-history).
