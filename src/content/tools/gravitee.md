---
name: "Gravitee"
description: "An API management platform with an Apache 2.0 open-source gateway, plus enterprise editions covering event streams, Kafka and AI agent traffic."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://www.gravitee.io"
pricing: "freemium"
---

## What is Gravitee?

Gravitee is an API management platform whose core, Gravitee API Management (APIM), is open source under Apache 2.0. APIM consists of a gateway, a management API, a management console and a developer portal. APIs are exposed to consumers through plans (Keyless, API Key, JWT, OAuth2, mTLS and others) that consumers subscribe to through applications. Gravitee's v4 API model separates entrypoints, the protocol a consumer uses, from endpoints, the backend the gateway talks to, which is how it exposes a Kafka topic over HTTP, WebSocket, Server-Sent Events or webhooks. That event-native side, along with agent and LLM proxying, data logging masking and an enterprise policy pack, belongs to the commercial Enterprise Edition, which requires a license. Gravitee also sells access management and an AI agent management layer covering MCP and A2A traffic.

## Why use it in the API Lifecycle?

* **Plans and subscriptions**: Each API carries one or more plans that define how consumers authenticate and what limits apply, with subscription approval and per-subscription keys.
* **Policy engine**: Rate limiting, quotas, transformation, caching and security policies are attached to flows at the API or plan level.
* **Event APIs**: In the Enterprise Edition, message APIs mediate between HTTP-style entrypoints and brokers such as Kafka, so consumers that cannot speak the broker protocol can still subscribe.
* **Developer portal**: Published APIs, documentation and self-service subscription for consumers.
* **Analytics and logging**: Per-API and per-application analytics, with request logging that can be masked in the Enterprise Edition.
* **Deployment options**: Self-hosted, hybrid or SaaS, with the gateway deployable separately from the control plane.

## Best Practices

* Avoid shipping a production API with only a Keyless plan. Keyless consumers appear in analytics as an unknown application, so you lose per-consumer metering, and Gravitee evaluates JWT, OAuth2 and API Key plans before Keyless, which means a request carrying a credential that matches no plan receives a [`401 Unauthorized`](/status-codes/401) rather than falling back to anonymous access.
* Put rate limits and quotas on plans rather than on the API as a whole, so limits follow the commercial tier a consumer subscribed to. Return [`429 Too Many Requests`](/status-codes/429) with [`Retry-After`](/headers/retry-after) and the [`RateLimit`](/headers/ratelimit) fields.
* Check which edition a feature lives in before you design around it. Gravitee lists Kafka and other broker endpoints, SSE, webhook and WebSocket entrypoints, data logging masking and the LLM, MCP and A2A proxies as Enterprise Edition features.
* Mask credentials and personal data before turning on request and response body logging, or leave body logging off. Gateway logs are a common place for tokens to leak.
* Pin your documentation reading to your installed APIM version. Gravitee's docs are versioned per release and configuration fields differ between versions.
* Forward [`traceparent`](/headers/traceparent) and [`X-Forwarded-For`](/headers/x-forwarded-for) to backends and send gateway telemetry to the same [OpenTelemetry](/specifications/opentelemetry) pipeline as your services.
