---
name: "Envoy Proxy"
description: "A CNCF-graduated, open-source L7 edge and service proxy with dynamic xDS configuration, the data plane underneath many gateways and service meshes."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://www.envoyproxy.io"
pricing: "open-source"
---

## What is Envoy Proxy?

Envoy is an open-source edge and service proxy, originally built at Lyft and now a graduated Cloud Native Computing Foundation project, licensed under Apache 2.0. It terminates and originates TLS, routes HTTP/1.1, HTTP/2, HTTP/3 and gRPC traffic, and is configured either statically or at runtime through the xDS APIs, so routes, clusters and policy change without a restart. Envoy is a proxy, not an API management product: it has no developer portal, API catalog or subscription model. Those come from the products built on it. The Envoy project's own [Envoy Gateway](https://gateway.envoyproxy.io) packages Envoy as a standalone or Kubernetes API gateway that implements and extends the Kubernetes Gateway API, and is the shortest route to running Envoy at the edge without writing raw xDS configuration.

## Why use it in the API Lifecycle?

* **Dynamic configuration**: The xDS APIs let a control plane push listeners, routes and clusters to a running fleet, which is why so many gateways and meshes use Envoy as their data plane.
* **Resilience at the edge**: Retries, circuit breaking, outlier detection and request shadowing are built in, configured per route or per upstream cluster.
* **Rate limiting**: A local rate limit filter enforces per-instance token buckets, and global rate limiting delegates the decision to an external rate limit service so every instance shares one counter.
* **Security**: TLS and mutual TLS, JWT authentication, RBAC and an external authorization filter that hands the allow or deny decision to your own service.
* **Observability**: Detailed L7 statistics, configurable access logs and native distributed tracing, including an OpenTelemetry tracer that exports spans over OTLP.
* **Extensibility**: Custom request handling through Wasm, Lua, dynamic modules or external processing, without forking the proxy.

## Best Practices

* Start with Envoy Gateway and Gateway API resources unless you are building your own control plane. Hand-written xDS configuration is verbose, and a misconfigured listener fails in ways that are hard to see.
* Set `use_remote_address` and `xff_num_trusted_hops` deliberately on the edge listener. By default Envoy does not append to [`X-Forwarded-For`](/headers/x-forwarded-for), and the client address it derives is only as trustworthy as the number of proxies you have told it sit in front of it. Never key a rate limit on an address taken from an untrusted header.
* Prefer global rate limiting for limits a client should see consistently. A local limit multiplies by the number of instances, so a client spread across replicas gets more than the stated quota.
* The local rate limit filter can emit `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset` (`enable_x_ratelimit_headers`, off by default). Those follow draft-polli-ratelimit-headers-03, an older draft than the IETF [`RateLimit`](/headers/ratelimit) and [`RateLimit-Policy`](/headers/ratelimit-policy) fields; document which one clients should parse. Rejections default to [`429 Too Many Requests`](/status-codes/429), which is correct; do not change it to a 5xx.
* Choose one trace context format for the whole system. Envoy's Zipkin tracer defaults to B3 headers and only reads [`traceparent`](/headers/traceparent) in its `USE_B3_WITH_W3C_PROPAGATION` mode, and Envoy cannot join a trace on its own: each service must copy the incoming context onto its outbound calls. Instrument services with [OpenTelemetry](/specifications/opentelemetry) and W3C Trace Context so the proxy spans and the application spans land in the same trace.
* Keep `x-request-id` generation on and log it in every service. It correlates logs across hops regardless of which tracer you run.
