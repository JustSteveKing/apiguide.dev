---
name: "Mintlify"
description: "A hosted docs-as-code platform: MDX pages in a Git repository, configured by docs.json, with API reference pages generated from OpenAPI and AsyncAPI."
category: "design-documentation"
lifecycleStages: ["development", "deployment"]
url: "https://www.mintlify.com"
pricing: "freemium"
---

## What is Mintlify?

Mintlify is a hosted documentation platform. A docs site is a Git repository of MDX pages plus a `docs.json` file that defines navigation, theme and the API reference. Pushing to the production branch deploys the site; a web editor exists for people who would rather not touch Git, and it commits to the same repository.

API reference pages are generated from [OpenAPI](/specifications/openapi) 3.0, 3.1 and 3.2 documents referenced from `docs.json`, with an interactive playground for each operation. [AsyncAPI](/specifications/asyncapi) documents are supported for event-driven APIs. Swagger 2.0 is not in the supported list, so convert older documents first.

Published sites expose `llms.txt` and `llms-full.txt` and a hosted search MCP server, so the same content is readable by people and by agents. The `mint` CLI (`npm i -g mint`) runs a local preview with `mint dev` and checks the project with `mint validate` and `mint broken-links`.

There is a free Starter plan and paid Pro and Enterprise plans.

## Why use it in the API Lifecycle?

* **Docs live in the same review process as code.** MDX in Git means a documentation change is a pull request, with a diff, a reviewer and a history, rather than an edit in a CMS nobody audits.
* **The reference is generated, the guides are written.** OpenAPI drives the endpoint pages; MDX carries the explanation, tutorials and migration notes that a spec cannot express.
* **A CLI that can fail a build.** `mint validate` checks the project, including the OpenAPI files it references, and `mint broken-links` checks internal links, so both can gate CI.
* **Agent-readable output by default.** `llms.txt` and the search MCP server come with the hosted site, which matters if your API is consumed through coding assistants as well as browsers.

## Best Practices

* **Keep the OpenAPI document in the API's repository and fetch it at build.** Copying the spec into the docs repo by hand guarantees drift. Publish it from the API's CI and reference the published file, or sync it in automatically.
* **Run `mint validate` and `mint broken-links` on every docs pull request.** A dead link or a spec that no longer parses should fail review, not be found by a reader.
* **Do not hand-write endpoint pages.** If an MDX page restates an operation's parameters, it will eventually contradict the spec. Generate the reference from OpenAPI and link to it from guides; Mintlify publishes a migration guide for exactly this.
* **Host the OpenAPI file where the build can reach it.** Builds that fetch a spec from a private host, behind authentication, or from a URL that is not yet deployed fail. Commit the file or publish it to a public, stable URL.
* **Keep components to a minimum.** MDX invites custom components in every page. Each one is code you maintain through the next redesign; prefer the built-in components and plain Markdown.
* **Lint the spec upstream.** Mintlify renders; it does not enforce your API style guide. Run [Spectral](/tools/design-documentation/spectral-stoplight) or [vacuum](/tools/design-documentation/vacuum) in the API's pipeline. See [Design-First Governance](/guides/design-first-governance).
