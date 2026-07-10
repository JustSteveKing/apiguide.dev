---
name: "Newman"
description: "A command-line collection runner for Postman, allowing tests to be integrated directly into CI/CD pipelines."
category: "testing-mocking"
lifecycleStages: ["testing"]
url: "https://github.com/postmanlabs/newman"
pricing: "open-source"
---

## What is Newman?

Newman is a command-line collection runner for Postman, designed to execute and test Postman collections directly from the command line. It supports integration with continuous integration servers and build systems. Newman processes collection runs from local files or URLs.

## Why use it in the API Lifecycle?

* **Command-line Collection Execution**: Runs Postman collections directly from the command line, accepting collection files from local paths or remote URLs.
* **Data-Driven Iteration**: Supports executing collections multiple times using external data files in JSON or CSV format for parameterizing requests.
* **Flexible Variable Management**: Allows the use and overriding of environment and global variables through dedicated files, URLs, or direct specification via command-line arguments.
* **Customizable Test Reporting**: Generates various output reports including CLI, JSON, JUnit XML, and HTML formats, with support for external reporters.
* **Advanced Network Configuration**: Provides options for SSL client certificates, trusted CA certificates, and proxy settings, allowing for secure and controlled API interactions.
* **Programmatic Integration**: Can be used as a Node.js library, enabling programmatic execution of collections within JavaScript projects.

## Best Practices

* When using multiple reporters, explicitly enable the CLI reporter option if command-line output is desired.
* Configure the "bail" option to control whether a collection run stops immediately upon encountering the first script or test error.
* For file uploads within requests, ensure that the referenced files are located in the current working directory.
* Utilize standard environment variables (HTTP_PROXY, HTTPS_PROXY, NO_PROXY) to configure proxy settings for collection runs.
