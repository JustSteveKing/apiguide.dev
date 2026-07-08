---
name: "Spectral (Stoplight)"
description: "A flexible, JSON/YAML linter for checking API designs against custom style rules and OpenAPI standards."
category: "design-documentation"
lifecycleStages: ["design"]
url: "https://stoplight.io/open-source/spectral"
pricing: "open-source"
---

## What is Spectral?

Spectral is an open-source JSON/YAML linter developed by Stoplight. It is primarily used to validate OpenAPI definitions, ensuring they are syntactically correct and conform to custom style guides.

## Why use it in the API Lifecycle?

* **Enforce Design Rules**: Ensure all endpoints have descriptions, use plural resource names, enforce camelCase/snake_case query parameters, and require rate-limiting headers.
* **Automate Reviews**: Run Spectral as a pre-commit hook or in your CI/CD pipeline to block pull requests containing poorly designed or non-standard API specs.
* **Multi-Format Support**: Linters are not limited to OpenAPI; Spectral can lint generic JSON, YAML, and AsyncAPI specifications.

## Best Practices

* Start with the default `oas` ruleset and progressively add custom rules as your API guidelines mature.
