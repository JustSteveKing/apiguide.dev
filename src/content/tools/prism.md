---
name: "Prism (Stoplight)"
description: "An open-source mock server that parses OpenAPI specifications and runs mock API endpoints."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://stoplight.io/open-source/prism"
pricing: "open-source"
updatedDate: 2026-10-14
---

## What is Prism (Stoplight)?

Prism is an open-source (Apache 2.0) HTTP mock server and validation proxy from Stoplight, which is now part of SmartBear. Point `prism mock` at an OpenAPI 2.0, 3.0 or 3.1 document (or a Postman collection) and it serves every operation in it, validating each incoming request against the description and generating responses from its examples or schemas. Point `prism proxy` at the same document and a real server, and it forwards traffic while reporting any request or response that does not match the contract. It is a Node.js CLI, also published as a Docker image.

## Why use it in the API Lifecycle?

* **Mock from the description, with no code**: Any valid OpenAPI document becomes a running server, so client teams can build against an API before it exists.
* **Request validation**: Invalid requests get a contract-correct error instead of a happy response: a security failure maps to a documented [`401 Unauthorized`](/status-codes/401), a body or parameter error to a documented [`422 Unprocessable Content`](/status-codes/422) or [`400 Bad Request`](/status-codes/400), and an unknown route to [`404 Not Found`](/status-codes/404), with Problem Details bodies.
* **Content negotiation**: Honors [`Accept`](/headers/accept) and [`Content-Type`](/headers/content-type) like a real server, and fails when a client asks for a media type the operation does not define.
* **Static or dynamic responses**: Static mode returns examples (or values built from defaults and formats); `-d` generates random data from the schema instead.
* **Response selection with `Prefer`**: Clients can choose `Prefer: code=404`, `Prefer: example=dog` or `Prefer: dynamic=true` per request, or the `__code`-style query parameters when they cannot set headers.
* **Validation proxy**: `prism proxy` reports contract violations in an `sl-violations` response header, or with `--errors` turns them into [Problem Details](/specifications/problem-details) responses.

## Best Practices

* Run `prism proxy openapi.yaml http://localhost:3000 --errors` in front of the real service during integration tests. Every response the implementation sends that does not match the description then fails the test, which is the cheapest way to keep the document and the code from drifting.
* Without `--errors`, the proxy only adds `sl-violations` and passes traffic through unchanged. Use that mode to observe a staging environment without breaking it, and log the header.
* Name your examples and select them with `Prefer: example=<name>` in frontend tests, and always pair it with `code=` as well: if Prism switches status because the request failed validation, an example for the wrong status is ignored.
* Use `Prefer: code=` to exercise error handling: [`429 Too Many Requests`](/status-codes/429), [`503 Service Unavailable`](/status-codes/503) and every documented 4xx the client must handle. If Prism cannot return a status, the description does not document it, which is itself a finding.
* Prefer static mode for automated tests, because random data makes assertions flaky; use `-d` for exploratory work and to surface schemas that are too loose (a free-form `string` with no `format` or `maxLength` produces visibly useless data).
* Set `NODE_ENV=production` or pass `-m` when running Prism in a container, so log processing runs in a separate process and does not slow request handling.
* Remember that a mock only proves the description is internally consistent. Pair it with contract or property-based tests against the real implementation, as covered in [Testing APIs](/guides/api-testing).
