---
name: "Pact"
description: "A consumer-driven contract testing framework that lets services verify their integrations without spinning up full end-to-end environments."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://pact.io"
pricing: "open-source"
updatedDate: 2026-10-14
---

## What is Pact?

Pact is an open-source, code-first framework for consumer-driven contract testing of HTTP and message-based integrations, maintained by the Pact Foundation with libraries for most major languages. A consumer's unit tests run against a Pact mock provider, and every interaction the consumer exercises is written to a pact file: the contract, by example. The provider then replays those interactions against its real implementation and verifies its responses match. The open-source Pact Broker stores contracts and verification results between the two; PactFlow is a separate commercial, hosted broker from SmartBear.

## Why use it in the API Lifecycle?

* **Tests only what consumers use**: The contract contains the requests and fields consumers actually rely on, so a provider can change or remove anything no consumer exercises with confidence.
* **No shared test environment**: Each side tests in isolation, the consumer against a mock and the provider against recorded expectations, which replaces slow, brittle end-to-end environments for integration checks.
* **HTTP and messages**: Covers request/response APIs and asynchronous messages, such as events on a queue.
* **Matchers**: Type matchers (`like`), array matchers (`eachLike`) and regex matchers let the contract assert shape without pinning incidental values.
* **Provider states**: Each interaction names the state it needs ("order 123 exists"), and the provider sets up that data before verification.
* **Deployment gating**: With the Broker, `can-i-deploy` answers whether a given version is compatible with what is already in the target environment.

## Best Practices

* Gate deploys with the Broker. Run `pact-broker can-i-deploy --pacticipant orders-web --version $GIT_SHA --to-environment production` before deploying, and `pact-broker record-deployment` after. Without recorded deployments, the Broker cannot know which provider versions a consumer must stay compatible with.
* Be strict on requests and loose on responses. Use exact values for what the consumer sends, and type matchers for what it receives, so provider verification fails only when a consumer would genuinely break. Extra response fields are ignored by design, which matches the tolerant-reader advice in [What Counts as a Breaking Change](/guides/breaking-changes).
* Do not put random data in contracts. Generated IDs and timestamps make each pact look new, which defeats the Broker's ability to reuse existing verification results.
* Include the failure interactions the consumer handles, such as [`404 Not Found`](/status-codes/404) for a missing resource or [`409 Conflict`](/status-codes/409) on a duplicate, so those code paths are covered by the contract and not just the happy path.
* Keep provider tests about the contract, not behavior. Pact checks the shape of responses; it does not check side effects or business rules, which belong in the provider's own functional tests.
* Do not use Pact for public APIs with unknown consumers, or for pass-through services that forward requests without validating them. The Pact docs call out both as poor fits; for a public API, test the provider against its [OpenAPI](/specifications/openapi) description instead, as covered in [Testing APIs](/guides/api-testing).
