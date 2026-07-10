---
name: "Prism (Stoplight)"
description: "An open-source mock server that parses OpenAPI specifications and runs mock API endpoints."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://stoplight.io/open-source/prism"
pricing: "open-source"
---

## What is Prism (Stoplight)?

Prism is an open-source HTTP mock and proxy server that emulates API behavior using OpenAPI v2/v3 documents. It generates realistic mock servers to accelerate API development.

## Why use it in the API Lifecycle?

* **Quick Iterations**: Allows for incorporating user feedback during the API design phase to refine the API before coding.
* **Develop in Parallel**: Enables frontend and backend teams to work concurrently by providing mock servers for frontend development before backend completion.
* **Dynamic Examples**: Generates valid and varied random examples from API descriptions, rather than static ones, to prevent bias in code and testing.
* **Validation**: Performs validation of both request and response data against the API specification, flagging non-compliant inputs or invalid examples.
* **Mocking Callbacks**: Supports OpenAPI v3.0 callback definitions, allowing for integration of callback functionality prior to API implementation.
* **Validation Proxy**: Identifies discrepancies between an OpenAPI document and the target API, helping frontend developers during integration.

## Best Practices

* Incorporate user input during the API design phase to iterate and refine the API early, reducing change costs.
* Utilize the mock server to enable simultaneous work for frontend and backend teams, allowing frontend development to proceed without waiting for backend completion.
* Activate the proxy in pre-production environments to ensure the OpenAPI document and the API code remain consistent.
