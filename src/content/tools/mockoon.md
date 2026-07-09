---
name: "Mockoon"
description: "An easy-to-use local desktop mock server generator featuring a graphical interface."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://mockoon.com"
pricing: "freemium"
---

## What is Mockoon?

Mockoon is an open-source desktop application that allows developers to design and run local mock API servers. It provides a simple GUI to configure endpoints, status codes, custom headers, and body payloads.

## Why use it in the API Lifecycle?

* **Instant Setup**: Start local mock servers in seconds without writing code or editing YAML files.
* **Rules Engine**: Serve different payloads based on incoming request parameters (e.g. returning a 400 if a query parameter is missing).
* **Proxy Pass-through**: Route requests to a real API, and only mock specific endpoints that are still in development.

## Best Practices

* Export your Mockoon environment configurations as JSON files to version control them alongside frontend codebases.
