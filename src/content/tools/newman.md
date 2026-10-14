---
name: "Newman"
description: "A command-line collection runner for Postman, allowing tests to be integrated directly into CI/CD pipelines."
category: "testing-mocking"
lifecycleStages: ["testing"]
url: "https://github.com/postmanlabs/newman"
pricing: "open-source"
---

## What is Newman?

Newman is Postman's open-source (Apache 2.0) command-line runner for [Postman](/tools/testing-mocking/postman) collections. It is a Node.js package that runs a collection file, executes its pre-request and test scripts, and exits non-zero when an assertion fails, which is what makes it usable as a CI step. It can also be required as a library and driven from JavaScript. Postman also ships a separate tool, the Postman CLI, which the Newman README now promotes at the top; Newman itself is still maintained and runs entirely from exported files without a Postman account.

## Why use it in the API Lifecycle?

* **Collections as CI tests**: `newman run collection.json` turns the requests and `pm.test` assertions a team already wrote in Postman into a pipeline gate.
* **Environments and variables**: `-e` loads an environment file, `-g` a globals file, and `--env-var "key=value"` overrides individual values, so one collection runs against local, staging and production.
* **Data-driven runs**: `-d` with a CSV or JSON file runs the collection once per row, and `-n` sets the iteration count.
* **Reporters**: Built-in `cli`, `json`, `junit` and `progress` reporters, with HTML and others available as separate reporter packages such as `newman-reporter-html`.
* **Run control**: `--folder` runs a subset, `--bail` stops on the first failure, and `--timeout`, `--timeout-request` and `--timeout-script` cap how long a run can take.
* **TLS and proxies**: Client certificates, custom CA bundles and proxy settings for testing APIs behind mTLS or corporate proxies.

## Best Practices

* Export the collection and environment into the repository and run them from there, rather than fetching them from the Postman API at build time. A test suite that can change without a commit cannot be reviewed or bisected.
* Never commit secrets in environment files. Keep placeholders in the file and inject real values with `--env-var "token=$API_TOKEN"` from the CI secret store.
* Always set `--timeout-request`. Without it a hung upstream can stall the pipeline until the CI job's own timeout, and the failure tells you nothing about which request hung.
* Use `-r cli,junit --reporter-junit-export results.xml` so the CI system shows failures per request instead of one red job.
* Assert on the contract, not just the status: check [`Content-Type`](/headers/content-type), required fields and, for errors, the [Problem Details](/specifications/problem-details) shape. A test that only checks for `200` passes when the body is an HTML error page served with the wrong status.
* Make collections order-independent where you can, and use `--folder` to separate read-only smoke checks, safe to run against production, from tests that create or delete data. More on where collection runs fit alongside contract and property-based testing is in [Testing APIs](/guides/api-testing).
