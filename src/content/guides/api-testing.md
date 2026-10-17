---
title: "Testing APIs"
description: "Where each kind of API test earns its place: consumer-driven and schema-based contract testing, generating inputs from OpenAPI, mocks that do not drift, and testing the error, retry and concurrency behavior that clients depend on."
category: "reliability"
updatedDate: 2026-10-14
---

## Test the Contract, Not Just the Code

Most API test suites are application test suites with an HTTP client bolted on. They prove that the handler does what its author intended, against inputs its author thought of, and they say very little about the thing a consumer actually depends on: the contract. A suite can be entirely green while the API returns an undocumented status code, a field the specification says is required goes missing, or a validation error comes back as an HTML page from the framework.

An API has two audiences for its tests. The team that owns it needs to know the code is correct. Every consumer needs to know the contract is stable. The first is ordinary software testing. The second is the part specific to APIs, and it is the part most suites skip, because nothing fails locally when it is missing. It fails in someone else's integration, weeks later.

This guide is about the second audience. It assumes you already have unit tests, and covers what to add so that the contract, including its errors, retries and concurrency behavior, is tested as deliberately as the business logic.

---

## 1. The Pyramid, Redrawn for APIs

The shape still holds: many fast, narrow tests at the bottom, few slow, broad ones at the top. What changes for an API is what the layers are and what each one is able to prove.

| Layer | What it proves | What it cannot prove |
| :--- | :--- | :--- |
| Unit | Domain logic is correct | Anything about the wire format |
| Component (one service, real HTTP, dependencies faked) | Routing, serialization, validation, status codes and headers behave as written | That what was written matches what consumers expect |
| Contract | The provider and its consumers agree on requests and responses | That the whole system works together |
| Generated (property-based, fuzzing) | The implementation holds up against inputs nobody wrote by hand | Business correctness |
| End-to-end | A real flow works across real services | Much of anything quickly, or why it failed |

The layer to invest in is the component test that speaks real HTTP to one running service. It is fast enough to run on every commit, and it is the first layer at which status codes, headers, content types and error bodies exist at all. A unit test that asserts a controller returns an object has not tested the API; it has tested a function.

The layer to keep small is end-to-end. Its job is to catch the failures that only appear when everything is deployed together, such as misconfigured gateways, expired credentials and network policy. It is a poor place to test contract details, because when it fails it tells you that something is wrong somewhere, after a long wait.

---

## 2. Contract Testing Runs in Two Directions

"Contract testing" names two different practices that start from opposite ends. Both are worth knowing, because each is the right answer in a situation where the other is not.

### Consumer-driven

In consumer-driven contract testing, each consumer writes tests against a mock of the provider, and those tests record what the consumer actually sends and expects back. The recording is the contract. The provider then replays every consumer's contract against its real implementation and fails the build if any expectation is no longer met.

[Pact](/tools/testing-mocking/pact) is the established tool for this. Its contracts are "by example": each interaction is one concrete request and the response the consumer relies on. Because the contract contains only what consumers use, the provider is free to change anything nobody depends on, and finds out precisely which consumer it would break when it changes something somebody does. With a Pact Broker in the loop, `can-i-deploy` answers whether a given version is compatible with what is currently deployed alongside it.

The Pact documentation is direct about where this does not fit, and it is worth taking at its word. It works when you control, or can coordinate with, both sides. It is a poor fit for **public APIs**, where consumers are unknown and cannot contribute contracts, and for pass-through services, because it checks response contents rather than side effects.

### Provider-driven, from the specification

In schema-based contract testing, the OpenAPI document is the contract, and the implementation is tested against it directly: every response the provider sends is validated against the schema declared for that operation, status code and media type.

This works without knowing who the consumers are, which makes it the default for any public or partner API. Its weakness is the mirror image of Pact's strength: it checks that you did what the specification says, not that the specification says what consumers need. A field can be removed from both the specification and the implementation in one commit, and schema-based testing will pass it, which is why it has to be paired with breaking-change detection on the specification itself. See [design-first governance](/guides/design-first-governance).

### Choosing

| Situation | Use |
| :--- | :--- |
| Internal services, consumers known and in the same organization | Consumer-driven. It tells you who breaks, not only that something does |
| Public or partner API, consumers unknown | Schema-based, plus a diff of the specification in CI |
| Both | Schema-based for the published contract, consumer-driven for the internal consumers whose usage you can see |

Whichever you choose, run it against the deployed artifact's behavior, not against a hand-maintained list of expected fields. A test that duplicates the schema in assertions drifts from the schema in exactly the way the specification was supposed to prevent.

---

## 3. Let the Specification Write the Inputs

Hand-written tests exercise the inputs their authors imagined. The inputs that break an API are the ones nobody imagined: an empty string where a name is required, a 4,000-character query parameter, a number at the edge of its declared range, a Unicode character in an identifier, a body that is valid JSON and invalid against the schema in one nested property.

An OpenAPI document already describes the valid input space precisely enough to generate from. Property-based testing does exactly that: it generates many requests that conform to the schema, plus requests that deliberately violate it, sends them, and checks properties of the responses rather than exact values.

[Schemathesis](/tools/testing-mocking/schemathesis) is the tool most associated with this approach. It generates tests from an OpenAPI or GraphQL schema, follows OpenAPI `links` to chain operations into multi-step workflows, and reports each failure with a minimal `curl` reproduction:

```text
st run openapi.yaml --url https://staging.example.com --checks all
```

The properties it checks are a useful definition of what "conforms to the contract" means in practice:

| Check | What it catches |
| :--- | :--- |
| `not_a_server_error` | Any input that produces a `5xx`. A generated input that crashes the server is a bug, regardless of whether the input was sensible |
| `status_code_conformance` | Status codes the operation does not document |
| `content_type_conformance` | Responses with a missing or undocumented `Content-Type` |
| `response_schema_conformance` | Bodies that do not match the declared schema |
| `negative_data_rejection` | Invalid input that was accepted instead of rejected |
| `positive_data_acceptance` | Valid input that was rejected |
| `ignored_auth` | Operations that succeed without valid credentials |
| `use_after_free` | Resources still readable after they were deleted |

The first row is the one that justifies the whole exercise. If an API has never been fuzzed, assume it has inputs that produce a [`500 Internal Server Error`](/status-codes/500), typically from a parser or a database constraint the validation layer did not know about. Each one should have been a [`400`](/status-codes/400) or a [`422`](/status-codes/422) with a useful body. See [input validation](/guides/input-validation).

Generated testing also tests the specification. When a check fails, either the implementation is wrong or the document is, and both are worth knowing. A specification that is too loose to generate meaningful tests from (every property optional, no formats, no bounds) is also too loose to generate a good SDK or tool definition from.

---

## 4. Mocks Are Contracts Too

A mock lets a consumer build and test against an API that does not exist yet, or that it cannot call from CI. It is also a second copy of the contract, and a second copy drifts.

There are two ways to keep a mock honest:

- **Generate it from the specification.** [Prism](/tools/testing-mocking/prism) serves a mock directly from an OpenAPI document, validates incoming requests against it, and can run as a validation proxy in front of the real API to report where the two disagree. [Microcks](/tools/testing-mocking/microcks) does the same from OpenAPI, AsyncAPI and other formats, and can test an implementation against the same examples it mocks.
- **Verify a hand-written mock against the provider.** Stub servers such as [WireMock](/tools/testing-mocking/wiremock) and [Mockoon](/tools/testing-mocking/mockoon) are more flexible, and that flexibility is how a stub ends up returning a field the real API removed a year ago. If you write stubs by hand, replay the same requests against the real provider in a separate job and compare. A Pact contract is exactly this: a stub whose expectations the provider is obliged to verify.

What not to do: let each consumer team hand-write its own mock of your API from the documentation. You will have as many interpretations of the contract as you have teams, all passing their own tests.

Mock the error cases as well as the happy path. A consumer that has only ever tested against a mock returning `200` has never run its error handling, and will meet it for the first time in production.

---

## 5. Errors Are Part of the Contract

Most suites test errors by asserting a status code. That is the least of it. A consumer that handles errors properly depends on the body shape, the media type and the stable identifier, and all three are routinely broken by changes nobody thought of as API changes, such as upgrading the framework.

For every documented failure, assert:

- **The status code**, exactly. `400` and `422` are not interchangeable to a client that branches on them.
- **`Content-Type: application/problem+json`**, not `application/json` and certainly not `text/html`.
- **The `type` URI**, because that is what clients branch on. The `title` and `detail` are prose and may be reworded; the `type` may not. See [error handling](/guides/error-handling).
- **No leakage**: no stack trace, SQL fragment or internal hostname, in any environment that resembles production.

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://apiguide.dev/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "The request body has 1 invalid field.",
  "errors": [
    { "pointer": "/email", "detail": "must be a valid email address" }
  ]
}
```

The errors most often untested are the ones the application does not produce itself: the framework's [`404`](/status-codes/404) for an unknown route, [`405 Method Not Allowed`](/status-codes/405) for a known route with the wrong method, [`415 Unsupported Media Type`](/status-codes/415) for a body sent as form data, [`413`](/status-codes/413) from a proxy, and authentication failures from middleware. These are exactly the responses a new integrator meets first, and the ones most likely to arrive in a different shape from everything else. Send each one deliberately in a component test.

Document error responses in the specification too, with their schema, so that schema-based testing covers them. An operation that documents only `200` gives every contract-testing tool nothing to check when it fails.

---

## 6. Test the Properties Retries Depend On

Clients retry. Some do it deliberately with backoff, some do it because a load balancer or SDK did it for them, and an autonomous agent will do it immediately. The guarantees that make retrying safe are API behavior, and they need tests of their own. They are almost never covered by default, because every one of them involves two requests, timing or concurrency.

### Idempotency keys

If an operation accepts an [`Idempotency-Key`](/headers/idempotency-key), test each branch of the behavior rather than assuming the middleware works. The header is specified in an IETF Internet-Draft, `draft-ietf-httpapi-idempotency-key-header`, which has expired without becoming an RFC, but its recommended responses are a sensible baseline:

| Scenario | Expected |
| :--- | :--- |
| Same key, same body, after the first completed | The original response replayed, and no second side effect. Count the side effects, do not just compare responses |
| Same key, different body | Rejected. The draft recommends [`422`](/status-codes/422) |
| Same key, sent while the first is still in flight | Rejected with [`409 Conflict`](/status-codes/409) |
| Key required but missing | Rejected. The draft recommends [`400`](/status-codes/400) |
| Same key after the documented retention window | Treated as new, matching what you documented |

The in-flight case is the one that needs a real concurrency test: two requests released together against a handler slowed down for the test. It is also the case most implementations get wrong, because a check-then-insert on the key table without a lock or unique constraint passes every sequential test. See [idempotency](/guides/idempotency).

### Retries under failure

Inject the failure rather than waiting for it. Put a fault-injecting proxy, or a stub configured to fail, between the client and the API, and assert what happens when:

- the response is lost after the write committed (the client times out, the server succeeded). The retry must not duplicate the effect.
- the API returns [`503`](/status-codes/503) or [`429`](/status-codes/429) with [`Retry-After`](/headers/retry-after). The client, or your SDK, must wait at least that long.
- the API returns a non-retryable `4xx`. The client must not retry at all.

The first is the scenario idempotency exists for, and it cannot be produced by testing the server alone. See [retries and backoff](/guides/retries-backoff).

### Conditional requests

If the API supports optimistic concurrency, test the lost-update case directly: two clients read the same [`ETag`](/headers/etag), both send [`PUT`](/methods/put) or [`PATCH`](/methods/patch) with [`If-Match`](/headers/if-match), and exactly one succeeds while the other receives [`412 Precondition Failed`](/status-codes/412). If writes require a precondition, a write without one must return [`428 Precondition Required`](/status-codes/428), not succeed. And a [`GET`](/methods/get) with a matching [`If-None-Match`](/headers/if-none-match) must return [`304 Not Modified`](/status-codes/304) with no body. See [conditional requests](/guides/conditional-requests).

Also assert that the `ETag` actually changes when the representation changes. A validator computed from something that does not change on every write, such as a timestamp with one-second resolution, passes every single-request test and silently allows lost updates.

---

## 7. What Runs Where

A workable arrangement, in order of how often each runs:

1. **On every commit:** unit and component tests, including the deliberate error cases from section 5, and response validation against the specification inside the component tests.
2. **On every pull request that touches the API or the specification:** contract verification (provider verification for Pact, or schema-based conformance), a diff of the specification against the last release, and the idempotency, concurrency and conditional-request tests from section 6.
3. **On a schedule, and before a release:** property-based testing against a staging deployment. It takes longer and finds things nobody asked it to find, which is the point.
4. **Before and after deploy:** a short end-to-end smoke suite against the real environment.

Load and performance testing, with a tool such as [k6](/tools/testing-mocking/k6), is a separate concern and belongs on its own schedule. Rate limits are part of the contract, though, so at least one test should confirm that exceeding one produces a `429` with a `Retry-After`, rather than a timeout. See [rate limiting](/guides/rate-limiting).

The test to apply to the whole suite is the one consumers apply to your API: if the contract changed in a way that would break them, would anything here have gone red? If the honest answer is "only the end-to-end suite, eventually", the contract is untested.
