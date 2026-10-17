---
name: "Traefik"
description: "An MIT-licensed cloud-native reverse proxy that configures routes from Kubernetes, Docker and other providers, with Traefik Hub adding commercial API gateway and API management layers."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://traefik.io"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is Traefik?

Traefik Proxy is an open-source application proxy from Traefik Labs, licensed under MIT and currently on its v3 line. Its distinguishing feature is service discovery: rather than maintaining a static routing file, it watches providers such as Kubernetes (Ingress, its own CRDs and the Gateway API), Docker, Swarm, Nomad, Consul and ECS, and builds routes from the labels and resources it finds. Traefik Labs sells two commercial layers on top of the open-source proxy under the Traefik Hub name. Traefik Hub API Gateway adds gateway features beyond the proxy, with AI Gateway and MCP Gateway as add-ons. Traefik Hub API Management adds an API catalog, versioning, subscriptions and plans, and a developer portal. When someone says "Traefik" they usually mean the free proxy; check which product a feature belongs to before you plan around it.

## Why use it in the API Lifecycle?

* **Automatic routing**: Routes appear and disappear as containers and Kubernetes resources do, which removes a class of deploy-time drift between services and the proxy.
* **TLS automation**: An ACME certificate resolver obtains and renews certificates without a separate tool.
* **Middlewares**: Rate limiting, header manipulation, redirects, retries, circuit breakers, forward authentication and IP allow-lists are composed per route.
* **Protocol coverage**: HTTP/2, HTTP/3, gRPC, WebSocket and TCP/UDP routing from the same entrypoints.
* **OpenTelemetry tracing**: Traces are exported over OTLP/HTTP or OTLP/gRPC to an OpenTelemetry Collector or compatible backend.
* **API management upgrade path**: Traefik Hub keeps the proxy's configuration model and adds API lifecycle features, so a team can start on the open-source proxy and adopt the commercial layer later.

## Best Practices

* Set `forwardedHeaders.trustedIPs` on each entrypoint to the addresses of the load balancers in front of Traefik, and leave `forwardedHeaders.insecure` off outside local testing. Insecure mode trusts [`X-Forwarded-For`](/headers/x-forwarded-for) and the other `X-Forwarded-*` headers from anyone, which lets a client choose the IP your logs and rate limits see.
* Configure the `ratelimit` middleware's `sourceCriterion` explicitly. By default it keys on the remote address, which behind a load balancer is the load balancer; use `ipStrategy.depth` matched to your real proxy count, or `requestHeaderName` for an authenticated client identifier.
* Back the rate limiter with Redis when you run more than one replica. Without it, limits are held in memory per instance and a client gets the limit multiplied by the replica count. The middleware documents no rate limit response headers, so if clients need [`RateLimit`](/headers/ratelimit) and [`Retry-After`](/headers/retry-after) to back off before hitting [`429 Too Many Requests`](/status-codes/429), the service behind it has to send them.
* Prefer the Kubernetes Gateway API provider for new clusters over Ingress annotations. Routing then lives in portable resources rather than Traefik-specific labels, which keeps a later move to another gateway cheap.
* Enable tracing and point it at an OpenTelemetry Collector rather than a vendor backend directly, and make sure services propagate [`traceparent`](/headers/traceparent) so proxy spans and application spans join up. See [OpenTelemetry](/specifications/opentelemetry).
* Keep dynamic configuration in version control (CRDs, Docker labels in Compose files, or file provider YAML) rather than editing it on a running host.
