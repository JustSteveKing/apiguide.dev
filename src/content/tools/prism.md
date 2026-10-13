---
name: "Prism (Stoplight)"
description: "An open-source mock server that parses OpenAPI specifications and runs mock API endpoints."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://stoplight.io/open-source/prism"
pricing: "open-source"
---

## What is Prism (Stoplight)?

Prism is an open-source HTTP mock and proxy server that generates mock HTTP servers from OpenAPI v2/v3 documents. It allows for the emulation of API behavior, facilitating development and testing processes.

## Why use it in the API Lifecycle?

* **Quick Iterations**: Incorporate user input during the design phase of an API to refine it based on insights and requirements, reducing the cost of change.
* **Develop in Parallel**: Enable frontend and backend teams to work simultaneously by providing a mock server for frontend developers before the backend is complete.
* **Dynamic Examples**: Generate dynamic, random examples based on API descriptions to ensure validity and versatility, avoiding biases from static examples.
* **Validation**: Validate both request and response data against the API specification, flagging non-compliant requests or invalid examples.
* **Mocking Callbacks**: Support OpenAPI v3.0 callback functionality, allowing API designers to define and integrate callbacks before the API is built.
* **Validation Proxy**: Identify discrepancies between the OpenAPI document and the target API by enabling a proxy in pre-production environments to keep documentation and code synchronized.

## Best Practices

* Integrate user feedback early in the API design phase to reduce rework.
* Utilize the mock server to enable concurrent development between frontend and backend teams.
* Employ the validation proxy in pre-production environments to maintain consistency between API specifications and implemented code.
