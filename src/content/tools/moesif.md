---
name: "Moesif"
description: "A user-centric API analytics and monetization platform designed for debugging, monitoring, and billing."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://www.moesif.com"
pricing: "freemium"
---

## What is Moesif?

Moesif is an API analytics and monetization platform. Server SDKs and middleware (Node.js, Python, Java, .NET, Go and others) or gateway plugins (Kong, AWS API Gateway, NGINX and others) send a copy of each API call to Moesif, attributed to a user and a company. On that data it builds per-customer usage analytics, logs, alerts, quota and governance rules, and usage-based billing meters that sync to billing providers such as Stripe, Chargebee, Zuora and Recurly. Moesif was acquired by WSO2 in 2025 and runs as an independent subsidiary under its own brand. There is a free plan.

## Why use it in the API Lifecycle?

* **Usage by customer, not just by endpoint**: Because every call is attributed with `identifyUser` and `identifyCompany`, you can answer which customers use an endpoint, who is hitting errors, and who stopped calling after a release.
* **Debugging a customer's calls**: Captured request and response headers and bodies let support see exactly what a customer sent and what the API returned.
* **Usage-based billing**: Billing meters count API calls or other metrics (including LLM token counts) per customer and report them to the billing provider.
* **Quotas and governance**: Rules can block calls from customers who exceed a quota or have an unpaid invoice, with a configured status code and body, enforced by supported SDKs and gateway plugins.
* **Behavioral alerts and emails**: Alerts and automated emails can trigger on usage patterns, such as a customer's error rate rising or a quota nearing its limit.

## Best Practices

* Identify the user and company on every event. Anonymous traffic can only be analyzed by endpoint, and per-customer analytics and billing depend on the IDs being present and stable.
* Mask before data leaves your process. Use the SDK's `maskContent` hook (or the equivalent in your SDK) to drop [`Authorization`](/headers/authorization) and [`Cookie`](/headers/cookie) headers, tokens and personal data, set `logBody` to `false` on endpoints whose payloads you have no reason to store, and consider Moesif's Secure Proxy for client-side encryption with your own keys. See [Logging and PII](/guides/logging-pii).
* Use `skip` to exclude health checks and internal probes. They inflate usage, distort latency percentiles and, if metered, end up on an invoice.
* Make blocking rules return a correct, documented response: [`429 Too Many Requests`](/status-codes/429) with [`Retry-After`](/headers/retry-after) for a rate or quota limit, [`402 Payment Required`](/status-codes/402) or [`403 Forbidden`](/status-codes/403) for a billing hold, with a problem details body. Clients cannot handle a block they cannot tell apart from an outage. [Quotas and Metering](/guides/quotas-metering) covers the design.
* Meter on what the customer can verify. Bill on successful calls or on a field the API returns, not on retries or on calls that failed with a 5xx, or you will be charging customers for your own outages.
* Check that your SDK or gateway plugin supports governance rules before you rely on them, and allow for propagation delay after a rule changes: a rule that is not enforced yet is a quota that is not enforced.
