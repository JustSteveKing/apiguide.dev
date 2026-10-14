---
name: "Azure API Management"
description: "Microsoft's managed API gateway, management plane and developer portal, with a self-hosted gateway for running the data plane outside Azure."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://azure.microsoft.com/en-us/products/api-management"
pricing: "paid"
---

## What is Azure API Management?

Azure API Management (APIM) is Microsoft's platform-as-a-service for publishing, securing and observing APIs. It has three parts: an API gateway (the data plane) that every request passes through, a management plane for configuring APIs and policies through the Azure portal, CLI, REST API or infrastructure-as-code, and a developer portal where consumers read documentation, try operations and obtain subscription keys. All three are Azure-hosted by default. The self-hosted gateway, a Linux container usually run on Kubernetes, puts the data plane next to backends on-premises or in another cloud while configuration stays in Azure. Service tiers fall into three groups: the classic tiers (Developer, Basic, Standard, Premium), the v2 tiers (Basic v2, Standard v2, Premium v2) and Consumption, a serverless tier billed per execution.

## Why use it in the API Lifecycle?

* **Policies**: Request and response behavior is configured as an XML policy pipeline applied at global, workspace, product, API or operation scope, covering authentication, rate limits, quotas, caching, transformation and routing.
* **Products and subscriptions**: APIs are grouped into products; protected products require a subscription key, and approval can be automatic or manual.
* **Developer portal**: An automatically generated, customizable portal with interactive documentation and self-service key management.
* **Workspaces**: Decentralized teams manage their own APIs and products inside one instance while a platform team keeps central policy and monitoring.
* **Hybrid deployment**: The self-hosted gateway runs the same policies close to backends outside Azure.
* **Azure integration**: Application Insights and Azure Monitor for telemetry, Key Vault for secrets and certificates, Microsoft Entra ID for authorization, and AI gateway capabilities for governing model endpoints.

## Best Practices

* Keep policy definitions in source control and deploy them with Bicep, Terraform or ARM templates rather than editing in the portal. Policy XML edited by hand in production is the usual source of drift between environments.
* Use `rate-limit-by-key` with a `counter-key` derived from the authenticated subscription or client ID, not the caller IP, for anything behind a proxy or NAT. The `remaining-calls-header-name` and `total-calls-header-name` attributes only emit bare integers under whatever names you choose; to give clients the standardized [`RateLimit`](/headers/ratelimit) field, capture the values with `remaining-calls-variable-name` and build the header with a `set-header` policy expression.
* Treat the rate limit as approximate. Microsoft documents that throttling is never completely accurate, and counters are tracked per gateway: regional gateways in a multi-region deployment and self-hosted gateways do not share counts with the managed gateway. Size limits with that in mind.
* Know that `quota-by-key` rejects with [`403 Forbidden`](/status-codes/403) plus [`Retry-After`](/headers/retry-after), while `rate-limit-by-key` uses [`429 Too Many Requests`](/status-codes/429). A 403 reads as an authorization failure to most clients; if you use quotas, rewrite the rejection in an `on-error` section into a problem response such as [`quota-exceeded`](/errors/quota-exceeded) so the cause is unambiguous.
* Do not rely on subscription keys alone for authentication. They identify a consumer for metering; validate a token as well (for example with the `validate-jwt` policy) for anything that needs real access control.
* Connect Application Insights and log the request ID end to end, and make sure backends propagate [`traceparent`](/headers/traceparent) so gateway and service telemetry correlate. See [OpenTelemetry](/specifications/opentelemetry) for the instrumentation side.
