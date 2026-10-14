---
name: "Schemathesis"
description: "A property-based API testing tool that generates thousands of requests from an OpenAPI or GraphQL schema and checks every response against it."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://schemathesis.io"
pricing: "open-source"
---

## What is Schemathesis?

Schemathesis is an open-source, MIT-licensed tool that tests an API by generating requests from its [OpenAPI](/specifications/openapi) or [GraphQL](/specifications/graphql) schema. It is built on Hypothesis, the Python property-based testing library, so instead of running the handful of cases someone wrote by hand, it derives valid and deliberately invalid inputs from the schema, sends them to a running API, and checks each response against what the schema promises. It runs as a CLI (`st run`), as a pytest plugin, and as a GitHub Action, and it supports OpenAPI 2.0 through 3.2.

## Why use it in the API Lifecycle?

* **Finds the cases nobody wrote**: Generated inputs hit boundary values, unusual strings and missing fields that hand-written tests rarely cover, which is where [`500 Internal Server Error`](/status-codes/500) responses hide.
* **Checks the spec against the implementation**: Built-in checks include `not_a_server_error`, `status_code_conformance`, `content_type_conformance`, `response_headers_conformance` and `response_schema_conformance`, so undocumented status codes and responses that drift from the schema fail the run.
* **Negative testing**: `negative_data_rejection` asserts that invalid input gets an error status rather than being accepted, and `positive_data_acceptance` asserts the reverse for valid input. Both accept a configurable `expected-statuses` list. `--mode positive|negative|all` controls which is generated.
* **Stateful testing**: The `stateful` phase chains operations into workflows (create, then read, then delete) using OpenAPI links or links it infers from the schema, and checks such as `use_after_free` and `ensure_resource_availability` catch resources that survive deletion or vanish after creation.
* **Authorization checks**: `ignored_auth` flags operations that answer without the credentials the schema requires, and `object_level_authorization` probes for one caller reading another's resources.
* **CI-ready output**: Reports in JUnit, HAR, VCR, NDJSON, Allure and HTML formats, with failures reproducible as plain `curl` commands.

## Best Practices

* Run it against a disposable or staging environment, never production. It sends real create, update and delete requests with hostile data, and it will find the ones that work.
* Start with `uvx schemathesis run ./openapi.yaml --url http://localhost:8000` locally, then add the GitHub Action to every pull request so a schema change and its implementation are tested together. The wider testing strategy is in [API Testing](/guides/api-testing).
* Fix the schema, not just the code. A large share of first-run failures are an OpenAPI document that omits a [`404 Not Found`](/status-codes/404) or a [`422 Unprocessable Content`](/status-codes/422) the API really returns; documenting it is the correct fix.
* Pass credentials with `-H 'Authorization: Bearer ...'` or the auth configuration in `schemathesis.toml`, and run once without them to confirm unauthenticated calls get [`401 Unauthorized`](/status-codes/401).
* Keep `-n` (`--max-examples`) modest on every pull request and raise it in a nightly job. Use `--report junit` so failures show up in the CI test view rather than in a log nobody reads.
* Treat a `not_a_server_error` failure as a bug every time. A malformed request should produce a 4xx with a [problem details](/specifications/problem-details) body, never a stack trace.
