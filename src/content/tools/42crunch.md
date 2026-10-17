---
name: "42Crunch"
description: "A commercial API security platform built on the OpenAPI contract: static audit of the definition, dynamic scanning of the running API against it, and a contract-derived runtime firewall."
category: "security-testing"
lifecycleStages: ["design", "testing", "deployment"]
url: "https://42crunch.com"
pricing: "paid"
updatedDate: 2026-10-17
---

## What is 42Crunch?

42Crunch is an API security platform whose products all start from the [OpenAPI](/specifications/openapi) definition:

* **API Audit** is static. It tests the contract itself, before any implementation exists, and reports security weaknesses in it, such as missing security requirements and schemas loose enough to let unexpected input through.
* **API Scan** is dynamic. It sends simulated traffic to the running API and checks whether the implementation behaves the way the contract says it should.
* **API Runtime Protection** is a positive-security firewall assembled from the contract: an allowlist that blocks anything the definition does not declare.

It integrates with IDEs and CI/CD pipelines. Its OpenAPI editor extension for VS Code is open source (AGPL-3.0) and needs no registration for editing. Running Audit and Scan from the extension as a non-customer requires a free trial token, and the free version of Scan runs locally, so the API does not have to be uploaded to the platform. Platform pricing is quoted per organization.

## Why use it in the API Lifecycle?

* **Security findings at design time.** Audit runs on the document, so a schema that accepts any string of any length is caught in review rather than in a penetration test.
* **Contract conformance as a security property.** Scan reports where the implementation accepts or returns things the contract does not allow, which is where injection and data exposure bugs tend to live.
* **One artifact for every stage.** The same definition drives the audit, the scan and the runtime allowlist, so tightening the contract tightens all three.

## Best Practices

* **Constrain every schema.** Audit rewards what [Input Validation](/guides/input-validation) recommends anyway: `maxLength` and `pattern` on strings, `minimum` and `maximum` on numbers, enumerations where values are fixed, and `additionalProperties: false` on request objects.
* **Run Audit on every pull request that touches the definition.** Fail the build on new critical issues rather than on a fixed score target nobody can meet on day one.
* **Scan a non-production environment.** Dynamic scanning sends malformed and hostile requests by design. Give it an environment and credentials you can afford to have misused.
* **Do not deploy the runtime firewall from an inaccurate contract.** A positive-security model blocks everything undeclared, which is the point, so an undocumented field or endpoint becomes an outage. Get the definition right first.
* **Pair it with a style linter.** 42Crunch checks security properties of the contract; [Spectral](/tools/design-documentation/spectral-stoplight) or [vacuum](/tools/design-documentation/vacuum) check your house design rules.
