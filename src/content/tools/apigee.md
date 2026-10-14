---
name: "Apigee (Google Cloud)"
description: "An enterprise-grade API gateway and management platform providing security, analytics, and developer portal tools."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://cloud.google.com/apigee"
pricing: "paid"
---

## What is Apigee (Google Cloud)?

Apigee is Google Cloud’s API management tool designed to build, manage, and secure APIs across various use cases, environments, and scales. It provides comprehensive capabilities to support diverse API architectural styles and offers flexible pricing options.

## Why use it in the API Lifecycle?

* **API Security with ML-based Abuse Detection**: Detects undocumented and unmanaged APIs linked to Google Cloud L7 Load Balancers, assesses managed APIs for security standards, and uses ML-powered dashboards to identify critical API abuses by finding patterns in bot alerts, reducing incident response time.
* **High-performance API Proxies**: Orchestrates and manages traffic for applications, supporting styles like REST, gRPC, SOAP, and GraphQL. It allows proxying internal microservices managed in a service mesh as REST APIs to enhance security.
* **Hybrid/Multicloud Deployments**: Enables architectural freedom to deploy APIs in any environment, including on-premises or public clouds, by configuring Apigee hybrid. It hosts and manages containerized runtime services in a Kubernetes cluster for agility and interoperability.
* **Traffic Management and Control Policies**: Programs API behavior on API proxies without writing code using over 50 configurable policies for security, rate limiting, transformation, and mediation. Custom scripts can extend API functionality.
* **Developer Portals Integrated into API Lifecycle**: Bundles APIs into API products and publishes them in integrated developer portals or customized Drupal experiences. It facilitates onboarding of partners/developers and secures access to APIs.
* **Built-in and Custom API Analytics Dashboards**: Provides dashboards to analyze API traffic for performance, spikes, and improvement opportunities. Custom dashboards can be built to evaluate API quality and developer engagement.

## Best Practices

* Consolidate API specifications into API hub to allow developers to access APIs and govern them to a consistent quality.
* Deploy API proxies to control traffic to backend services with granular controls like security, rate limiting, and quotas.
* Package legacy applications using API proxies as a gateway to create an abstraction layer that insulates client-facing applications from backend services.
* Implement multi-layered security with advanced controls by combining Apigee, Cloud Armor, and reCAPTCHA Enterprise for comprehensive protection against various threats.
