---
name: "Insomnia"
description: "A streamlined, desktop-based HTTP, REST, and GraphQL client built for local debugging and testing."
category: "clients-debugging"
lifecycleStages: ["development", "testing"]
url: "https://insomnia.rest"
pricing: "freemium"
---

## What is Insomnia?

Insomnia is a desktop API client owned by Kong, with an Apache 2.0 open-source core. It sends REST, GraphQL, gRPC, WebSocket and Server-Sent Events requests, edits OpenAPI documents with live preview and linting, runs collections with pre-request and after-response scripts, and creates mock servers. Projects can be stored in a Local Vault on your machine, in a Git repository through Git Sync, or in Insomnia's cloud with optional end-to-end encryption; a Scratch Pad works without logging in. The Essentials plan is free; paid Pro and Enterprise plans add larger-team collaboration and governance features. The Inso CLI runs collections and lints specs from a terminal or CI.

## Why use it in the API Lifecycle?

* **Design and debug in one tool**: Edit an OpenAPI document, see lint results and a preview, and generate a request collection from it.
* **Multi-protocol client**: REST, GraphQL, gRPC, WebSockets and SSE requests sit in the same project.
* **Choice of storage**: Local Vault, Git Sync or cloud sync per project, with Private Environments that keep environment values local whichever storage is used.
* **Scripting and test runs**: Scripts before and after each request, and a collection runner for multi-step scenarios.
* **Mocking**: Mock servers built from responses or specs, so consumers can start before the backend exists.
* **CI through Inso**: `inso run collection`, `inso run test`, `inso lint spec` and `inso export spec` bring the same assets into a pipeline.

## Best Practices

* Choose the storage mode deliberately for each project. Use Local Vault or Git Sync for anything containing production endpoints or customer data; cloud sync is convenient but puts those requests on a third party's servers. On Enterprise, administrators can mandate the storage mode.
* Keep credentials in Private Environments or environment variables, not in request headers, so committing a project to Git or sharing it does not leak tokens. See [Token Lifecycle](/guides/token-lifecycle).
* Lint the OpenAPI document in CI with `inso lint spec`, using a ruleset YAML file kept beside the spec, so the rules developers see in the app are the rules the pipeline enforces. Pair it with a breaking-change check; linting alone does not catch a removed field. See [Design-First Governance](/guides/design-first-governance).
* Run `inso run collection --env <name>` in CI against an ephemeral environment, and assert status codes and the fields clients depend on rather than full response bodies.
* Use mocks to unblock consumers early, then retire them once the real endpoint exists. A mock left in use hides drift between the spec and the implementation; contract testing with [Pact](/tools/testing-mocking/pact) or schema-based testing with [Schemathesis](/tools/testing-mocking/schemathesis) catches what a mock cannot.
* When debugging a request that behaves differently in the browser, remember Insomnia is not subject to [CORS](/guides/cors). A request that succeeds here and fails in a web app usually needs a fix in [`Access-Control-Allow-Origin`](/headers/access-control-allow-origin) handling, not in the request.
