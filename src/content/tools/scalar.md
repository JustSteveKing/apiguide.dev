---
name: "Scalar"
description: "An MIT-licensed interactive API reference and API client for OpenAPI documents, with a hosted platform for docs, SDKs and MCP servers."
category: "design-documentation"
lifecycleStages: ["design", "development"]
url: "https://scalar.com"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is Scalar?

Scalar is two things that share a name. The first is an open-source API reference renderer and API client, published under the MIT license in the `scalar/scalar` repository: point it at an [OpenAPI](/specifications/openapi) document and it renders an interactive reference with a built-in request client and generated code samples. It ships as an npm package, a single ESM script from a CDN, and integrations for around thirty frameworks and platforms. Several frameworks, Litestar, ElysiaJS and Nitro among them, ship it as their default docs UI.

The second is a hosted platform built around the same renderer: Scalar Docs (Markdown and MDX guides beside the reference, configured through `scalar.config.json` and synced with Git), a registry for versioned OpenAPI documents, an SDK generator and hosted MCP servers. The platform has a free plan and paid tiers. The renderer itself costs nothing and runs anywhere you can serve a page.

The renderer reads OpenAPI 3.0 and 3.1 and upgrades Swagger 2.0 documents on load, so an older document will render without a conversion step.

## Why use it in the API Lifecycle?

* **No build step for a reference page.** One HTML file importing `@scalar/api-reference` from a CDN, with `createApiReference('#app', { url: '/openapi.json' })`, is a working reference. That makes it practical to ship docs with every service, not just the flagship API.
* **The reference and the client are the same tool.** Readers send real requests from the page, and the standalone API client opens the same OpenAPI document offline, so the thing a developer explores and the thing they test against do not drift.
* **Framework integrations serve the spec you already generate.** If your framework emits OpenAPI at runtime, the integration serves Scalar at a route next to it, which keeps the rendered docs exactly as current as the code.
* **Self-hosting is the default, not an upgrade.** The MIT renderer has no dependency on Scalar's servers; the hosted registry and CORS proxy are optional.
* **An upgrade path when you outgrow a single page.** Guides, versioning, generated SDKs and an MCP server can be added on the hosted platform from the same document, without changing the source of truth.

## Best Practices

* **Pin the renderer version in production.** The CDN examples load the latest build. Pin a version in the script URL or lock the npm package so a renderer release cannot change your public docs without a review.
* **Run your own CORS proxy, or none.** The examples use `proxy.scalar.com` so the in-page client can reach APIs that do not send CORS headers. For an internal or authenticated API, either send the right [CORS](/guides/cors) headers from the API or run the proxy yourself; do not route customer credentials through a third party by default.
* **Serve a static, versioned document.** Point `url` at a file published by CI (for example `openapi.v2.json`), not at a live endpoint that changes with every deploy. Readers then see the contract you released, not whatever is on `main`.
* **Upgrade Swagger 2.0 sources instead of relying on the on-load conversion.** The automatic upgrade is a convenience for rendering. Your linter, generators and contract tests should all read the same 3.x document.
* **Lint before you render.** Scalar renders what it is given, including a missing `operationId` or an undocumented error response. Gate the document with [Spectral](/tools/design-documentation/spectral-stoplight) or [vacuum](/tools/design-documentation/vacuum) first; see [Design-First Governance](/guides/design-first-governance).
* **Write examples in the document, not in the page.** Request and response `examples` in the OpenAPI document feed the reference, the client and any SDK or MCP output at once. Prose added around the reference helps one surface only.
