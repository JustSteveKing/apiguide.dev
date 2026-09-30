---
name: "legible"
description: "An OpenAPI linter that scores how well a specification survives conversion into agent tool definitions, and explains every finding."
category: "design-documentation"
lifecycleStages: ["design", "development", "testing"]
url: "https://github.com/JustSteveKing/legible"
pricing: "open-source"
---

## What is legible?

legible is a command-line linter that reads an OpenAPI 3.x document and reports what will trip up an LLM or agent calling the API as a set of tools. It checks the places the conversion from HTTP operation to tool definition tends to break, scores the document across six categories, points at the line and column, and explains each finding with a fix.

It is a single Go binary with no service, no account and no Node or Docker dependency. The specification is read locally and never sent anywhere; `$ref`s pointing at URLs are fetched, and `--offline` stops even that.

A worked example against the [Swagger Petstore](https://petstore3.swagger.io/api/v3/openapi.json):

```console
$ legible check petstore.json

legible  petstore.json, OpenAPI 3.0.4, 19 operations

  descriptions      62  ████████████░░░░░░░░
  naming           100  ████████████████████
  errors            50  ██████████░░░░░░░░░░
  examples          32  ██████░░░░░░░░░░░░░░
  tool-schema       99  ████████████████████
  safety            47  █████████░░░░░░░░░░░

  score             65  agents will struggle
```

Disclosure: legible is written by the maintainer of this site. It is listed here because it occupies a category nothing else on this page covers, and the comparison below is meant to be read sceptically on that basis.

---

## Why use it in the API Lifecycle?

* **Checks agent-readiness, not validity.** It assumes the document already parses. A specification can be entirely valid and still produce tool definitions a model cannot choose between, which is a different failure and needs a different check. See [How an API Becomes Tool Definitions](/guides/tool-definitions).
* **Targets the conversion, not style.** Rules such as `argument-collision`, `tool-name`, `recursive-schema` and `schema-depth` check the specific points where an HTTP operation flattens into one argument object, against the published limits for OpenAI and Anthropic tool definitions.
* **Scores passes as well as failures.** Every rule records each place it looked, so three undocumented parameters out of two hundred scores far better than three out of four. A score is therefore comparable between revisions of the same document.
* **Fits a pipeline.** Exit code 0 passed the gate, 1 failed it, 2 could not check at all, which separates "fix the spec" from "fix the CI job". Output as text, JSON, or SARIF for GitHub code scanning.
* **Configurable without forking.** A `.legible.yaml` beside the specification sets `fail-on` and `fail-under`, turns rules off, changes severities, and records per-rule ignores with a written reason.
* **Explains itself.** Each rule ships a page covering what it checks, why it affects an agent, how to fix it and when to ignore it, available offline through `legible explain`.

### Rule categories

| Category | What it looks at |
| :--- | :--- |
| descriptions | Whether prose tells a model when to choose an operation, and whether descriptions are distinguishable |
| naming | operationIds, tool-name legality, consistency of style |
| errors | Whether failures are documented and shaped consistently |
| examples | Request and response examples |
| tool-schema | Everything that breaks when four input namespaces flatten into one |
| safety | Whether an operation declares what credentials it needs |

---

## Best Practices

* **Run a validator as well.** legible is not one. Pair it with a general OpenAPI linter such as [Spectral](/tools/design-documentation/spectral-stoplight) or vacuum, which check different things.
* **Gate on the score, not on zero findings.** `fail-under` on a number you are already above stops regressions without demanding a clean sheet on day one. Raise it as the score climbs.
* **Record why a rule is ignored.** The config takes a `reason` per ignore. An ignore without one is indistinguishable from an oversight six months later.
* **Read the score by category.** A document can score well overall and still be unusable because `descriptions` is low, which is the category a model depends on most when choosing between operations.
* **Check it in CI on the specification, not the deployed API.** Everything is read from the document, so it runs before anything is deployed and catches the problem at the point it is cheapest to fix.
* **Do not invent constraints to raise a score.** No rule asks for a `pattern` or `maxLength` on data that has none, and adding one to please a linter rejects valid input.
