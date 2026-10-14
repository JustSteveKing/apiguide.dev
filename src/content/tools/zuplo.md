---
name: "Zuplo"
description: "A serverless API gateway built for developers, offering git-ops workflows, rate limiting, and instant documentation."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://zuplo.com"
pricing: "freemium"
---

## What is Zuplo?

Zuplo is a managed, programmable API gateway. A Zuplo project is a Git repository: routes are declared in `config/routes.oas.json`, an OpenAPI 3.1 document with a Zuplo extension that attaches handlers and policies to each operation; policy instances live in `config/policies.json`; and custom handlers and policies are TypeScript modules. Each Git branch deploys to its own environment, with the default branch as production, and projects run on Zuplo's managed edge network by default, with managed dedicated and self-hosted options. Built-in policies cover API key authentication, JWT and OAuth validation, rate limiting, quotas and request validation, and Zuplo also generates a developer portal from the same OpenAPI document. Newer features include an AI gateway for LLM traffic and a handler that exposes OpenAPI routes as an MCP server. There is a free plan with a monthly request limit.

## Why use it in the API Lifecycle?

* **OpenAPI as gateway configuration**: The routing file is an OpenAPI document, so the gateway, the docs and the developer portal are built from one source rather than three that drift apart.
* **GitOps and preview environments**: A pull request deploys to its own environment URL, so gateway changes can be tested before they reach production.
* **Programmable policies**: When a built-in policy is not enough, a TypeScript module can inspect or rewrite the request and response.
* **API key management**: Keys are issued per consumer, stored hashed, support rotation and carry metadata that policies can read, with self-serve issuance through the developer portal.
* **Rate limiting and quotas**: Limits can be keyed by user, IP or a custom function, and return [`429 Too Many Requests`](/status-codes/429) with a retry hint.
* **MCP server handler**: Existing routes can be exposed as MCP tools without writing a separate server. See [MCP Servers](/guides/mcp-servers).

## Best Practices

* Rate limit by consumer, not by IP. Use `rateLimitBy: "user"` behind API key or JWT authentication so one customer behind a NAT does not exhaust another's limit, and keep `headerMode` on `retry-after` so clients get a [`Retry-After`](/headers/retry-after) they can honor. [Rate Limiting](/guides/rate-limiting) covers choosing the window.
* Turn on the request validation policy for bodies, query and path parameters and headers. Every area defaults to `none`, so nothing is checked until you set it; start with `log-only` to see what real clients send, then move to `reject-and-log` so malformed requests get a [`400 Bad Request`](/status-codes/400) at the gateway instead of reaching the origin. See [Input Validation](/guides/input-validation).
* Review gateway changes like code. Since routes and policies are files in Git, require a pull request, test it on the preview environment, and never edit production through a UI that bypasses the repository.
* Keep secrets out of `policies.json`. Reference environment variables for upstream credentials and signing keys, so they are not committed and can differ per environment.
* Lock the origin down so it only accepts traffic from the gateway, using a shared secret header or mTLS. A gateway that can be bypassed by calling the origin directly enforces nothing. See [Mutual TLS](/guides/mutual-tls).
* Write custom TypeScript policies to be fast and side-effect free on the request path, and forward [`traceparent`](/headers/traceparent) to the origin so gateway latency shows up in your traces.
