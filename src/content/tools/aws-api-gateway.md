---
name: "AWS API Gateway"
description: "A fully managed service enabling developers to publish, maintain, and secure APIs at any scale in AWS."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://aws.amazon.com/api-gateway"
pricing: "paid"
---

## What is AWS API Gateway?

Amazon API Gateway is a service for creating, publishing, maintaining, monitoring, and securing APIs at various scales. It supports RESTful APIs and WebSocket APIs for real-time communication. The service handles tasks such as traffic management, authorization, throttling, and API version management.

## Why use it in the API Lifecycle?

* **API Creation and Management**: Create, publish, maintain, and monitor HTTP, REST, and WebSocket APIs.
* **Traffic Management**: Manage traffic, including throttling and API version management, for concurrent API calls.
* **Security Controls**: Authorize API access using AWS Identity and Access Management (IAM), Amazon Cognito, OIDC, OAuth2, and custom Lambda authorizers.
* **Performance Optimization**: Reduce latency for API requests and responses by utilizing a global network of edge locations with Amazon CloudFront.
* **Developer Portals**: Create managed developer portals for APIs to facilitate central discovery, documentation, and governance across AWS infrastructure.
* **Cost Optimization**: Utilize a tiered pricing model that reduces costs as API usage scales, with no minimum fees or upfront commitments.

## Best Practices

* Leverage HTTP APIs for serverless workloads and HTTP backends when only API proxy functionality is needed, as they can be more cost-effective.
* Use REST APIs when both API proxy functionality and API management features are required in a single solution.
* Implement WebSocket APIs for applications requiring real-time, two-way communication, such as chat applications or streaming dashboards.
* Monitor API performance metrics and error rates through the API Gateway dashboard integrated with Amazon CloudWatch for operational insights.
