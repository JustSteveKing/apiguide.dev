---
name: "Spectral (Stoplight)"
description: "A flexible, JSON/YAML linter for checking API designs against custom style rules and OpenAPI standards."
category: "design-documentation"
lifecycleStages: ["design"]
url: "https://stoplight.io/open-source/spectral"
pricing: "open-source"
---

## What is Spectral (Stoplight)?

Spectral is an open-source (Apache 2.0) linter for JSON and YAML, built by Stoplight, now part of SmartBear. On its own it knows nothing; it applies a ruleset, usually a `.spectral.yaml` file, in which each rule selects parts of a document with JSONPath and checks them with a function such as `truthy`, `pattern`, `casing` or `schema`. It ships ready-made rulesets for OpenAPI 2.0, 3.0, 3.1 and 3.2 (`spectral:oas`), AsyncAPI (`spectral:asyncapi`) and Arazzo 1.x (`spectral:arazzo`), and runs as a CLI, a Docker image or a JavaScript library. It also powers linting in the Stoplight platform's editor.

## Why use it in the API Lifecycle?

* **Style guides as code**: Encode naming, casing, pagination, error-shape and versioning conventions as rules, so reviews stop relitigating them.
* **Ready-made OpenAPI checks**: `spectral:oas` covers rules such as `operation-operationId-unique`, `path-params`, `oas3-valid-media-example` (examples must match their schemas) and `oas3-unused-component`.
* **Extensible**: Rulesets can `extends` other rulesets, including ones loaded by URL, and custom functions are written in JavaScript.
* **CI-friendly output**: Formatters include `github-actions`, `sarif`, `junit`, `gitlab` and `json`, and `--fail-severity` decides which level breaks the build.
* **Beyond OpenAPI**: Because it is a generic JSON/YAML linter, the same engine can check AsyncAPI, Arazzo, or any other structured file a team maintains.

## Best Practices

* Commit a `.spectral.yaml` that extends `spectral:oas` to each API repository (or extends one shared ruleset by URL), and run `spectral lint openapi.yaml --fail-severity=warn` on every pull request. Linting in an editor only helps the person who has the extension installed.
* Write rules for the conventions you actually enforce in review, with a `message` and a `description` that explain why. Good candidates: every operation documents a 4xx response, error responses use `application/problem+json` per [Problem Details](/specifications/problem-details), collection endpoints declare the pagination parameters from [Pagination](/guides/pagination), and paths follow your [resource naming](/guides/resource-naming) casing.
* Start a new ruleset at `warn`, fix the backlog, then promote rules to `error`. Turning on a strict ruleset at `error` on day one gets the linter disabled, not the API fixed.
* Keep `oas3-valid-media-example` and `oas3-valid-schema-example` on. Examples that do not match their schemas mislead every reader of the docs and break any mock server that serves them, such as [Prism](/tools/testing-mocking/prism).
* Do not use a linter as a substitute for detecting breaking changes. Spectral checks one version of a document in isolation; comparing two versions is a different job (see [What Counts as a Breaking Change](/guides/breaking-changes)).
* Keep the ruleset in YAML rather than a JavaScript module unless you need code: YAML rulesets also run in [vacuum](/tools/design-documentation/vacuum), a Go reimplementation, so you are not locked to one engine. If the API will be called by agents, add [legible](/tools/design-documentation/legible), which checks different things. Rule design and rollout are covered in [Design-First Development and API Governance](/guides/design-first-governance).
