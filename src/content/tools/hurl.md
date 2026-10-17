---
name: "Hurl"
description: "A command-line tool from Orange that runs and tests HTTP requests written in a plain-text format, with captures, assertions and CI reports."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://hurl.dev"
pricing: "open-source"
updatedDate: 2026-10-14
---

## What is Hurl?

Hurl is an open-source command-line tool, maintained by Orange under the Apache 2.0 license, that runs HTTP requests defined in a plain-text `.hurl` file. Each entry is a request written much as it appears on the wire, optionally followed by the expected response: a status line such as `HTTP 201`, headers to match, a `[Captures]` section that pulls values into variables, and an `[Asserts]` section of queries and predicates. It is built on libcurl, ships as a single binary, and doubles as an HTTP client for exploring an API and a test runner for checking it.

## Why use it in the API Lifecycle?

* **Readable, diffable tests**: A `.hurl` file is plain text that looks like HTTP, so tests review cleanly in a pull request and need no language runtime or framework to run.
* **Request chaining**: `[Captures]` extracts values with `jsonpath`, `xpath`, `header` and other queries, so a test can create a resource, capture its ID and fetch it in the next entry.
* **Rich assertions**: Implicit asserts on status and headers, plus explicit predicates such as `==`, `exists`, `matches`, `isInteger` and the `count` filter for collection sizes.
* **Test mode**: `hurl --test` hides response bodies, reports per file and prints a summary. Files run in parallel by default in test mode.
* **CI reports**: `--report-junit`, `--report-html`, `--report-tap` and `--json` produce output a pipeline can display.
* **curl semantics**: Because it runs on libcurl, behavior around TLS, proxies, HTTP/2 and options such as `--connect-to` matches what engineers already know from [curl](/tools/clients-debugging/curl).

## Best Practices

* Keep `.hurl` files in the API's repository, one file per user journey (sign up, create order, cancel order), and run `hurl --test --glob "tests/**/*.hurl"` on every pull request. How this fits with contract and load testing is covered in [API Testing](/guides/api-testing).
* Never hard-code hosts or tokens. Use `{{host}}` and `{{token}}` templates and inject them with `--variable`, `--variables-file` or `HURL_VARIABLE_name` environment variables, and pass credentials with `--secret` so they are redacted from logs and reports.
* Assert on the contract, not on incidental detail: check the status, the [`Content-Type`](/headers/content-type), and the specific fields a client relies on with `jsonpath`, rather than comparing whole bodies that change with every timestamp.
* Make every file independent. Parallel execution is the default under `--test`, so a file that depends on state created by another file will fail intermittently. Use `--jobs 1` only while you fix such a dependency.
* Assert the failure paths too: a missing field should return [`400 Bad Request`](/status-codes/400) or [`422 Unprocessable Content`](/status-codes/422), and an expired token [`401 Unauthorized`](/status-codes/401).
* Use `--retry` for endpoints that are eventually consistent, such as polling a job resource until it completes, instead of inserting fixed sleeps.
