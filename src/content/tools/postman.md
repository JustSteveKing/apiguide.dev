---
name: "Postman"
description: "A comprehensive API platform for building, testing, organizing, and collaborating on HTTP requests."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://postman.com"
pricing: "freemium"
---

## What is Postman?

Postman CLI enables agents to perform API-related tasks from the command line, enhancing development and production workflows. It aims to improve accuracy and efficiency in API engineering for agents. This tool allows for the execution of Postman collections, tests, and API workflows directly within an editor environment.

## Why use it in the API Lifecycle?

* **API Discovery**: Find and reuse APIs within an organization.
* **API Testing**: Generate request collections and assertions to identify regressions.
* **API Mocking**: Create mock servers for APIs that are not yet developed.
* **API Monitoring**: Observe live endpoints for uptime and identify drift.
* **CI Integration**: Run collection and governance checks on each code commit.
* **Performance Testing**: Simulate load to identify system bottlenecks.

## Best Practices

* Integrate the Postman CLI into coding agents by running 'postman init' to load agent skills.
* Keep agent skills current by regularly running 'postman skills status'.
* Utilize the Context Graph to provide agents with a structured, queryable map of APIs, collections, and their relationships.
* Secure API access for agents and humans using Passport to manage credentials without direct secret handling.
