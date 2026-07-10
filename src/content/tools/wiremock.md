---
name: "WireMock"
description: "A simulator for HTTP-based APIs, enabling developers to mock downstream dependencies in integration tests."
category: "testing-mocking"
lifecycleStages: ["testing"]
url: "https://wiremock.org"
pricing: "freemium"
---

## What is WireMock?

WireMock is a tool used to simulate APIs and software dependencies, allowing teams to build stable development environments. It enables testing applications without live dependencies, simulating edge cases, and developing dependent features concurrently.

## Why use it in the API Lifecycle?

* **HTTP Mocking and Matching**: Stub HTTP responses and match incoming requests based on URL patterns, headers, query parameters, cookies, and request body content.
* **Dynamic Response Templating**: Generate responses dynamically using Handlebars templates, incorporating request data, random values, and custom helpers.
* **Record & Playback**: Capture interactions with actual services and replay them during testing to replicate realistic scenarios.
* **Fault Simulation**: Introduce network faults, delays, and malformed responses to assess an application's resilience.
* **Request Verification**: Confirm that the application sent expected requests with correct parameters and timing.
* **Extensibility**: Extend the tool with custom request matchers, response transformers, and administrative API extensions.

## Best Practices

* Test applications without relying on external dependencies.
* Develop dependent features in parallel by mocking unavailable APIs.
* Integrate WireMock with testing frameworks like JUnit for test automation.
* Simulate edge cases to ensure application resilience.
