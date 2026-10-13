---
name: "Newman"
description: "A command-line collection runner for Postman, allowing tests to be integrated directly into CI/CD pipelines."
category: "testing-mocking"
lifecycleStages: ["testing"]
url: "https://github.com/postmanlabs/newman"
pricing: "open-source"
---

## What is Newman?

Newman is a command-line collection runner for Postman, enabling users to execute and test Postman collections directly from the command line. It is designed for integration with continuous integration servers and build systems. Newman allows automation of tests and API checks within CI/CD pipelines.

## Why use it in the API Lifecycle?

* **Command-line execution**: Run Postman collections directly from the command line using `newman run`.
* **Programmatic usage**: Integrate Newman into JavaScript projects as a Node.js module to programmatically execute collections.
* **Data-driven iterations**: Run collections multiple times using data files (JSON or CSV) for iteration.
* **Customizable reporting**: Generate detailed reports in various formats including CLI, JSON, JUnit, and HTML, with options for external reporters.
* **Environment and global variable support**: Utilize and manage Postman environment and global variables during collection runs, either from files or directly from the command line.
* **SSL and proxy configuration**: Configure SSL client certificates, trusted CA certificates, and proxy settings for secure and controlled API interactions.

## Best Practices

* Integrate Newman into CI/CD pipelines to automate API testing and enforce quality gates.
* Use external reporters to generate customized reports for specific analysis or integration needs.
* Utilize command-line options for variables and data files to enable data-driven testing workflows.
* Set timeouts for requests and scripts to prevent runs from hanging indefinitely.
