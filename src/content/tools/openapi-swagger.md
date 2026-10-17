---
name: "Swagger (SmartBear)"
description: "SmartBear's Swagger tooling for OpenAPI: the open-source Swagger Editor, Swagger UI and Swagger Codegen, and a commercial design, documentation and testing platform."
category: "design-documentation"
lifecycleStages: ["design", "development"]
url: "https://swagger.io"
pricing: "freemium"
---

## What is Swagger (SmartBear)?

Swagger is SmartBear's family of tools for working with OpenAPI definitions. The name predates the standard: the Swagger Specification was donated to the OpenAPI Initiative under the Linux Foundation in 2015 and became the [OpenAPI Specification](/specifications/openapi), so "Swagger 2.0" and "OpenAPI 2.0" are the same format, and everything from OpenAPI 3.0 onward is governed by the OpenAPI Initiative, not by SmartBear. What remains under the Swagger name is tooling: the open-source Swagger Editor, Swagger UI and Swagger Codegen, supporting libraries such as Swagger Core and Swagger Parser, and a commercial platform (SwaggerHub and related products) that adds hosted design, governance, portals, and functional and contract testing.

## Why use it in the API Lifecycle?

* **Swagger UI**: Renders an OpenAPI or AsyncAPI definition as interactive reference documentation with a "Try it out" console. It is embedded in a large number of frameworks as the default `/docs` page, which makes it the format many API consumers recognize.
* **Swagger Editor**: A browser-based editor with validation and a live preview, useful for editing a definition by hand and seeing what it renders as.
* **Swagger Codegen**: Generates client SDKs and server stubs from a definition. The community fork [OpenAPI Generator](/tools/sdk-generation/openapi-generator), split off in 2018 and is maintained separately by its own community; compare both before choosing.
* **Swagger Core and Parser**: Java libraries for producing a definition from annotated code and for parsing and resolving definitions in your own tooling.
* **Commercial platform**: Central hosting of definitions, style-rule enforcement, developer portals, and functional and contract testing, for teams that want those as a managed service.

## Best Practices

* Name the format correctly. Call the document an OpenAPI definition and specify the version (`openapi: 3.1.0`); "Swagger" in a field name, file name or job title tells readers nothing about which version is meant, and 2.0 and 3.x differ in structure.
* Do not ship Swagger UI's "Try it out" against production with real credentials by default. Point the `servers` entry at a sandbox, and if the console must be enabled, restrict it with `supportedSubmitMethods` (an empty array disables the console for every operation, or list only `get`) so a reader cannot fire a [`DELETE`](/methods/delete) at live data from the docs page.
* If Swagger UI is served from a different origin from the API, the browser makes real cross-origin requests from the console, so the API needs a correct [CORS](/guides/cors) configuration, including [`Access-Control-Allow-Headers`](/headers/access-control-allow-headers) for `Authorization`. Widening CORS just to make the docs console work is a security decision, not a docs fix.
* Treat the definition as the source of truth and make the rendered docs a build artifact: lint the definition in CI with [Spectral](/tools/design-documentation/spectral-stoplight) or [vacuum](/tools/design-documentation/vacuum), then publish Swagger UI from the linted file. See [Design-First and Governance](/guides/design-first-governance).
* Document error responses, not only the happy path. A definition that lists only `200` renders docs that hide every failure; describe the [`application/problem+json`](/specifications/problem-details) shape for `4xx` and `5xx` responses so both the docs and generated clients handle them.
* Before generating SDKs, decide between Swagger Codegen and OpenAPI Generator per language by reading the generated code, and pin the generator version so a regeneration does not silently change the client's public API. [SDK Generation](/guides/sdk-generation) covers the trade-offs.
