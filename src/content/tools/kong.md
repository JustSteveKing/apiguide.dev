---
name: "Kong Gateway"
description: "A cloud-native, high-performance API gateway built on Nginx, serving as a centralized proxy for routing and security."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://konghq.com"
pricing: "freemium"
---

## What is Kong Gateway?

Kong is a popular, open-source cloud-native API gateway. Built on top of Nginx and Lua, it acts as a reverse proxy, coordinating request routing, security, load balancing, and rate limiting before traffic reaches backend services.

## Why use it in the API Lifecycle?

* **Centralize Policies**: Instead of writing rate-limiting, CORS, or JWT validation logic inside individual microservices, handle them at the gateway layer.
* **Extensible Plugins**: Offers a library of plugins for OAuth2, key auth, IP restrictions, request logging, and rate limiting.
* **High Performance**: Extremely low latency overhead, capable of scaling to millions of concurrent requests.

## Best Practices

* Use declarative configuration files (Kong decK) to version your gateway routing configurations alongside your source code.
