---
name: "OpenAPI / Swagger"
description: "The industry-standard specification format for describing, designing, and documenting RESTful APIs."
category: "design-documentation"
lifecycleStages: ["design", "development"]
url: "https://swagger.io"
pricing: "open-source"
---

## What is OpenAPI / Swagger?

OpenAPI (formerly Swagger Specification) is a machine-readable interface description language for describing, producing, consuming, and visualizing RESTful web services. Swagger is the suite of open-source tools built around the OpenAPI Specification (OAS).

## Why use it in the API Lifecycle?

* **Design-First Development**: Define your API contract in YAML or JSON *before* writing code. This allows frontend and backend teams to develop in parallel.
* **Auto-generated Documentation**: Tools like Swagger UI generate interactive developer documentation where users can test API requests directly in the browser.
* **Code Generation**: Automatically generate client libraries (SDKs) and server stubs in dozens of programming languages.

## Best Practices

* Use spectral linters to enforce organizational style guides on your OpenAPI schemas.
* Treat the OpenAPI file as the single source of truth and store it in version control (git).
