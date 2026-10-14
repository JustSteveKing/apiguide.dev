---
name: "KrakenD"
description: "An ultra-performant, stateless API gateway built in Go, designed to handle large-scale routing without database dependencies."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://krakend.io"
pricing: "freemium"
---

## What is KrakenD?

KrakenD is a stateless, distributed API Gateway designed for microservices and AI workloads. It connects, secures, aggregates, transforms, or removes data across services. KrakenD handles thousands of API and AI requests per second.

## Why use it in the API Lifecycle?

* **API Aggregation**: Automatic composition and aggregation of multiple data sources into a single response.
* **Traffic Management**: Control traffic with rules such as rate limiting, concurrent calls, shadow proxy, bot detection, circuit breakers, and IP filtering.
* **Authentication**: Supports end-user validation and gateway-to-service validation with JWT, Client credentials, OAuth2, OpenID, API-Keys, Basic Auth, and mTLS.
* **Services Connectivity**: Connects to various services including REST APIs, RabbitMQ, SNS, SQS, Kafka, GraphQL, gRPC, SOAP, and Lambda.
* **Data and Protocol Manipulation**: Modifies data returned to the end-user or payload sent to services, including filtering fields, enriching responses, and automatic conversion from SOAP, JSON, or XML.
* **Monitor & Analytics**: Provides OpenTelemetry integrations and other exporters to push logs, metrics, and traces to processors or telemetry providers.

## Best Practices

* Manage API gateway configurations in a version control system (GitOps).
* Utilize the OpenAPI exporter to automatically generate documentation websites.
* Employ its stateless architecture for consistent performance when scaling globally or running intense workloads.
