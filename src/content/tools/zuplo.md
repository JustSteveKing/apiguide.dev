---
name: "Zuplo"
description: "A serverless API gateway built for developers, offering git-ops workflows, rate limiting, and instant documentation."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://zuplo.com"
pricing: "freemium"
---

## What is Zuplo?

Zuplo is a modern, serverless API gateway built specifically for developers. It compiles your routes and logic into Cloudflare Workers, deploying globally to the edge in seconds.

## Why use it in the API Lifecycle?

* **Git-Ops Native**: Configure your gateway using code and JSON in a Git repository. Every commit automatically deploys a preview environment.
* **Edge Execution**: Runs rate-limiting, CORS, API Key validation, and JWT validation at the edge, closest to the client, keeping latencies minimal.
* **Auto-generated Documentation**: Instantly generates beautiful public developer portals from your routes.

## Best Practices

* Use Zuplo's programmable TypeScript handlers to modify incoming request payloads or headers dynamically before they reach your origin.
