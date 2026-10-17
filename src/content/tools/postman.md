---
name: "Postman"
description: "A comprehensive API platform for building, testing, organizing, and collaborating on HTTP requests."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://postman.com"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is Postman?

Postman is a commercial API platform from Postman, Inc., best known for its desktop and web client. Requests are grouped into collections, parameterized with environments and variables, and given behavior with JavaScript pre-request and post-response scripts that run in a sandbox exposing the `pm` object. Around that client sit mock servers, monitors that run collections on a schedule, Spec Hub for designing OpenAPI and AsyncAPI definitions, shared workspaces, and the Postman CLI, which runs collections, lints specifications and manages mocks from a terminal or CI job. There is a free plan; team collaboration and governance features are on paid plans.

## Why use it in the API Lifecycle?

* **Exploration and debugging**: Build requests for HTTP, GraphQL, gRPC and WebSocket APIs, inspect responses, and save them into collections that document real usage.
* **Scripted tests**: Post-response scripts assert on status, headers and body with `pm.test` and `pm.expect`, and can capture values into variables to chain one request into the next.
* **Mock servers**: Serve saved example responses so a client team can build against an API that does not exist yet.
* **CI execution**: `postman collection run` runs a collection with `--environment`, `--iteration-data` and `--reporters junit`, so the same tests that ran on a laptop gate a pipeline.
* **Governance**: `postman spec lint` checks a specification against a team's governance rules.
* **Monitoring**: Monitors run a collection on a schedule against a live environment and alert on failures.

## Best Practices

* Assert the contract, not the snapshot. Check the status with `pm.response.to.have.status(201)`, the [`Content-Type`](/headers/content-type), and the specific fields a client reads, rather than comparing whole bodies that change with every timestamp and ID.
* Test the failure paths deliberately: a request without credentials should get [`401 Unauthorized`](/status-codes/401) with a [`WWW-Authenticate`](/headers/www-authenticate) header, a malformed body [`400 Bad Request`](/status-codes/400) or [`422 Unprocessable Content`](/status-codes/422), and an unsupported method [`405 Method Not Allowed`](/status-codes/405) with an [`Allow`](/headers/allow) header. Most regressions show up in the error paths first. [API Testing](/guides/api-testing) covers where this sits relative to contract and load tests.
* Keep secrets out of collections. Reference tokens through variables backed by Postman Vault, never paste one into a request's headers, because exported and shared collections carry whatever is saved in them.
* Make requests independent or explicitly ordered. A request that silently relies on a variable set three requests earlier breaks the moment someone runs it alone; capture with `pm.collectionVariables.set` in the request that creates the value and document the dependency in the folder.
* Run collections in CI with the Postman CLI: `postman collection run <collection> -e <environment> --reporters junit --bail`. The non-zero exit on failure is the gate, and the JUnit report is what the pipeline displays.
* Treat the OpenAPI definition, not the collection, as the source of truth when one exists. Generate or sync collections from the specification so the two cannot drift, and lint the specification itself with `postman spec lint` or a tool such as [Spectral](/tools/design-documentation/spectral-stoplight).
* For tests that should live beside the code and review as plain text without an account, consider [Bruno](/tools/clients-debugging/bruno) or [Hurl](/tools/testing-mocking/hurl) instead; Postman's strength is the shared workspace, and its weakness is that the workspace is the canonical copy.
