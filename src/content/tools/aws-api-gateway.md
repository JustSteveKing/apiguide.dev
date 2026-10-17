---
name: "AWS API Gateway"
description: "A fully managed service enabling developers to publish, maintain, and secure APIs at any scale in AWS."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://aws.amazon.com/api-gateway"
pricing: "paid"
updatedDate: 2026-10-14
---

## What is AWS API Gateway?

Amazon API Gateway is AWS's managed service for putting an HTTP front door on backends such as Lambda functions, other AWS services, load balancers and public HTTP endpoints. It offers three API types with different feature sets: **REST APIs** (the fuller product, with API keys, usage plans, request validation, caching, AWS WAF, private endpoints and custom gateway responses), **HTTP APIs** (a cheaper, smaller product with native JWT authorizers and automatic deployments but none of the features just listed), and **WebSocket APIs** for persistent two-way connections. Pricing is pay-per-request with no minimum fee.

## Why use it in the API Lifecycle?

* **Managed edge for AWS backends**: Routes requests to Lambda, AWS services, VPC resources through VPC links, or any HTTP endpoint without running gateway servers.
* **Authorization**: IAM (SigV4), Amazon Cognito, Lambda authorizers, and on HTTP APIs, JWT authorizers that validate OIDC and OAuth 2.0 tokens without custom code.
* **Throttling**: Token-bucket throttling at the account, stage, method and (REST APIs only) per-client level, returning [`429 Too Many Requests`](/status-codes/429) when exceeded.
* **Request validation and transformation**: REST APIs can reject requests that fail a JSON Schema model before they reach the backend, and map parameters and bodies between client and integration formats.
* **Gateway responses**: REST APIs let you rewrite the status, headers and body of errors API Gateway generates itself, such as `THROTTLED`, `ACCESS_DENIED` or `INTEGRATION_TIMEOUT`.
* **Monitoring**: CloudWatch metrics and access logs for all API types; execution logs and X-Ray tracing for REST APIs.

## Best Practices

* Choose the API type from the feature list, not the name. Both REST APIs and HTTP APIs are RESTful; pick REST APIs only if you need API keys, per-client throttling, request validation, caching, WAF or private endpoints, because they cost more per request.
* Do not use API keys as authentication. AWS's own guidance is that a key valid for one API in a usage plan grants access to every API in that plan, and keys travel in headers that get logged. Use them to identify clients for usage plans, and authenticate with IAM, a Lambda authorizer or Cognito. See [OAuth vs API Keys](/guides/oauth-api-keys).
* Treat usage plan throttles and quotas as targets, not ceilings. AWS documents them as best-effort and warns against relying on them to cap costs or block access; enforce hard limits in your own service and watch spend with AWS Budgets. See [Quotas and Metering](/guides/quotas-metering).
* Customize gateway responses on REST APIs so gateway-generated errors match the format your backend returns, ideally [Problem Details](/specifications/problem-details). Add a [`Retry-After`](/headers/retry-after) header to the `THROTTLED` and `QUOTA_EXCEEDED` responses so clients back off correctly.
* Know that a request to a route that does not exist returns `403` with `Missing Authentication Token` by default, not [`404 Not Found`](/status-codes/404). Override the `MISSING_AUTHENTICATION_TOKEN` gateway response if that confuses your clients, and expect it when debugging a typo in a path or stage name.
* Configure [CORS](/guides/cors) in API Gateway or in the backend, not both. Duplicate [`Access-Control-Allow-Origin`](/headers/access-control-allow-origin) headers cause browsers to reject the response.
* Define the API in OpenAPI with the `x-amazon-apigateway-*` extensions, or in infrastructure as code, and deploy it from CI. Console edits on a REST API do nothing until a deployment is created, and they leave no review trail.
* Turn on access logging with `$context.requestId` and the integration latency fields, and forward the request ID to the backend so a client-reported error can be traced end to end. See [Observability and Tracing](/guides/observability-tracing).
