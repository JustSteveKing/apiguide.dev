---
name: "Karate"
description: "An open-source test framework from Karate Labs that combines API tests, mocks, performance tests and UI automation in a single readable DSL on the JVM."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://karatelabs.io"
pricing: "freemium"
---

## What is Karate?

Karate is an open-source, MIT-licensed test framework maintained by Karate Labs. Tests are written in `.feature` files using a Gherkin-style syntax (`Given url`, `When method get`, `Then status 200`) with JSON and JavaScript expressions inline, so an API test needs no step definitions and no Java glue code. The same framework covers HTTP mocks, performance testing and browser automation. Karate 2 runs on the JVM, requires Java 21 or later, and is published as `io.karatelabs:karate-core`. Karate Labs sells enterprise add-ons on top of the free core, including an async protocol pack for Kafka, gRPC and WebSocket testing.

## Why use it in the API Lifecycle?

* **No glue code**: HTTP calls, JSON assertions and data setup are all written in the feature file, so engineers who do not write Java can read and maintain the suite.
* **Powerful matching**: The `match` keyword compares whole payloads, and fuzzy markers such as `#string`, `#number`, `#uuid`, `#notnull`, `#ignore` and `#regex` assert shape without pinning volatile values. `match each` validates every element of an array.
* **Parallel execution**: `Runner.path("classpath:examples").parallel(5)` runs features and scenarios across threads and produces an HTML report, from a standard JUnit test.
* **Reusable flows**: Features can call other features, and `karate.callSingle()` in `karate-config.js` runs expensive setup such as fetching an auth token once for the whole run, even in parallel.
* **Polling built in**: `retry until` repeats a request until a JavaScript condition holds, with `configure retry` controlling count and interval.
* **Mocks in the same language**: A feature file can act as an HTTP mock server, so a dependency can be stubbed with the same syntax used to test it.

## Best Practices

* Assert shape, not snapshots: use `match response == { id: '#uuid', status: '#string', createdAt: '#ignore' }` rather than comparing a recorded body that breaks on every timestamp.
* Fetch tokens with `karate.callSingle()` in `karate-config.js` and return plain JSON from it, not functions or Java objects, which misbehave in parallel runs. Use `karate.env` to switch base URLs per environment instead of editing features.
* Write scenarios so they can run in any order and on any thread: create the data a scenario needs inside that scenario, and never rely on a previous scenario's side effects.
* Use `retry until` for asynchronous APIs that return [`202 Accepted`](/status-codes/202) and a job resource, instead of fixed waits that are either too short in CI or too slow everywhere.
* Cover the failure contract as well as the happy path: assert the [`401 Unauthorized`](/status-codes/401), [`403 Forbidden`](/status-codes/403) and [`422 Unprocessable Content`](/status-codes/422) responses and the shape of their [problem details](/specifications/problem-details) bodies. See [API Testing](/guides/api-testing) for where these tests sit relative to contract and load tests.
* Pin the Karate version in the build and read the migration guide before moving a 1.x suite to 2.x. Karate 2 aims to run 1.x features with minimal changes, but it needs Java 21 and has a new JavaScript engine.
