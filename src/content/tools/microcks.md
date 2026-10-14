---
name: "Microcks"
description: "A CNCF open-source platform that turns OpenAPI, AsyncAPI, gRPC, GraphQL, Postman and SoapUI artifacts into live mocks and contract tests."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://microcks.io"
pricing: "open-source"
---

## What is Microcks?

Microcks is an open-source, Apache 2.0 licensed tool for API mocking and testing, and a Cloud Native Computing Foundation incubating project. It imports the artifacts a team already has ([OpenAPI](/specifications/openapi), [AsyncAPI](/specifications/asyncapi), gRPC protobuf, GraphQL schemas, Postman collections and SoapUI projects) and serves mocks built from the examples in them. The same artifacts then drive conformance tests against a real implementation, so one document is both the stub that consumers develop against and the contract the provider is checked against. It runs as a container on a laptop, in CI, or on shared infrastructure.

## Why use it in the API Lifecycle?

* **Mocks from the spec**: Microcks pairs named request and response examples in an OpenAPI document (the same example name on the parameter, the body and the response) and serves each complete pair as a mock. Incomplete pairs are dropped rather than guessed.
* **Event-driven APIs too**: AsyncAPI documents become mocked event streams, which covers the asynchronous half of a system that HTTP-only mock servers ignore.
* **Contract testing**: Test runners such as `OPEN_API_SCHEMA`, `ASYNC_API_SCHEMA`, `GRPC_PROTOBUF`, `GRAPHQL_SCHEMA` and `POSTMAN` replay the examples against a live endpoint and check status codes and payloads against the schema.
* **Conformance tracking**: Each API version gets a conformance index (how well the examples cover the contract) and a conformance score with a history of test runs.
* **Testcontainers modules**: Official modules for Java, Node.js/TypeScript, Go and .NET start a throwaway Microcks instance inside a unit or integration test.
* **Dispatching rules**: The `x-microcks-operation` extension sets a `dispatcher` and `dispatcherRules` in the OpenAPI document, so the choice of which example answers a request is versioned with the spec.

## Best Practices

* Treat examples as part of the contract. Give every operation a named example for each response a client must handle, including [`404 Not Found`](/status-codes/404) and [`409 Conflict`](/status-codes/409), not just the 200 path, because Microcks can only mock and test what the examples cover.
* Use `x-microcks-refs` for responses that carry no body, such as [`204 No Content`](/status-codes/204), so they still map to the requests that should produce them.
* Prefer the Testcontainers module in service tests over a shared, long-lived Microcks instance. Each test run gets a clean state and the artifact version under test, and nothing drifts between teams.
* Run the `OPEN_API_SCHEMA` or `ASYNC_API_SCHEMA` runner against the provider in its pipeline, and fail the build on a dropping conformance score. This is the provider side of the contract-testing approach in [API Testing](/guides/api-testing).
* Put dispatching rules in the spec with `x-microcks-operation` rather than configuring them in the UI. Rules in the document override UI changes on the next import, so UI-only edits are lost silently.
* Keep mock examples realistic and free of real customer data. Mocks are often shared widely, and an example copied from production logs is a data leak.
