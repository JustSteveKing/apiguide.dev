---
name: "Optic"
description: "An OpenAPI diffing, linting and breaking-change tool whose repository was archived in January 2026 after Optic Labs joined Atlassian."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://github.com/opticdev/optic"
pricing: "open-source"
updatedDate: 2026-10-14
---

## What is Optic?

Optic is an MIT-licensed OpenAPI tool that diffed specifications, applied lint rules, caught breaking changes between versions, and could generate or patch a specification from captured test traffic. It is no longer maintained. Optic Labs became part of Atlassian, the `opticdev/optic` repository was archived on January 12, 2026 and is now read-only, and `useoptic.com` redirects to that repository. The CLI still installs from npm as `@useoptic/optic`, but it receives no fixes, no new OpenAPI support and no security updates.

## Why use it in the API Lifecycle?

New adoption is not recommended. If a pipeline already depends on Optic, this is what it was doing, and what each job needs to move to:

* **Breaking change detection**: Comparing the specification on a branch with the one on the main branch and failing the build on a removed field, a newly required parameter or a narrowed type. The maintained equivalent is oasdiff, an Apache-2.0 CLI whose `oasdiff breaking` command does the same job and which has a GitHub Action.
* **Lint rules**: Applying style and governance rules to the specification. [vacuum](/tools/design-documentation/vacuum) and [Spectral](/tools/design-documentation/spectral-stoplight) cover this, and both run Spectral-format rulesets.
* **Specification from traffic**: Capturing test traffic and proposing schema patches so the document matched the implementation. No direct drop-in replacement exists; validating responses against the specification in contract tests, for example with [Schemathesis](/tools/testing-mocking/schemathesis) or [Prism](/tools/testing-mocking/prism)'s validation proxy, catches the same drift from the other direction.

## Best Practices

* Plan a migration rather than pinning the last version indefinitely. An archived CLI will eventually fail on a newer OpenAPI version or a Node.js upgrade, and it fails in the job that is supposed to stop breaking changes reaching clients.
* Replace the breaking-change gate first, because it is the one with consequences. Run `oasdiff breaking base.yaml revision.yaml --fail-on ERR` against the main branch's specification on every pull request, which reproduces the core of what Optic's CI check did.
* Keep the rule that made the gate useful: additive changes pass, removals and new required inputs fail unless the change ships as a new version with a [`Deprecation`](/headers/deprecation) and [`Sunset`](/headers/sunset) period for the old one. [Breaking Changes](/guides/breaking-changes) and [Deprecation and Sunsetting](/guides/deprecation-sunsetting) cover what counts as breaking and how to retire the old behavior.
* Move lint rules into a Spectral-format ruleset so they work with both vacuum and Spectral, and are no longer tied to a single tool's configuration format.
* Remove `useoptic.com` links and Optic badges from READMEs and internal docs; they now point at an archived repository and suggest a check that may no longer run.
