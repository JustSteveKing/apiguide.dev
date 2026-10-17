---
name: "Fern"
description: "A hosted platform, owned by Postman since January 2026, that generates SDKs in nine languages and documentation sites from OpenAPI, AsyncAPI and gRPC definitions."
category: "sdk-generation"
lifecycleStages: ["development", "deployment"]
url: "https://buildwithfern.com"
pricing: "freemium"
---

## What is Fern?

Fern generates client SDKs and documentation sites from API definitions. SDK targets are TypeScript, Python, Go, Java, C#, PHP, Ruby, Swift and Rust, and Fern can also generate a CLI. Inputs are [OpenAPI](/specifications/openapi) for REST and webhooks, [AsyncAPI](/specifications/asyncapi) for WebSocket and event-driven APIs, Protocol Buffers for [gRPC](/specifications/grpc), and OpenRPC.

A project is a `fern/` directory containing `fern.config.json`, a `generators.yml` listing the targets, and the API definition. The `fern` CLI (`npm install -g fern-api`) validates it with `fern check` and runs generation with `fern generate`. Changes to an OpenAPI input are made with [OpenAPI Overlays](/specifications/openapi-overlay), which Fern recommends over its older proprietary overrides file.

Postman acquired Fern on January 8, 2026. Postman said the product, brand and roadmap would stay the same, and Fern continues to operate at buildwithfern.com. The public `fern-api/fern` repository (Apache-2.0) is now marked as no longer maintained; SDK, CLI, MCP and docs generation is offered through the hosted service. There is a free plan and an Enterprise plan.

## Why use it in the API Lifecycle?

* **SDKs and docs from one definition.** The reference, the code samples in it and the SDKs those samples call are all generated from the same input, so they cannot disagree.
* **Breadth of input formats.** One toolchain covers REST, WebSocket and gRPC APIs, which suits an organization that has all three.
* **Configuration in the repository.** Targets and their settings live in `generators.yml`, so what gets generated is reviewed and versioned like code.
* **Overlay support.** Target-specific renames and documentation tweaks live outside the source document.

## Best Practices

* **Account for the platform dependency.** With the open-source repository unmaintained, generation runs on Fern's service. Make sure you own and commit the generated SDK repositories, so a change in vendor terms leaves you with working code. Stainless customers learned this in 2026 when its hosted generator closed to new work.
* **Prefer overlays to overrides for OpenAPI.** Overlays follow the published [Overlay Specification](/specifications/openapi-overlay) and work with other tools; an overrides file only works with Fern.
* **Run `fern check` in CI on every pull request.** Invalid definitions should fail review, not the release job.
* **Get naming right in the spec.** SDK method and type names come from `operationId`s, tags and schema names. Fixing them once in the document is cheaper than configuring names per language. See [SDK Generation](/guides/sdk-generation).
* **Review the generated diff.** Treat a regenerated SDK like any other dependency upgrade: read the diff, and investigate any signature change you did not intend.
