---
name: "Thunder Client"
description: "A lightweight REST API client built into VS Code, with scriptless GUI tests and collections that can be saved to the project's Git repository."
category: "clients-debugging"
lifecycleStages: ["development", "testing"]
url: "https://www.thunderclient.com"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is Thunder Client?

Thunder Client is a REST API client that runs as an extension inside Visual Studio Code, made by Thunder Client Limited. It keeps requests, collections and environments in the editor alongside the code that serves them, so testing an endpoint does not mean switching to a separate desktop app. It is proprietary software with a free plan, which may be used for personal or business purposes, and paid plans that add JetBrains IDE support, team features, the CLI for CI/CD, and WebSocket, SSE and gRPC requests. Data is stored locally on the developer's machine by default.

## Why use it in the API Lifecycle?

* **In-editor client**: Send and inspect requests from a VS Code panel, next to the handler you are changing.
* **Scriptless testing**: Define assertions on status, headers, JSON fields, arrays, XML and schema through a GUI, with no test code to write.
* **Collections in Git**: The "Save to Workspace" setting writes collections and environments to a `thunder-tests` folder in the project, so they are versioned and reviewed with the code.
* **Environments and secrets**: Environment variables and encrypted environments keep base URLs and credentials out of individual requests, and the Enterprise plan adds secret manager integration for Azure and AWS.
* **CLI for pipelines**: On paid plans, the CLI runs requests and collections from a terminal or a CI job.
* **Local-first storage**: Request data is saved on the developer's machine rather than synced to a vendor cloud by default.

## Best Practices

* Turn on "Save to Workspace" from the start of a project and commit the `thunder-tests` folder. Requests created before it is enabled stay in the extension's global storage and have to be copied in by hand.
* Keep secrets out of the committed environment files. Use encrypted environments, or a secret manager on Enterprise, for tokens, and reference them as variables in the shared environment.
* Set "Workspace Relative Path" at Workspace scope, not User scope, if the folder should live somewhere other than the workspace root, and restart VS Code after changing either setting.
* Use it for exploring and checking endpoints during development, and keep the regression suite in a tool that runs everywhere without a per-seat license. The CLI that runs collections in CI is a paid feature. See [API Testing](/guides/api-testing) for how the layers fit together.
* Assert the contract in every saved request: the status code, the [`Content-Type`](/headers/content-type), and the fields the client depends on, so a collection doubles as a quick smoke test.
