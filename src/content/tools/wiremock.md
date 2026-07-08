---
name: "WireMock"
description: "A simulator for HTTP-based APIs, enabling developers to mock downstream dependencies in integration tests."
category: "testing-mocking"
lifecycleStages: ["testing"]
url: "https://wiremock.org"
pricing: "open-source"
---

## What is WireMock?

WireMock is an open-source library and server for stubbing and mocking HTTP services. It runs a mock server that matches specific requests (using regex headers, paths, or body content) and returns custom responses.

## Why use it in the API Lifecycle?

* **Stub Third-Party APIs**: Mock downstream dependencies (like Stripe, SendGrid, or internal microservices) in integration tests, making tests fast and deterministic.
* **Simulate Failures**: Test client resilience by configuring WireMock to simulate slow network responses (delays), broken connections, or server faults (HTTP 500/503).
* **Stateful Behavior**: Allows mock endpoints to change states across sequential requests (e.g. simulating a state machine).

## Best Practices

* Keep WireMock configurations versioned alongside your test suites to prevent environment drift.
