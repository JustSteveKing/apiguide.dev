---
name: "Newman (Postman CLI)"
description: "A command-line collection runner for Postman, allowing tests to be integrated directly into CI/CD pipelines."
category: "testing-mocking"
lifecycleStages: ["testing"]
url: "https://github.com/postmanlabs/newman"
pricing: "open-source"
---

## What is Newman?

Newman is a command-line collection runner for Postman. It allows you to run and test Postman collections directly from the terminal, making it easy to integrate Postman suites into deployment workflows.

## Why use it in the API Lifecycle?

* **CI/CD Integration**: Run API verification suites automatically during GitHub Actions, GitLab CI, or Jenkins pipelines.
* **Flexible Reporters**: Exports test results into JSON, HTML, or JUnit XML formats for integration with dashboard reporters.
* **Header and Environment Control**: Pass environment variables and override files directly from the shell interface.

## Best Practices

* Export your collections and environments from Postman, commit them to your repository, and run Newman against the local files during CI checks.
