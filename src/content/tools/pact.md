---
name: "Pact"
description: "A consumer-driven contract testing framework that lets services verify their integrations without spinning up full end-to-end environments."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://pact.io"
pricing: "freemium"
---

## What is Pact?

Pact is an open-source tool for contract testing, which enables verification of interactions between web applications, APIs, and microservices. It helps prevent integration issues by ensuring compatibility between systems. Pact aims to facilitate faster and more reliable deployments in microservices architectures.

## Why use it in the API Lifecycle?

* **Integration testing for REST APIs**: Pact provides testing capabilities specifically designed for RESTful API interactions.
* **Integration testing for message driven systems**: The tool supports testing for systems that communicate using messages, such as queues.
* **Integration testing for serverless architectures**: Pact extends its testing capabilities to serverless functions and their integrations.
* **Integration with CI/CD Pipelines**: Pact can be integrated into continuous integration and continuous delivery pipelines to automate testing.
* **API stub generation**: Pact can generate API stubs that accurately represent the behavior of real systems, enabling offline testing.
* **Deployment safety checks**: When combined with the Pact Broker, Pact's `can-i-deploy` feature indicates if a component is safe to release.

## Best Practices

* Prevent integration issues early in the development cycle, before committing changes or reaching production.
* Utilize the Pact Broker to manage and promote contracts within CI/CD pipelines, orchestrating complex release processes.
* Reduce reliance on complex and unreliable end-to-end test environments and test data management.
* Leverage Pact's API stubs to enable offline testing and ensure consumer-provider compatibility.
