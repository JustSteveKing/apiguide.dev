---
name: "Pact"
description: "A consumer-driven contract testing framework that lets services verify their integrations without spinning up full end-to-end environments."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://pact.io"
pricing: "freemium"
---

## What is Pact?

Pact is a contract testing framework built around the consumer-driven contract (CDC) model. Instead of running a real provider service against a real consumer in an end-to-end environment, each consumer records the requests it makes and the responses it expects as a "contract" (a pact file). That contract is then replayed against the actual provider in isolation, verifying the provider still honors what its consumers depend on — without either side needing the other running live. This is a different approach from tools that diff observed traffic against an existing API description; Pact's contracts are generated from the consumer's own test expectations first, and the provider is verified against those expectations second.

## Why use it in the API Lifecycle?

* **Consumer-Driven Verification**: Contracts originate from what consumers actually use, not from a shared spec both sides hope stays accurate — catching cases where a provider changes behavior a consumer silently depended on.
* **No Shared Test Environments**: Provider and consumer tests run independently against the pact file, removing the need for flaky, slow end-to-end environments to catch integration-breaking changes.
* **Can I Deploy? Safety Checks**: The Pact Broker (or Pactflow, its hosted counterpart) tracks which contract versions have been verified against which service versions, letting CI gate deployments on whether a change is safe to ship given everyone else's current contracts.

## Best Practices

* Publish pact files and verification results to a shared broker as part of CI, so both consumer and provider teams can see contract compatibility before merging, not after a deployment breaks.
