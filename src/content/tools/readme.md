---
name: "ReadMe"
description: "A hosted API documentation platform that turns OpenAPI into an interactive reference, with guides, Git sync, the rdme CLI and API usage metrics."
category: "design-documentation"
lifecycleStages: ["development", "deployment", "monitoring"]
url: "https://readme.com"
pricing: "freemium"
---

## What is ReadMe?

ReadMe is a hosted developer hub. Upload an [OpenAPI](/specifications/openapi) document (Swagger 2.0 and OpenAPI 3.x are accepted) and it generates an interactive API reference with an API explorer, code samples and authentication handling. Guides, a changelog and recipes sit alongside the reference, written in a WYSIWYG editor or in Markdown with bi-directional sync to GitHub, GitHub Enterprise Server or GitLab.

Its distinguishing feature is metrics: ReadMe can show API usage per developer, including total calls, error rates, top endpoints and top errors, next to the documentation those developers are reading.

`rdme` is the official CLI and GitHub Action (MIT licensed). `rdme openapi` syncs and validates the API definition, and `rdme docs`, `rdme reference` and `rdme changelog` upload Markdown. Validation works without a ReadMe account.

There is a free Starter plan; collaboration, branching and more advanced features are on the paid Pro and Enterprise plans.

## Why use it in the API Lifecycle?

* **Reference generated from the contract.** The API reference is rebuilt from the OpenAPI document on each sync, so endpoint pages reflect the spec rather than someone's memory of it.
* **CI-driven publishing.** The `readmeio/rdme` GitHub Action syncs the definition on merge, which removes the manual upload step that usually lets docs fall behind.
* **Usage data next to docs.** Seeing which endpoints fail most often for real consumers tells you where the reference or the guides are not doing their job.
* **Docs as a reviewable branch.** Git sync lets documentation changes go through the same pull request flow as code.

## Best Practices

* **Validate in CI with `rdme openapi validate` before syncing.** It needs no account, so run it on every pull request, not just on the merge that publishes.
* **Pin the action's major version.** Use `readmeio/rdme@v10` (or the major that matches your project generation) rather than a floating ref. Major versions of `rdme` map to different ReadMe project versions, and a silent upgrade can break publishing.
* **Make the OpenAPI document the only place endpoint details are edited.** A parameter description fixed in the ReadMe editor and not in the spec is a fix your SDKs, mocks and tests never see. Fix it in the spec.
* **Keep the API key out of the repository.** Store the ReadMe API key as a CI secret scoped to the publish job; pull requests from forks should only validate.
* **Treat metrics as personal data.** Usage metrics identify individual API consumers. Decide what you send, and redact secrets and personal data from logged requests; see [Logging Without Leaking PII](/guides/logging-pii).
* **Write guides for tasks, not endpoints.** The reference already lists every operation. Guides earn their place by covering authentication, [pagination](/guides/pagination), errors and the multi-call workflows the reference cannot express.
