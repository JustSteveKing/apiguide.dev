---
name: "WireMock"
description: "A simulator for HTTP-based APIs, enabling developers to mock downstream dependencies in integration tests."
category: "testing-mocking"
lifecycleStages: ["testing"]
url: "https://wiremock.org"
pricing: "freemium"
---

## What is WireMock?

WireMock is a tool for simulating APIs and software dependencies, used for building stable development environments when APIs are unreliable or do not exist. It enables testing applications without dependencies, simulating edge cases, and developing dependent features in parallel.

## Why use it in the API Lifecycle?

* **HTTP Mocking and Matching**: Stub HTTP responses and match requests using URL patterns, headers, query parameters, cookies, and request body content.
* **Dynamic Response Templating**: Generate dynamic responses using Handlebars templating with request data, random values, and custom helpers.
* **Record & Playback**: Record interactions with real services and play them back during testing for realistic scenarios.
* **Fault Simulation**: Simulate network faults, delays, and malformed responses to test application resilience.
* **Request Verification**: Verify that an application made expected requests with the correct parameters and timing.
* **Extensible**: Extend WireMock with custom request matchers, response transformers, and admin API extensions.

## Best Practices

* Run WireMock as a standalone process, embedded in tests, or deployed as a service in any environment.
* Integrate with JUnit and other testing frameworks for test automation.
* Connect an AI coding agent to WireMock Cloud to build mock APIs, create stubs, and simulate failures.
* Utilize WireMock Runner to run API simulations locally, on private cloud, or in a CI/CD pipeline.
