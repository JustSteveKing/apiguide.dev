---
name: "Apigee (Google Cloud)"
description: "An enterprise-grade API gateway and management platform providing security, analytics, and developer portal tools."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://cloud.google.com/apigee"
pricing: "paid"
updatedDate: 2026-10-14
---

## What is Apigee (Google Cloud)?

Apigee is Google Cloud's API management platform. Traffic passes through API proxies that run on Apigee's runtime, and each proxy is configured as a pipeline of policies (XML-configured steps for authentication, traffic limits, caching, transformation and error handling) attached to request and response flows. APIs are bundled into API products that developers subscribe to through apps, which is what keys, OAuth clients and quotas hang off. Apigee runs as a Google-managed service or as Apigee hybrid, with the runtime in your own Kubernetes cluster and the management plane in Google Cloud.

## Why use it in the API Lifecycle?

* **Policy-based proxies**: Policies such as VerifyAPIKey, OAuthV2, VerifyJWT, SpikeArrest, Quota, ResponseCache, AssignMessage and RaiseFault cover the common gateway concerns without custom code; JavaScript and Java callouts handle the rest.
* **Products, apps and keys**: API products group operations with their quota and scopes; developer apps receive credentials for one or more products, so access and limits are managed per consumer.
* **Threat protection and validation**: JSONThreatProtection rejects oversized or deeply nested payloads, and OASValidation checks requests against an OpenAPI definition before they reach the backend.
* **Developer portals**: Publish API products to an integrated portal or a Drupal-based one for self-service onboarding.
* **Analytics**: Built-in and custom reports on traffic, latency and error rates per proxy, product and app.
* **Hybrid deployment**: Run the runtime close to the backends on your own infrastructure while Google manages the control plane.

## Best Practices

* Use SpikeArrest and Quota for different jobs. SpikeArrest is operational protection: it smooths the configured rate into short intervals (10ps admits roughly one request every 100 ms unless `UseEffectiveCount` is enabled) and answers [`429 Too Many Requests`](/status-codes/429). Quota enforces the business limit per app or product over an hour, day, week or month. Putting a contractual monthly limit in SpikeArrest, or burst protection in Quota, gets both wrong. See [Rate Limiting](/guides/rate-limiting) and [Quotas and Metering](/guides/quotas-metering).
* Check the status code your limits actually return. The Quota policy's runtime error table lists `500` for a quota violation, while a note on the same page says exceeded thresholds return `429`; test what your organization actually returns, because a client cannot tell a `500` from a server fault and will not back off. Add a FaultRule that returns `429` with a [`Retry-After`](/headers/retry-after) header and a [problem details](/specifications/problem-details) body.
* Set `Distributed` to `true` on Quota when more than one runtime node serves the proxy, otherwise each node counts separately and the effective limit multiplies. Leave `Synchronous` off unless overshoot is unacceptable, because synchronous counter updates cost latency on every call.
* Run VerifyAPIKey or OAuthV2 before Quota in the request flow. The Quota policy needs to know which app and product the call belongs to, and an unauthenticated request should fail with [`401 Unauthorized`](/status-codes/401) before it consumes anyone's quota.
* Put JSONThreatProtection early in the flow and size its limits from your real payloads, so a hostile document is rejected at the edge rather than parsed by every backend, and map its fault to [`400 Bad Request`](/status-codes/400) or [`413 Content Too Large`](/status-codes/413) in a FaultRule if the default status is not what clients should see. Pair it with OASValidation where an OpenAPI definition exists.
* Normalize backend errors in one place. Use FaultRules to map backend failures to consistent responses, so a backend timeout becomes [`504 Gateway Timeout`](/status-codes/504) and an unreachable target [`502 Bad Gateway`](/status-codes/502), and strip stack traces and internal hostnames from bodies on the way out.
* Keep proxy bundles and shared flows in source control and deploy them through a pipeline with the Apigee API or Maven plugin, rather than editing proxies in the console, so every policy change is reviewed and revertible.
