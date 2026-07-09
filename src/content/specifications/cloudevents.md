---
title: "CloudEvents"
description: "An overview of the CloudEvents specification, the CNCF standard for describing event data in a common, vendor-neutral format."
currentVersion: "1.0.2"
officialUrl: "https://cloudevents.io/"
---

## What is CloudEvents?

CloudEvents is a CNCF specification that defines a common envelope for describing event data, independent of the platform, protocol, or serialization format carrying it. It doesn't replace an event broker or a message queue — it standardizes the metadata wrapped around whatever payload that broker is transporting, so that producers, consumers, and tooling can agree on the basic shape of "what is this event, and where did it come from?" without needing to understand each vendor's proprietary event format first.

---

## 1. The Common Event Envelope

Every CloudEvent carries a small set of required and optional context attributes alongside its actual payload:

* **`id`** (Required): A unique identifier for the event, used for deduplication.
* **`source`** (Required): A URI identifying the context in which the event occurred (e.g. `/orders/checkout-service`).
* **`type`** (Required): A string describing the kind of event that occurred, typically reverse-DNS namespaced (e.g. `com.apiguide.order.created`).
* **`specversion`** (Required): The CloudEvents spec version the event conforms to (currently `1.0`).
* **`data`**: The actual event payload, in whatever format the producer chooses (JSON, Avro, Protobuf, plain text).

```json
{
  "specversion": "1.0",
  "type": "com.apiguide.order.created",
  "source": "/orders/checkout-service",
  "id": "b8f1e2b0-1234-4a56-9abc-9f8e7d6c5b4a",
  "time": "2026-07-09T14:32:00Z",
  "datacontenttype": "application/json",
  "data": {
    "orderId": "ord_9f8e7d6c",
    "amount": 4999,
    "currency": "usd"
  }
}
```

This envelope can be transmitted as a structured message (the whole thing serialized as one JSON body) or in binary mode (the attributes mapped to protocol-specific headers, like HTTP headers or Kafka message headers, with `data` as the raw body). Both modes are defined by protocol binding specs layered on top of the core spec.

---

## 2. Why It Exists: Interoperability Across Event Platforms

Before CloudEvents, every cloud provider and messaging system had its own event envelope. An event coming out of one vendor's notification service looked nothing like an event coming out of another's, even when describing an equivalent occurrence (a file uploaded, a record updated, a webhook fired). That meant integration code, SDKs, and routing logic had to be rewritten per source system.

CloudEvents gives producers and consumers a shared minimum contract. Major platforms now emit or accept CloudEvents-formatted events natively:

* **AWS EventBridge**: Supports CloudEvents-formatted events for cross-account and cross-service routing.
* **Azure Event Grid**: Natively supports the CloudEvents JSON schema as one of its event delivery formats.
* **Google Cloud Eventarc**: Uses CloudEvents as its standard event format for triggering functions and workflows.
* **Knative Eventing**: Built around CloudEvents as its native event format for Kubernetes-based serverless workloads.

The practical benefit is portability: an event handler written against the CloudEvents envelope can consume events from any of these platforms with the same parsing logic, rather than needing a bespoke adapter per vendor.

---

## 3. CloudEvents and AsyncAPI: Complementary, Not Competing

CloudEvents and [AsyncAPI](/specifications/asyncapi) solve adjacent but distinct problems, and are commonly used together rather than as alternatives.

* **AsyncAPI** describes the *channels*: what topics or queues exist, what protocols and brokers they run on, what message schemas are permitted on each channel, and who publishes or subscribes to what.
* **CloudEvents** describes the *envelope*: a standard set of context attributes wrapping the `data` payload that flows through those channels.

In practice, an AsyncAPI document can declare that a message's payload conforms to the CloudEvents format, giving you channel-level documentation (via AsyncAPI) plus a portable, interoperable event structure (via CloudEvents) inside each message. Neither spec makes the other redundant: AsyncAPI has no opinion on your event's internal metadata shape, and CloudEvents has no concept of channels, brokers, or pub/sub operations at all.

## Best Practices

* Namespace your `type` attribute with a reverse-DNS-style prefix (e.g. `com.yourcompany.resource.action`) to avoid collisions as the number of event types grows.
* Treat `data` as opaque to the envelope — validate its schema separately (with AsyncAPI, JSON Schema, or Avro) rather than trying to make CloudEvents itself enforce payload structure.
