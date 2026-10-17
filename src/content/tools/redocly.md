---
name: "Redoc (Redocly)"
description: "Generates clean, responsive, and highly readable API reference documentation from OpenAPI specifications."
category: "design-documentation"
lifecycleStages: ["design"]
url: "https://redocly.com"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is Redoc (Redocly)?

Redoc is an open-source (MIT) renderer that turns an [OpenAPI](/specifications/openapi) document into a three-panel API reference: navigation on the left, operations in the middle, request and response samples on the right. It is maintained by Redocly, which also publishes Redocly CLI, an open-source command-line tool for linting, bundling, splitting and previewing API descriptions and building Redoc into a standalone HTML file. Redocly's commercial hosted platform builds on both, adding a try-it console (Replay), generated code samples, a mock server, access control and a developer portal; those features are not part of the open-source Redoc.

## Why use it in the API Lifecycle?

* **Readable reference docs from the description**: Redoc renders Swagger 2.0 and OpenAPI 3.x, including nested and polymorphic (`oneOf`, `anyOf`) schemas, with deep links to every operation and schema property.
* **One-file publishing**: `redocly build-docs openapi.yaml` produces a single HTML file that can be hosted anywhere, with no server-side component.
* **Linting**: `redocly lint` checks descriptions against built-in rulesets (`spec`, `minimal`, `recommended`, `recommended-strict`) or your own `redocly.yaml` configuration, with output formats for GitHub Actions, JUnit and Checkstyle.
* **Bundling and splitting**: `redocly bundle` resolves `$ref`s across files into one document for tools that need it, and `redocly split` breaks a monolithic OpenAPI 3.x document into a file per path item and component.
* **Workflow testing**: `redocly respect` runs API tests described in [Arazzo](/specifications/arazzo) workflows against a live server.
* **Navigation extensions**: `x-tagGroups` groups tags in the side menu, and `x-codeSamples` attaches hand-written code samples to operations.

## Best Practices

* Keep the OpenAPI source split across files for editing, and run `redocly bundle` in CI to produce the single file that Redoc, SDK generators and gateways consume. Commit the source, publish the bundle.
* Run `redocly lint --format=github-actions` on every pull request that touches the description, extending `recommended` and adding rules for your house style. Rules such as `operation-4xx-response` (every operation documents at least one 4xx) and `security-defined` catch gaps that render as silently incomplete docs.
* When a rule cannot be fixed yet, record it with `--generate-ignore-file` rather than turning the rule off globally, so the existing debt is visible and new violations still fail.
* Write `description` fields for the reader of the rendered page: when to call the operation, what each error status means, and what the client should do about it. Redoc renders Markdown, so link to the errors your API returns, for example [`409 Conflict`](/status-codes/409) on a duplicate create.
* Document error responses with a real schema, ideally [Problem Details](/specifications/problem-details), and give examples for each. An operation that documents only `200` renders as if it can never fail.
* Use `x-tagGroups` and tag descriptions to give a large API a structure a reader can scan; ungrouped tags in a long side menu are the most common reason generated references are hard to use. For governance beyond linting, see [Design-First Development and API Governance](/guides/design-first-governance).
