---
name: "Optic"
description: "Automates API contract testing by tracking changes, catching breaking changes, and verifying documentation accuracy."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://useoptic.com"
pricing: "freemium"
---

## What is Optic?

Optic is an OpenAPI tool that provides linting, diffing, and testing functionalities. It assists in preventing breaking changes, ensuring the publication of accurate API documentation, and enhancing the overall design of APIs.

## Why use it in the API Lifecycle?

* **OpenAPI Generation**: Generates OpenAPI specifications directly from test traffic captured from your APIs.
* **Schema Accuracy Maintenance**: Ensures the OpenAPI specification remains accurate through automated schema testing and patching.
* **Breaking Change Detection**: Identifies breaking changes in API contracts to prevent unintended impacts on consumers.
* **API Lint Rule Application**: Applies specified linting rules to enforce API design standards and consistency.
* **Distributed Spec Support**: Supports OpenAPI specifications that are split across multiple files and utilize $ref.
* **API Governance**: Provides capabilities for establishing and enforcing API governance policies, including forward-only changes.

## Best Practices

* Regularly generate and update OpenAPI specifications using traffic from tests to ensure the documentation reflects the current API behavior.
* Integrate the tool's breaking change detection into your CI/CD pipeline to identify and prevent incompatible API changes before deployment.
* Define and apply API linting rules across your projects to maintain consistent API design and adhere to organizational standards.
* Leverage the tool's versioning features to manage API evolution and ensure compatibility across different API versions.
