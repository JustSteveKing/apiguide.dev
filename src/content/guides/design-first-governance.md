---
title: "Design-First Development and API Governance"
description: "Treating the OpenAPI document as the source of truth: design-first against code-first, overlays instead of forks, a style guide enforced by a linter, breaking-change detection in CI, and a review process that looks at the contract rather than the code."
category: "evolution"
updatedDate: 2026-10-14
---

## The Contract Has to Come From Somewhere

Every HTTP API has a contract whether or not anyone wrote it down. The question governance answers is where that contract lives, who is allowed to change it, and what checks a change has to pass before consumers see it.

Without an answer, the contract lives in the implementation. Each endpoint is designed by whoever builds it, in the pull request that builds it, reviewed by people reading controller code for bugs rather than reading the interface for consistency. The result is familiar: three pagination styles, two error formats, `created_at` beside `createdOn`, and an OpenAPI document generated after the fact that faithfully records every inconsistency.

The remedy is not a committee. It is a machine-readable contract that changes in its own reviewable diff, a style guide encoded as lint rules rather than a wiki page, and a CI job that refuses a breaking change unless someone has decided to make one. That is most of what "governance" should mean for an HTTP API, and all of it is cheap compared to retrofitting consistency later.

---

## 1. Design-First and Code-First

The two approaches differ in which artifact is written first, and therefore which one is authoritative when they disagree.

| | Design-first | Code-first |
| :--- | :--- | :--- |
| Written first | The [OpenAPI](/specifications/openapi) document, or a source it is generated from | The implementation, annotated |
| The specification is | The input: stubs, validation, mocks and SDKs are derived from it | An output, generated from code |
| Review happens on | The contract, before implementation | The implementation, with the contract as a side effect |
| Consumers can start | Immediately, against a mock | When the endpoint ships |
| Typical failure | The document and the implementation drift if nothing checks one against the other | The interface is never designed at all, only accumulated |

**Use design-first for any API with consumers outside the team that builds it.** Public APIs, partner APIs, and internal APIs consumed by other teams all benefit from the same property: the interface is agreed, reviewed and mocked before anyone has invested in an implementation that makes changing it expensive.

Code-first is defensible for an internal API whose only consumer is the team's own front end, where the interface and its one client change together. Even then, two conditions make it safe: the generated document is committed to the repository rather than produced only at runtime, so changes to it appear in a diff, and that diff is subject to the same lint and breaking-change checks as a hand-written one. A code-first API that meets both is governed. One that publishes whatever the annotations produce on deploy is not.

What matters more than the order is that **there is exactly one source of truth, and the other artifacts are checked against it.** Design-first without contract testing drifts as surely as code-first without review. See [testing APIs](/guides/api-testing).

---

## 2. The Document Is the Source of Truth

In practice, design-first means the OpenAPI document lives in version control, ideally beside the implementation, and every change to the interface starts as a change to that document.

Three rules keep it authoritative:

- **Derive, do not duplicate.** Request validation, mocks, documentation and SDKs should be generated from the document or validated against it. Every hand-maintained copy of a schema, in a validator, a test assertion or a documentation page, is a second source of truth waiting to disagree with the first.
- **Never edit generated output.** If the document is generated from another source, that source is the source of truth, and edits to the generated file are lost on the next build. [TypeSpec](/tools/design-documentation/typespec), Microsoft's API description language, is a common case: the `.tsp` files are authored and reviewed, and OpenAPI 3, JSON Schema or Protobuf are emitted from them.
- **Check the implementation against it continuously.** Validate real responses against the document in component tests, or run a validation proxy such as [Prism](/tools/testing-mocking/prism) in a pre-production environment. A document that is never compared to the running API is documentation, not a contract.

Name things in the document deliberately, because the document's names become other people's code. `operationId` becomes a method name in every generated SDK and the function name of every tool definition; a schema name in `components/schemas` becomes a class. Renaming either later is a breaking change for everyone who generated from it. See [SDK generation](/guides/sdk-generation) and [how an API becomes tool definitions](/guides/tool-definitions).

---

## 3. Overlays, Not Forks

One API often needs several versions of its document: a public one without internal operations, one with vendor extensions for a particular SDK generator, one with richer descriptions for a documentation portal. The tempting solution is to copy the document and edit the copy. That creates a fork, and forks drift.

The [OpenAPI Overlay Specification](/specifications/openapi-overlay) exists for this. An overlay is a separate document containing an ordered list of actions, each selecting nodes in the source document with an RFC 9535 JSONPath `target` and either updating or removing them:

```yaml
overlay: 1.0.0
info:
  title: Public API surface
  version: 1.0.0
actions:
  - target: "$.paths[*][?@['x-internal'] == true]"
    description: Remove operations marked internal
    remove: true
  - target: $.info
    update:
      description: The public Acme API. Internal operations are omitted.
```

The source document stays the single source of truth; each audience's variant is the source plus an overlay, regenerated on every change. Lint the output of the overlay as well as the source, because an overlay that removes a schema something still references produces an invalid document.

---

## 4. A Style Guide That Runs

An API style guide written as prose is read once, at onboarding, and applied from memory thereafter. A style guide written as lint rules is applied to every change, with a line number.

[Spectral](/tools/design-documentation/spectral-stoplight) is the reference tool here. A ruleset extends a built-in one and adds house rules, each of which selects part of the document with a JSONPath `given` and applies a function to it:

```yaml
extends: ["spectral:oas"]
rules:
  operation-operationId: error
  operation-description: error
  paths-kebab-case:
    description: Path segments must be kebab-case, so every URL in the API reads the same way.
    severity: error
    given: $.paths[*]~
    then:
      function: pattern
      functionOptions:
        match: "^(/([a-z0-9-]+|\\{[a-zA-Z0-9]+\\}))+$"
  error-responses-use-problem-json:
    description: 4xx and 5xx responses must be application/problem+json (RFC 9457).
    severity: error
    given: "$.paths[*][*].responses[?(@property >= 400)].content"
    then:
      field: application/problem+json
      function: truthy
```

[vacuum](/tools/design-documentation/vacuum) is an alternative linter written in Go that reads Spectral-style rulesets, with documented limits on compatibility. Both can run locally, in an editor and in CI against the same ruleset file, which is what makes the rules a shared standard rather than a reviewer's preference.

Some habits that keep a ruleset useful rather than resented:

- **Start from the built-in ruleset and add few rules.** Each house rule should encode a decision the organization has actually made, such as casing, pagination parameter names, error format and identifier format. A rule nobody can justify will be disabled within a month, and it will take some good rules with it.
- **Write the reason into the rule.** The `description` is what appears in the failure. "Path segments must be kebab-case" invites an argument; adding "so every URL in the API reads the same way" ends one.
- **Use severity honestly.** `error` blocks the merge; `warn` is advice. If a warning is always ignored, either promote it or delete it.
- **Ratchet existing APIs.** Turning on a new rule against an old API produces hundreds of violations at once. Fail only on violations introduced by the change, and fix the backlog separately, rather than leaving the rule off.
- **Lint for consumers, not only for validity.** A document can be valid OpenAPI and unusable. Descriptions that explain when to use an operation, documented error responses and complete examples are what generated SDKs and AI agents depend on. See the [agent-ready API checklist](/guides/agent-ready-checklist).

---

## 5. Breaking-Change Detection in CI

Linting checks that a document is well formed. It cannot tell you that this version breaks clients of the last one, because that is a property of two documents, not one. That needs a diff.

[oasdiff](https://github.com/oasdiff/oasdiff) is an open-source tool that compares two OpenAPI documents and classifies each change. Its `breaking` command reports changes at two levels: `ERR` for definite breaking changes, and `WARN` for changes it cannot confirm are breaking from the document alone. `--fail-on` turns the report into a CI gate:

```text
oasdiff breaking base/openapi.yaml openapi.yaml --fail-on ERR
```

Compare against the document as it was at the last release, or on the main branch, not against the previous commit, so a breaking change cannot be smuggled through in two harmless-looking steps.

A diff catches what a document can express: a removed operation or field, a newly required parameter, a narrowed type, tightened validation, a changed media type. It cannot catch what the document does not describe, such as a change in ordering, error wording or timing, and it is only as good as the document is complete. An enum documented loosely as `type: string` will never be reported as narrowed. See [what counts as a breaking change](/guides/breaking-changes) for the parts of the contract a diff misses.

When the gate fails, the outcome should be a decision, not a workaround. Either change the design so it is additive, or accept the break deliberately: bump the version, record why, and start the deprecation process for the old behavior. A labeled override on the pull request, approved by an API owner, is better than a gate people learn to disable. See [versioning](/guides/versioning) and [deprecation and sunsetting](/guides/deprecation-sunsetting).

A note on tooling: [Optic](/tools/testing-mocking/optic) combined linting, diffing and traffic-based testing in one tool, but its repository has since been archived. Teams still using it should plan a move to a maintained diff tool.

---

## 6. Review the Contract, Not the Controller

Code review is good at finding bugs and bad at finding interface problems, because reviewers read implementations line by line and an interface problem lives across endpoints. Separate the two.

**Every change to the interface gets a review of the document diff**, from someone who knows the rest of the API. The questions are not about code:

| Question | Why it is asked here |
| :--- | :--- |
| Does it match how the rest of the API names, paginates, filters and fails? | Consistency is what lets a consumer generalize from one endpoint to the next, and no linter covers all of it |
| Is this one operation per intention, or a table exposed over HTTP? | Use-case-shaped resources are cheaper to call correctly. See [resource naming](/guides/resource-naming) |
| What happens on retry? | A write that is unsafe to retry needs an [`Idempotency-Key`](/headers/idempotency-key) from the start, not after the first duplicate charge. See [idempotency](/guides/idempotency) |
| Are the error responses documented? | An operation that documents only `200` has an undesigned failure contract |
| Is every new enum open or closed, and is that written down? | Widening a closed enum later is a breaking change |
| Is anything here hard to remove? | Every field added is a field supported until a sunset date |

Do this review **before implementation**, on a pull request that changes only the document, with a mock generated from it so consumers can try the design. Feedback that costs a line of YAML at this stage costs a migration after release.

Keep the review proportionate. A new optional field on an existing resource needs a glance; a new resource or a new pattern needs a real discussion. Most organizations do well with a small group of API reviewers who are required on changes to the document and nowhere else, rather than a design board that meets on a schedule. The lint and diff gates handle the mechanical part, so human attention goes to the questions machines cannot answer.

---

## 7. What This Adds Up To

A working setup is short to describe:

1. The OpenAPI document, or its TypeSpec source, lives in version control and is the source of truth.
2. Every interface change is a diff to that document, reviewed before implementation, with a mock for consumers.
3. A Spectral or vacuum ruleset, shared across every API in the organization, runs in the editor and in CI.
4. A breaking-change diff against the last release gates the merge, with a deliberate override for intended breaks.
5. Contract tests check the implementation against the document on every build.
6. Audience-specific variants are produced by overlays, never by copies.

None of it requires a platform purchase or a governance board. It requires deciding that the contract is an artifact in its own right, with the same review, testing and release discipline as the code behind it.
