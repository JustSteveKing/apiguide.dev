---
name: "Prism (Stoplight)"
description: "An open-source mock server that parses OpenAPI specifications and runs mock API endpoints."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://stoplight.io/open-source/prism"
pricing: "open-source"
---

## What is Prism?

Prism is an open-source HTTP mock and validation server. It reads an OpenAPI specification file and instantly runs a local server that mimics your actual API endpoints.

## Why use it in the API Lifecycle?

* **Local Mocking**: Front-end developers can run Prism locally using the backend spec, allowing them to build UI elements before the backend is implemented.
* **Request Validation**: Prism validates incoming client requests against the spec, immediately returning errors if fields are missing or use invalid formats.
* **Contract Testing**: Run local test suites against the mock server to confirm client application integrations conform to the specification rules.

## Best Practices

* Run Prism in `--dynamic` mode to generate varying, realistic mock data instead of returning static defaults.
