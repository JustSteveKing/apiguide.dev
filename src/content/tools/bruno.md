---
name: "Bruno"
description: "A fast, git-friendly open-source API client that stores collections directly as folder structures."
category: "clients-debugging"
lifecycleStages: ["development"]
url: "https://www.usebruno.com"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is Bruno?

Bruno is an offline-only desktop API client for REST, GraphQL, gRPC and WebSocket APIs. Collections are stored as plain-text files in a folder on disk, written in Bruno's own Bru markup or in OpenCollection YAML, so they live in the same Git repository as the code they exercise. There is no cloud sync and no account requirement. The core application is MIT-licensed open source; paid Pro and Ultimate plans add private Git provider integration, OpenAPI sync, SSO and other team features. The `@usebruno/cli` package provides the `bru` command for running collections in CI.

## Why use it in the API Lifecycle?

* **Collections in Git**: Each request is a file, so changes to an API collection are reviewed, diffed and merged in the same pull request as the endpoint change.
* **Local-only data**: Requests, responses and credentials never pass through a vendor's servers, which matters when the API carries regulated data.
* **Secrets kept out of the repository**: Variables marked secret are encrypted locally and never written to the environment file, so environment files can be committed safely.
* **Scripting and tests**: Pre-request and post-response scripts and test assertions run in the app and in the CLI.
* **CLI runs**: `bru run` executes a collection or folder with `--env`, `--env-var` overrides, CSV or JSON data files, tag filters, and JSON, JUnit or HTML reports.

## Best Practices

* Keep the collection in a `bruno/` (or similar) directory in the service's repository and update it in the same pull request that changes the endpoint. A collection maintained in a separate repository drifts from the API, because nothing forces the two to change together.
* Mark tokens, API keys and passwords as secret variables, or read them from a `.env` file that is in `.gitignore`. Never commit a real credential to an environment file; once it is in Git history it has to be rotated. See [Token Lifecycle](/guides/token-lifecycle).
* Run the collection in CI with `bru run --env ci --reporter-junit results.xml` so failures show up as test results, and inject per-pipeline values with `--env-var` rather than editing files.
* Write assertions against the contract: the status code, the [`Content-Type`](/headers/content-type) and the fields clients use. Asserting whole response bodies makes tests fail on every timestamp and generated ID.
* Chain requests by capturing values in post-response scripts (for example the `id` from a [`201 Created`](/status-codes/201) or the [`Location`](/headers/location) header) instead of hard-coding IDs that only exist in one environment.
* Tag requests (`smoke`, `destructive`) and use `--tags` and `--exclude-tags`, so a smoke run against production never executes a request that deletes data.
* The CLI runs scripts in a restricted sandbox by default; pass `--sandbox=developer` only for collections you trust, because it allows scripts broader access to the machine.
