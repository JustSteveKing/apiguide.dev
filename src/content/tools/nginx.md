---
name: "NGINX"
description: "The BSD-licensed web server, reverse proxy and load balancer that sits in front of a large share of HTTP APIs, with F5 NGINX Plus as its commercial edition."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://nginx.org"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is NGINX?

NGINX is an HTTP web server, reverse proxy, content cache, load balancer and TCP/UDP proxy, originally written by Igor Sysoev and released under the 2-clause BSD license. The open-source project lives at nginx.org, which hosts the source, releases and the module reference documentation; that is the canonical URL for this page. nginx.com now redirects to F5's product pages, because the commercial side belongs to F5, Inc. F5 NGINX Plus is the paid edition: it extends open-source NGINX with active health checks, an API for changing upstream configuration without a reload, a much larger set of real-time metrics, and commercial support. NGINX is not an API management platform. It has no developer portal or key provisioning, and most teams use it as the reverse proxy in front of their application or as the data plane under something that does provide those features.

## Why use it in the API Lifecycle?

* **Reverse proxy and load balancing**: `proxy_pass` to upstream groups with round-robin, least-connections or hash-based balancing, plus passive health checks in the open-source build.
* **Rate and connection limiting**: `limit_req` enforces a leaky-bucket request rate per key, and `limit_conn` caps concurrent connections.
* **TLS termination**: HTTP/2 and HTTP/3 at the edge, so upstream services can speak plain HTTP on a private network.
* **Caching**: `proxy_cache` stores upstream responses and honors their caching headers, which takes load off read-heavy endpoints.
* **OpenTelemetry tracing**: The `ngx_otel_module` dynamic module (packaged as `nginx-module-otel`) exports spans over OTLP/gRPC and handles W3C trace context propagation.
* **Commercial edition**: NGINX Plus adds active health checks, dynamic reconfiguration through an API and deeper monitoring for teams that need them and want vendor support.

## Best Practices

* Set `limit_req_status 429;` wherever you use `limit_req`. The default is `503`, which tells a client the server is broken rather than that it is sending too fast, and well-behaved clients treat [`503 Service Unavailable`](/status-codes/503) and [`429 Too Many Requests`](/status-codes/429) differently. Add a [`Retry-After`](/headers/retry-after) header on the rejection, and give `add_header` the `always` parameter: without it, `add_header` only applies to 2xx and 3xx responses and the header never reaches the `429`.
* Use `burst` with `limit_req`. With the default burst of zero, two requests arriving in the same instant from a legitimate client are enough to trip the limit; add `nodelay` if you want the burst served immediately rather than queued.
* Key rate limits on `$binary_remote_addr` or an authenticated identifier, not a raw header value. Requests with an empty key are not counted at all, so a key built from a header the client can omit is a bypass.
* Append to forwarding headers rather than overwriting them: `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` along with `Host` and `X-Forwarded-Proto`. If you consume [`X-Forwarded-For`](/headers/x-forwarded-for) from an upstream load balancer, restrict trust with `set_real_ip_from` so clients cannot spoof their address. NGINX adds no forwarding headers unless configured to, and that includes the standardized [`Forwarded`](/headers/forwarded).
* Enable `ngx_otel_module` with `otel_trace_context propagate;` at the edge so an incoming [`traceparent`](/headers/traceparent) is continued rather than replaced, and export to an [OpenTelemetry](/specifications/opentelemetry) Collector. The default, `ignore`, neither reads nor writes the trace context headers, so NGINX's spans start a trace of their own instead of joining the caller's.
* Do not confuse the NGINX Ingress Controller (maintained by F5's NGINX team) with ingress-nginx (a separate Kubernetes community project). Their annotations and configuration are not interchangeable.
