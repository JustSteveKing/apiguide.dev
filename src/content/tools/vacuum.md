---
name: "vacuum"
description: "A fast, MIT-licensed OpenAPI, AsyncAPI, Arazzo and JSON Schema linter written in Go, compatible with Spectral-style rulesets."
category: "design-documentation"
lifecycleStages: ["design", "testing"]
url: "https://quobix.com/vacuum"
pricing: "open-source"
updatedDate: 2026-10-14
---

## What is vacuum?

vacuum is a command-line linter for [OpenAPI](/specifications/openapi) 3.0, 3.1 and 3.2, [AsyncAPI](/specifications/asyncapi) 3, [Arazzo](/specifications/arazzo) 1.0 and 1.1, and [JSON Schema](/specifications/json-schema) documents. It is written in Go by Dave Shanley (quobix), ships as a single binary, and is licensed MIT in the `daveshanley/vacuum` repository.

It was inspired by [Spectral](/tools/design-documentation/spectral-stoplight) and reads Spectral-style YAML and JSON rulesets, including `extends` and custom rules, and ships built-in recommended rulesets and an OWASP ruleset (`[vacuum:owasp, all]`). Custom functions can be written in JavaScript and loaded with `--functions`. The documented exception: JavaScript ruleset modules (`.js`, `.mjs`, `.cjs`) are not supported, and `@stoplight/spectral-owasp-ruleset` is replaced by vacuum's native OWASP rules rather than executed.

Beyond `vacuum lint` it has an interactive `dashboard`, an `html-report`, a `spectral-report` that emits Spectral-compatible output, change detection against a previous version of the document, `apply-overlay` for [OpenAPI Overlays](/specifications/openapi-overlay), and a language server for editors.

```sh
vacuum lint -d --ruleset .vacuum.yaml --fail-severity warn openapi.yaml
```

## Why use it in the API Lifecycle?

* **Fast enough to run on every save and every commit.** A single binary with no Node runtime starts instantly, which makes it practical in pre-commit hooks and editor integration, not only in CI.
* **A migration path from Spectral.** Most YAML rulesets run unchanged, so a team can switch linters without rewriting its style guide.
* **Clear exit codes.** `0` means no violations at or above `--fail-severity`, `1` means violations were found, `2` means the document could not be checked. CI can tell "fix the spec" from "fix the job".
* **Lint only what changed.** `--original` with a previous version of the document limits results to changed areas, and `--error-on-breaking` raises breaking changes as errors. That lets you adopt strict rules on a large legacy spec without fixing everything first.
* **Security rules included.** The OWASP ruleset checks for problems such as API keys in URLs, HTTP Basic authentication, unbounded arrays and integers, and operations with no security applied.

## Best Practices

* **Gate on `--fail-severity` and handle exit code 2 separately.** A parse failure is a different problem from a style violation, and the pipeline should report it differently.
* **Commit the ruleset and extend a built-in one.** Start from the recommended ruleset, turn rules off with a recorded reason, and add organization rules on top. The ruleset is your style guide in executable form; see [Design-First Governance](/guides/design-first-governance).
* **Use the ignore file sparingly, and only for specific paths.** `--ignore-file` accepts exact result paths and JSONPath expressions. Ignoring a rule for one legacy operation, where fixing it would itself be a breaking change, is legitimate; ignoring it globally means you no longer have the rule.
* **Check Spectral compatibility before switching.** If your ruleset is a JavaScript module or imports the Spectral OWASP package, it needs converting. Run both linters side by side on the same document once and compare results.
* **Lint the bundled document your tools consume.** If docs and SDKs are generated from a bundled or overlaid file, lint that file too; an overlay can introduce problems the source never had.
* **Pair it with a check that a linter cannot do.** vacuum checks the document. It cannot tell you the running API matches it, so add contract tests as well.
