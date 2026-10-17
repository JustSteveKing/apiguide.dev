---
name: "ZAP (Zed Attack Proxy)"
description: "A free, Apache-2.0 dynamic application security scanner, formerly OWASP ZAP and now published as ZAP by Checkmarx, with a packaged scan for OpenAPI, SOAP and GraphQL APIs."
category: "security-testing"
lifecycleStages: ["testing", "deployment"]
url: "https://www.zaproxy.org"
pricing: "open-source"
updatedDate: 2026-10-17
---

## What is ZAP?

ZAP (Zed Attack Proxy) is an open-source dynamic application security testing (DAST) tool, licensed Apache-2.0 and developed in the `zaproxy/zaproxy` repository. It started life as an OWASP project under the name OWASP ZAP. It is now published as ZAP by Checkmarx, and describes itself as an independent open-source project maintained by the ZAP Dev Team.

It works as an intercepting proxy for manual testing and as an automated scanner. For APIs, the part that matters is the packaged API scan, `zap-api-scan.py`, shipped in the ZAP Docker images. It imports an [OpenAPI](/specifications/openapi) definition, a SOAP WSDL or a [GraphQL](/specifications/graphql) endpoint, from a file or a URL, and runs an active scan against the URLs it finds:

```sh
zap-api-scan.py -t https://staging.example.com/openapi.json -f openapi -c zap-rules.conf
```

The scan exits `0` when clean, `1` when any rule set to `FAIL` fires, and `2` when there are only warnings, which is what makes it usable as a pipeline gate.

## Why use it in the API Lifecycle?

* **No license and no account.** It runs anywhere Docker runs, against any environment you own, with nothing to buy.
* **Driven by the contract.** Because the API scan reads the definition, it reaches operations a crawler would never find. A web scanner that only follows links sees almost nothing of a JSON API.
* **Active testing, not just linting.** It sends attack payloads to the running service and reports what the responses reveal.
* **Configurable gating.** A rules file sets each check to `IGNORE`, `INFO`, `WARN` or `FAIL`, so a team can start permissive and tighten over time without changing the scan itself.

## Best Practices

* **Scan a staging environment, never production.** An active scan sends genuinely malicious input and can create, change and delete data through your API. Point it at an environment you can reset, and never at an API you do not own.
* **Generate the rules file once and commit it.** Run with `-g` to produce a config with every rule at `WARN`, then promote the rules you care about to `FAIL`. A pipeline where everything is a warning is a pipeline nobody reads.
* **Authenticate the scan.** Most of an API sits behind credentials. A scan that only ever gets [`401 Unauthorized`](/status-codes/401) back has tested your authentication middleware and nothing else.
* **Do not expect it to find authorization flaws.** A scanner does not know that user A must not read user B's order, so broken object level authorization, the top item in the OWASP API Security Top 10, needs tests that encode ownership. See [API Security](/guides/api-security).
* **Keep the definition accurate.** The scan can only reach the operations the document describes. An undocumented endpoint is an unscanned one; see [Design-First Governance](/guides/design-first-governance).
