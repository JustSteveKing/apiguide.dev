---
name: "Mockoon"
description: "An easy-to-use local desktop mock server generator featuring a graphical interface."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://mockoon.com"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is Mockoon?

Mockoon is an MIT-licensed tool for designing and running mock HTTP APIs locally. The desktop app is where you define routes and responses; the same environment file then runs headless through the CLI (`@mockoon/cli`) or the `mockoon/cli` Docker image, which is how mocks get into CI. Mockoon Pro is a paid, self-hosted add-on for teams that adds collaboration, data sync and managed mock deployments on your own infrastructure. Everything runs offline; there is no account requirement for the free tools.

## Why use it in the API Lifecycle?

* **Rules-based responses**: Each route can have several responses, chosen by rules that match the request body, query parameters, headers, cookies, route parameters, path, method or request number, combined with OR by default or AND per response.
* **Templating**: Handlebars-style helpers and Faker generate response bodies from request data, so a mock can echo IDs and produce realistic data.
* **Stateful mocks**: Data buckets and CRUD routes give a mock a small in-memory JSON store, so a `POST` followed by a `GET` returns what was created.
* **OpenAPI in and out**: Import Swagger 2.0 or OpenAPI 3.x documents to scaffold routes, or pass an OpenAPI file directly to `mockoon-cli start --data`.
* **Proxy and recording**: Forward unmatched routes to a real API (partial mocking) and record real responses to turn them into mock routes.
* **Failure simulation**: Per-response latency, error statuses and callbacks let you rehearse slow and failing dependencies.

## Best Practices

* Commit the Mockoon environment file to the repository that uses it and start it in CI with `mockoon-cli start --data ./mocks/payments.json --port 3001`. A mock that lives on one developer's desktop is not a test fixture.
* Prefer Mockoon's own data file over a raw OpenAPI file when the mock has behavior. The CLI accepts OpenAPI directly, but the documentation is explicit that not every Mockoon feature (rules, templating) maps to OpenAPI, so behavior is lost in the round trip. Use the OpenAPI import to scaffold, then curate.
* Mock the failure paths, not just the happy path. Add rule-matched responses for [`401 Unauthorized`](/status-codes/401), [`404 Not Found`](/status-codes/404), [`429 Too Many Requests`](/status-codes/429) with a [`Retry-After`](/headers/retry-after) header, and [`503 Service Unavailable`](/status-codes/503), and give at least one response realistic latency so client timeouts and [retries](/guides/retries-backoff) get exercised.
* Return error bodies in the same shape as the real API, for example [Problem Details](/specifications/problem-details) with `application/problem+json`. A mock that returns `{"error": "bad"}` where production returns a problem document trains the client to parse the wrong thing.
* Use `--log-transaction` in CI so a failing test shows the exact request the client sent and the response the mock chose.
* Re-record or re-import when the real API changes. Mocks drift silently; pair them with contract checks such as [Pact](/tools/testing-mocking/pact) or schema-driven testing so drift fails a build, as discussed in [Testing APIs](/guides/api-testing).
