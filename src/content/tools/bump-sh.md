---
name: "Bump.sh"
description: "A hosted documentation platform for OpenAPI and AsyncAPI that diffs every release, flags breaking changes and publishes an automatic changelog."
category: "design-documentation"
lifecycleStages: ["design", "deployment"]
url: "https://bump.sh"
pricing: "paid"
---

## What is Bump.sh?

Bump.sh publishes API documentation portals from [OpenAPI](/specifications/openapi) and [AsyncAPI](/specifications/asyncapi) documents, and its core idea is that every deployment is compared with the previous one. Each release produces a diff, breaking changes are flagged, a changelog entry is written and subscribers can be notified. [OpenAPI Overlays](/specifications/openapi-overlay) are supported, so documentation-only changes can be applied without editing the source document.

The `bump` CLI and the Bump.sh GitHub Action drive it from CI: `bump diff` compares a document against what is deployed and `bump deploy` publishes. On pull requests the action can post the API diff as a comment, and it can fail the build on a breaking change (`fail_on_breaking` in the action, `--fail-on-breaking` in the CLI). Bump.sh also offers a managed MCP platform built from the same API documents.

Bump.sh is a paid product with a trial; open-source projects can apply for free access.

## Why use it in the API Lifecycle?

* **Breaking-change detection at review time.** The diff is posted on the pull request, so the reviewer sees "removed a required response field" before merge, not in a customer's bug report.
* **A changelog nobody has to write.** Consumers get a list of what changed in each release, derived from the documents rather than from release notes that skip the awkward parts.
* **REST and event-driven APIs in one portal.** OpenAPI and AsyncAPI documents publish side by side, which matters when an API pairs HTTP endpoints with [webhooks](/guides/webhooks) or message streams.
* **Docs and contract checks in one step.** The same CI job that validates the document publishes it, so the docs cannot be newer or older than the contract.

## Best Practices

* **Run `bump diff` on every pull request and fail on breaking changes.** Make the breaking change an explicit decision, overridden deliberately with a version bump, rather than something that slips through. See [Breaking Changes](/guides/breaking-changes).
* **Diff the bundled document, not a fragment.** If your spec is split across files with `$ref`, make sure the CLI resolves the whole tree, so a change in a shared schema is reported against every operation that uses it.
* **Do not treat "not breaking" as "safe".** A diff tool sees the contract. Adding a value to a response enum is non-breaking on paper and breaks clients that switch exhaustively; see [Forward-Compatible Enums](/guides/forward-compatible-enums).
* **Keep doc-only edits in overlays.** Extra descriptions, examples or hidden internal operations belong in an overlay applied at publish time, so the source document stays the one your generators and tests use.
* **Separate internal and public portals.** Publish internal operations from a separate document to a private portal. Anything left in the public document, however it is styled on the page, is public.
