---
name: "WireMock"
description: "A simulator for HTTP-based APIs, enabling developers to mock downstream dependencies in integration tests."
category: "testing-mocking"
lifecycleStages: ["testing"]
url: "https://wiremock.org"
pricing: "open-source"
---

## What is WireMock?

WireMock is an open-source HTTP mock server, licensed under Apache 2.0, used to stand in for APIs your code depends on. It runs embedded in JVM tests (with JUnit integration), as a standalone JAR, or as the `wiremock/wiremock` Docker image, and is configured either through a Java DSL or through JSON stub mappings and a REST admin API, so it can be used from any language. WireMock Cloud and WireMock Runner are separate commercial products from the same team that add hosted mocks, collaboration and team features on top of the open-source engine.

## Why use it in the API Lifecycle?

* **Request matching**: Stubs match on method, URL or URL pattern, query parameters, headers, cookies and body, including `equalToJson` and `matchesJsonPath` for JSON payloads.
* **Response templating**: Handlebars templates build responses from the request, so a stub can echo an ID from the path or a value from the body.
* **Stateful behavior**: Scenarios move a stub through named states, so a sequence such as create, then read, then delete can return different responses for the same request.
* **Fault and latency simulation**: Fixed or random delays (`fixedDelayMilliseconds`, `delayDistribution`), dribbled chunked responses, and faults such as `CONNECTION_RESET_BY_PEER`, `EMPTY_RESPONSE` and `MALFORMED_RESPONSE_CHUNK`.
* **Record and playback**: Proxy to a real service, record the traffic, and replay it as stubs.
* **Request verification**: The request journal lets tests assert that the code made the expected calls, with the expected headers and body, the expected number of times.

## Best Practices

* Simulate the failures your client must survive, not just the happy path: [`429 Too Many Requests`](/status-codes/429) with [`Retry-After`](/headers/retry-after), [`503 Service Unavailable`](/status-codes/503), a timeout via a delay longer than your client's limit, and a connection reset. A client that has never seen these in a test will meet them first in production. See [Retries and Backoff](/guides/retries-backoff).
* Verify the outgoing request, not just the result. Assert that the client sent the [`Idempotency-Key`](/headers/idempotency-key), [`Authorization`](/headers/authorization) and [`Content-Type`](/headers/content-type) it should, and that a retry reused the same idempotency key.
* Match loosely on what does not matter and strictly on what does. Use `equalToJson` with `ignoreExtraElements` or a `matchesJsonPath` on the fields the client must send, rather than an exact body match that breaks when an optional field is added.
* Treat recorded stubs as a starting point. Strip credentials, personal data and volatile headers such as [`Date`](/headers/date) from recordings before committing them, and re-record when the real API changes, or the mocks drift into fiction.
* Keep stubs honest against the provider's contract. A mock that returns a field the real API never sends hides a bug; generate or check stubs against the OpenAPI document, or pair WireMock with consumer-driven contracts in [Pact](/tools/testing-mocking/pact).
* Reset state between tests (`resetAll` or a fresh instance per test class) so scenario state and the request journal do not leak from one test into the next.
