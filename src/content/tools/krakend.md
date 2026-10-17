---
name: "KrakenD"
description: "An ultra-performant, stateless API gateway built in Go, designed to handle large-scale routing without database dependencies."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://krakend.io"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is KrakenD?

KrakenD is a stateless, declarative API gateway written in Go. Its engine is the Lura Project, hosted by the Linux Foundation, and the Community Edition is open source under Apache 2.0; KrakenD Enterprise adds commercially licensed features and support. The whole gateway is defined in a single configuration file, typically `krakend.json`: each endpoint lists one or more backends, and KrakenD calls them, merges and reshapes the responses, and returns one payload to the client. Because all behavior lives in that file, every node is identical and there is no database to coordinate.

## Why use it in the API Lifecycle?

* **Aggregation**: One endpoint can fan out to several backends concurrently and merge the results, so a client makes one call instead of four. The `X-KrakenD-Completed` header tells the client whether every backend succeeded.
* **Response shaping**: `allow` and `deny` filter fields, `mapping` renames them, `group` nests a backend's response under a key, and `target` strips a wrapper such as `data`, so clients receive only what they use.
* **Zero-trust forwarding**: By default KrakenD forwards no client headers (except `Content-Type`), no query strings and no cookies to backends. Each one has to be listed in `input_headers` or `input_query_strings`.
* **Traffic controls**: Rate limiting, circuit breakers, concurrent calls, shadow proxying, bot detection and IP filtering are configured per endpoint or per backend.
* **Authentication**: Validates JWTs, API keys, Basic Auth and mTLS at the edge, and handles OAuth 2.0 client credentials toward backends.
* **Protocol bridging and telemetry**: Connects to REST, gRPC, GraphQL, SOAP, Lambda and message brokers such as Kafka, RabbitMQ and SQS, and exports metrics and traces through OpenTelemetry.

## Best Practices

* Run `krakend check -t -l -c krakend.json` in CI on every change. `--lint` validates the file against KrakenD's published JSON schema, catching unknown keys, wrong types and misplaced components, and `--test-gin-routes` starts the service briefly to catch conflicting routes.
* Run `krakend audit` alongside `check`. It evaluates the configuration against CIS-inspired security rules (a missing rate-limiting strategy, the `/__debug/` endpoint left enabled, insecure connections allowed) and reports each finding with a rule ID and severity. A clean audit means those rules passed, not that the API is secure.
* Keep the zero-trust default. List exactly the headers each backend needs in `input_headers`, such as [`Authorization`](/headers/authorization) or an [`Idempotency-Key`](/headers/idempotency-key), and avoid `"*"`: forwarding everything passes client-controlled headers like [`X-Forwarded-For`](/headers/x-forwarded-for) straight to services that may trust them.
* Treat `X-KrakenD-Completed: false` as a partial response. If your clients cannot tolerate missing fields, check that header rather than assuming a successful status means a full payload; KrakenD omits the cache header on incomplete responses for the same reason.
* Know which limiter answers with which status. The per-client limit (`client_max_rate`) rejects with [`429 Too Many Requests`](/status-codes/429), but the endpoint-wide `max_rate` rejects with [`503 Service Unavailable`](/status-codes/503), which clients and dashboards will read as an outage. Counters are kept in memory per node, so the effective cluster limit is the configured limit times the node count. See [API Rate Limiting](/guides/rate-limiting).
* Use flexible configuration (`FC_ENABLE=1` with `FC_TEMPLATES`, `FC_SETTINGS` and `FC_PARTIALS`) to split a large `krakend.json` into Go templates and per-environment settings, run `check` against the rendered output, and keep them in Git so every gateway change is reviewed like code. OpenAPI import and export is an Enterprise feature; on the Community Edition, keep the [OpenAPI](/specifications/openapi) document as the contract and test the gateway against it.
