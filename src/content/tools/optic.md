---
name: "Optic"
description: "Automates API contract testing by tracking changes, catching breaking changes, and verifying documentation accuracy."
category: "design-documentation"
lifecycleStages: ["development", "testing"]
url: "https://useoptic.com"
pricing: "freemium"
---

## What is Optic?

Optic is an API contract testing and versioning tool that acts like "Git for APIs." It observes your actual API traffic and compares it against your OpenAPI documentation, automatically flagging drift or breaking changes.

## Why use it in the API Lifecycle?

* **Catch Breaking Changes**: Automatically diffs API changes in CI/CD, flagging removed fields, modified status codes, or new required fields before deployment.
* **Zero-effort Spec Maintenance**: Generates and updates OpenAPI specs automatically by observing local development requests rather than requiring manual YAML edits.
* **Verify Implementations**: Ensures that the code actually behaves exactly as documented in the spec.

## Best Practices

* Integrate Optic in your pull request checks to generate visual diffs of API contract changes on every branch.
