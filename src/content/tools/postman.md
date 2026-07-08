---
name: "Postman"
description: "A comprehensive API platform for building, testing, organizing, and collaborating on HTTP requests."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://postman.com"
pricing: "freemium"
---

## What is Postman?

Postman is a popular collaboration platform for API development. It provides an intuitive GUI client for sending HTTP requests, building automated test suites, creating mock servers, and publishing API documentation.

## Why use it in the API Lifecycle?

* **Request Collections**: Group requests logically by resource, enabling developers to share collections and environment variables across teams.
* **Automated Testing**: Write Javascript test scripts directly in Postman to assert response status codes, check body contents, and validate schemas.
* **CI/CD Integration**: Run your collections headlessly in deployment pipelines using Newman (Postman's CLI runner).

## Best Practices

* Use environment variables (`{{base_url}}`, `{{auth_token}}`) to switch seamlessly between Local, Staging, and Production environments.
