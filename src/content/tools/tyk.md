---
name: "Tyk"
description: "An open-source, enterprise-grade API gateway and management platform built in Go."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://tyk.io"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is Tyk?

Tyk is an API management platform built around Tyk Gateway, an open-source gateway written in Go and licensed under the Mozilla Public License 2.0 (with a separately licensed enterprise folder). The gateway handles REST, GraphQL, gRPC and TCP traffic, enforcing authentication, rate limits and quotas, and needs Redis as its only data store, for tokens, quotas and the Redis-backed rate limiters. The commercial platform adds the Dashboard, a Developer Portal and analytics, and can run fully self-managed, as a hybrid with Tyk's control plane managing gateways in your infrastructure, or in Tyk Cloud. Recent releases extend the same control plane to MCP servers, A2A traffic and LLM requests.

## Why use it in the API Lifecycle?

* **Gateway policies without a lockout**: Authentication (JWT, OIDC, bearer tokens, Basic Auth, client certificates), rate limits, quotas, versioning, allow and block lists and CORS are all in the open-source gateway.
* **OpenAPI as the API definition**: Tyk OAS API definitions keep an OpenAPI 3.0 document as the source of truth, with Tyk's gateway configuration carried alongside it.
* **Choice of rate limiter**: The default distributed rate limiter splits a limit across gateways without Redis; Redis-backed limiters enforce a cluster-wide sliding or fixed window.
* **GraphQL controls**: Field-based permissions and query depth limits per key or policy, and Universal Data Graph for composing several upstreams into one GraphQL schema.
* **Declarative operations**: Tyk Operator manages APIs and policies as Kubernetes resources, so gateway configuration is applied through GitOps.
* **AI traffic on the same plane**: Per-tool rate limits and filtered tool discovery for MCP servers, plus model allow-lists and spend budgets for LLM requests.

## Best Practices

* Manage API definitions and policies declaratively, with Tyk Operator on Kubernetes or definitions in Git applied by your pipeline, rather than editing them in the Dashboard. A gateway setting changed by hand cannot be reviewed or rolled back.
* Decide which numbers your clients see. Tyk's legacy `X-RateLimit-*` headers report quota data by default; from 5.13.0, `rate_limit_response_headers` switches them to rate-limit data. Pick one deliberately and document it, as discussed in [API Rate Limiting](/guides/rate-limiting) and the standard [`RateLimit`](/headers/ratelimit) header.
* Know that with the default distributed rate limiter, `X-RateLimit-Remaining` reflects only the current gateway's share of the limit. If clients pace themselves from that header, use a Redis-backed limiter so the number is true across the cluster.
* Separate rate limits from quotas in your design: a rate limit rejects bursts with [`429 Too Many Requests`](/status-codes/429), while a quota caps total usage over a billing period. Check what status and headers your Tyk version returns when a quota is exhausted, and make sure clients can tell the two apart; see [Quotas & Usage Metering](/guides/quotas-metering).
* Keep the OpenAPI document as the contract by using Tyk OAS definitions, and enable request validation against it at the gateway so malformed requests fail at the edge instead of reaching the service. The default rejection is [`422 Unprocessable Content`](/status-codes/422); set `errorResponseCode` if your API's convention is [`400 Bad Request`](/status-codes/400), so the gateway and the service do not disagree.
* Monitor Redis as part of the gateway. Tokens and distributed limits live there; a Redis outage is an authentication outage.
