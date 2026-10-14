---
name: "Kong Gateway"
description: "A cloud-native, high-performance API gateway built on Nginx, serving as a centralized proxy for routing and security."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://konghq.com"
pricing: "freemium"
---

## What is Kong Gateway?

Kong Gateway is an API gateway from Kong Inc., built on OpenResty (NGINX with LuaJIT). It sits in front of upstream services as a reverse proxy, and its behavior is configured through a small set of entities: services (the upstream), routes (which requests reach a service), consumers (who is calling) and plugins (what happens to the request on the way through, such as authentication, rate limiting, transformation and logging). The open-source gateway is Apache-2.0 on GitHub, with releases and prebuilt `kong` images on Docker Hub, but those releases have stayed on the 3.9 line (3.9.4 at the time of writing) while Enterprise versions have moved past 3.10. Since Enterprise 3.10, starting an Enterprise build without a license behaves like an expired license; the old unlicensed "free mode" is gone, so the open-source build is the free option. Kong Gateway Enterprise adds licensed plugins and features, and Kong Konnect is the hosted control plane that manages either Kong-hosted or self-hosted data planes. Kong now also markets the platform for LLM and MCP traffic through its AI Gateway plugins.

## Why use it in the API Lifecycle?

* **Plugin model**: Authentication (key auth, JWT, OAuth 2.0 introspection, OpenID Connect in Enterprise), traffic control, transformation and logging are plugins scoped globally, per service, per route or per consumer, so policy is attached where it applies.
* **Rate limiting**: The Rate Limiting plugin counts per consumer, credential, IP or header with `local`, `cluster` or `redis` counters, returns [`429 Too Many Requests`](/status-codes/429) with [`Retry-After`](/headers/retry-after), and sends [`RateLimit-Limit`](/headers/ratelimit-limit), [`RateLimit-Remaining`](/headers/ratelimit-remaining) and [`RateLimit-Reset`](/headers/ratelimit-reset) headers.
* **Deployment modes**: Traditional mode with a database, DB-less mode from a declarative file, or hybrid mode with a control plane pushing configuration to data plane nodes.
* **Declarative configuration**: decK manages gateway configuration as state files that can be diffed, reviewed and synced from CI.
* **Kubernetes**: The Kong Ingress Controller configures the gateway from Kubernetes resources, including the Gateway API.

## Best Practices

* Manage configuration declaratively with decK and never by hand in production: keep the state file in Git, run `deck gateway diff` in the pull request so reviewers see exactly what changes, and `deck gateway sync` from the pipeline after merge. Manual Admin API calls drift and cannot be reviewed.
* Do not expose the Admin API. It can reconfigure every route and plugin, so bind it to localhost or a private network, put authentication in front of it, and prefer DB-less or hybrid mode so data plane nodes do not accept configuration writes at all.
* Pick the rate limiting policy from your topology: `local` counters drift as you add nodes unless a consistent-hashing load balancer sits in front, `cluster` is accurate but not supported in hybrid mode or Konnect, and `redis` is the usual production choice. Limit per consumer or credential rather than per IP, which punishes everyone behind a shared NAT. See [Rate Limiting](/guides/rate-limiting).
* Replace Kong's default error bodies, such as `{"message":"API rate limit exceeded"}`, with a consistent [problem details](/specifications/problem-details) format if your upstreams already use one, so clients parse one error shape whether the gateway or the service rejected the call.
* Set timeouts and retries per service deliberately. The service `retries` field defaults to 5, and Kong retries idempotent methods on read and write timeouts; [`POST`](/methods/post) and [`PATCH`](/methods/patch) are not retried on those timeouts unless NGINX's `proxy_next_upstream non_idempotent` is enabled, and enabling it without an [`Idempotency-Key`](/headers/idempotency-key) scheme risks duplicate writes. Lower `retries` for slow upstreams, where five retries multiply load exactly when the service is struggling. See [Retries and Backoff](/guides/retries-backoff) and [Idempotency](/guides/idempotency).
* Strip or overwrite identity headers at the edge. If upstreams trust consumer identity headers that the authentication plugins add, make sure a client cannot send its own copy, and set a correlation ID (or [`traceparent`](/headers/traceparent)) so gateway logs join up with service traces.
