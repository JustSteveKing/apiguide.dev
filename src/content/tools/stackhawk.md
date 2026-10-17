---
name: "StackHawk"
description: "A commercial DAST platform whose HawkScan scanner runs locally or in CI against REST, GraphQL, gRPC and SOAP APIs, configured with a stackhawk.yml file in the repository."
category: "security-testing"
lifecycleStages: ["development", "testing"]
url: "https://www.stackhawk.com"
pricing: "paid"
updatedDate: 2026-10-17
---

## What is StackHawk?

StackHawk is a dynamic application security testing (DAST) platform aimed at developers rather than a separate security team. Its scanner, HawkScan, runs from the `hawk` CLI (a native binary, or through Homebrew) or as a Docker image, on a developer's machine or in a CI pipeline, and reports findings to the StackHawk platform.

Scans are configured in a `stackhawk.yml` file committed alongside the application. The documentation has dedicated configuration for [OpenAPI](/specifications/openapi) REST APIs, [GraphQL](/specifications/graphql), [gRPC](/specifications/grpc), SOAP and [JSON-RPC](/specifications/json-rpc), and integration guides for GitHub Actions, GitLab, Jenkins, CircleCI, Azure Pipelines, Bitbucket Pipelines and others. StackHawk also sells an agent product that runs scans from inside AI coding tools.

Plans are paid, with a 14-day free trial.

## Why use it in the API Lifecycle?

* **Configuration lives with the code.** `stackhawk.yml` is reviewed and versioned like any other file, so the scan changes when the application does.
* **Runs where developers already are.** A local `hawk scan` against a service running on a laptop gives feedback before a pull request exists, and the same configuration runs in CI.
* **API-shaped inputs.** Scans can be driven from an API definition rather than a crawl, so they cover operations a crawler cannot discover.

## Best Practices

* **Scan in a disposable environment.** A DAST scan sends attack payloads and can create, change and delete data. Run it against a local or ephemeral instance with seeded test data, never production.
* **Configure authentication.** Most API vulnerabilities sit behind a login. A scan that cannot authenticate tests very little; configure authentication in `stackhawk.yml` and confirm the scan reaches protected endpoints.
* **Point it at the real definition.** Drive the scan from the same OpenAPI document you publish, so new endpoints are scanned as soon as they are documented. An endpoint missing from the document is missing from the scan.
* **Gate on new findings, not the backlog.** Fail the pipeline on new high-severity issues so the first adoption does not block every merge, then work the existing findings down.
* **Keep authorization tests separate.** DAST is good at injection, misconfiguration and data exposure; it cannot know your ownership rules. Broken object level authorization still needs explicit tests. See [API Security](/guides/api-security).
