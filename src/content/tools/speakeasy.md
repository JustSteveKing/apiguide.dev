---
name: "Speakeasy"
description: "An OpenAPI SDK generator for seven languages, plus CLI, MCP server and Terraform provider generation, open-sourced under AGPL-3.0 with commercial licensing."
category: "sdk-generation"
lifecycleStages: ["development"]
url: "https://www.speakeasy.com/docs/sdks/create-client-sdks"
pricing: "freemium"
updatedDate: 2026-10-17
---

## What is Speakeasy?

Speakeasy generates client SDKs from an [OpenAPI](/specifications/openapi) document: TypeScript, Python, Go, Java, C#, PHP and Ruby, along with CLIs, MCP servers and Terraform providers from the same input. Configuration lives in `.speakeasy/gen.yaml` beside the generated code, and target-specific changes to the input are made with [OpenAPI Overlays](/specifications/openapi-overlay) rather than edits to the source document.

In September 2026, in a partnership with Google, Speakeasy open-sourced its generator suite under AGPL-3.0 in the `speakeasy-api/openapi-generation` repository. The licensing of what it generates is the part to read carefully: the generator refuses to run until you elect a license for its output. Elect AGPL-3.0-only and the output carries an AGPL `LICENSE` and `NOTICE` for the Speakeasy-authored material; supply a commercial license token and the generated SDK is yours to license however you like. Commercial licenses are sold by Speakeasy.

Speakeasy's own site now leads with an enterprise AI control plane (an MCP gateway with identity, security and observability). The SDK generation documentation is still published and the generator is still released.

## Why use it in the API Lifecycle?

* **A small set of maintained targets.** Seven SDK languages from one vendor, each with its own configuration and test suite, against [OpenAPI Generator](/tools/sdk-generation/openapi-generator)'s dozens of community templates of varying maturity. Fewer targets, more consistent output.
* **One input, several surfaces.** SDKs, a CLI, an MCP server and a Terraform provider from one document keep every consumer-facing interface on the same contract.
* **Overlays instead of forks of the spec.** Renaming a method for one language or hiding an operation from the SDK is an overlay applied at generation time, so the source document stays canonical.
* **Source you can read.** With the generator open, a surprising output can be traced to a template and fixed or reported, rather than waited on.

## Best Practices

* **Decide the output license before the first release.** If your SDK is meant to be MIT or Apache-2.0, or used inside proprietary software, you need the commercial license. Discovering after publication that every generated file carries an AGPL notice is an expensive conversation with your legal team.
* **Fix the spec before configuring the generator.** Stable `operationId`s, named component schemas and documented error responses are what make method names, type names and exceptions sensible in every language. See [SDK Generation](/guides/sdk-generation).
* **Keep overlays small and target-specific.** The project's own guidance is to use an overlay only for behavior genuinely specific to a target. Anything that is true for every consumer belongs in the source document.
* **Commit `gen.yaml` and regenerate in CI.** Generation should be reproducible from the repository. Review the SDK diff on each spec change; an unexpected diff in an SDK is often the first sign of an unintended breaking change in the API.
* **Do not hand-edit generated files.** Changes will be lost on the next run. Put custom code where the generator documents it is preserved, or wrap the SDK.
