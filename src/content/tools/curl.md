---
name: "curl"
description: "The ubiquitous command-line tool and library for transferring data with URLs using HTTP, HTTPS, and dozens of protocols."
category: "clients-debugging"
lifecycleStages: ["development", "testing"]
url: "https://curl.se"
pricing: "open-source"
updatedDate: 2026-10-14
---

## What is curl?

curl is an open-source command-line tool for transferring data with URLs, and libcurl is the library behind it, embedded in a very wide range of operating systems, devices and applications. It is released under an MIT-style license. For API work it is the lowest common denominator: every API documentation site shows curl examples, every platform has it, and a curl command is the most portable way to hand someone a reproducible request. It speaks HTTP/0.9 through HTTP/3 and over two dozen other protocols, and supports authentication schemes from Basic and Digest to Bearer tokens and AWS SigV4.

## Why use it in the API Lifecycle?

* **Reproducible requests**: A single command captures method, URL, headers and body, which makes it the standard format for bug reports and documentation examples.
* **Full HTTP control**: Custom methods (`-X`), arbitrary headers (`-H`), HTTP version selection (`--http1.1`, `--http2`, `--http3`), redirect following (`-L`) and ranges (`-r`).
* **JSON shortcut**: `--json` (since 7.82.0) posts a body with `Content-Type: application/json` and `Accept: application/json` set for you.
* **Wire-level visibility**: `-v`, `--trace-ascii` and `-D` show exactly what was sent and received, including TLS negotiation and response headers.
* **Scriptable checks**: `-w '%{response_code}'` and other write-out variables expose status, timings and sizes for shell scripts and health checks.
* **Connection control**: `--resolve` and `--connect-to` send a request to a specific IP or host while keeping the original `Host` and TLS name, which is how you test a server behind a load balancer or CDN.

## Best Practices

* Use `--fail-with-body` (since 7.76.0) in scripts and CI. Without it curl exits 0 on a [`500 Internal Server Error`](/status-codes/500); with plain `--fail` it exits 22 but discards the body, which is usually the [Problem Details](/specifications/problem-details) document that explains the failure.
* Debug with `-v` or `--trace-ascii -`, not just the body. Most API bugs are in headers: a missing [`Content-Type`](/headers/content-type), a [`Vary`](/headers/vary) that defeats caching, or a redirect that drops [`Authorization`](/headers/authorization).
* Use `--retry` for transient failures in scripts. It retries timeouts and [`408`](/status-codes/408), [`429`](/status-codes/429), [`500`](/status-codes/500), [`502`](/status-codes/502), [`503`](/status-codes/503) and [`504`](/status-codes/504), and honors [`Retry-After`](/headers/retry-after). Avoid `--retry-all-errors` on non-idempotent requests; curl's own documentation warns it can duplicate data. See [Retries and Backoff](/guides/retries-backoff).
* Keep tokens out of shell history and process lists. Read headers from a file with `-H @headers.txt`, or use `--variable` and `--expand-header` (since 8.3.0) to pull a value from an environment variable, instead of typing `-H "Authorization: Bearer ..."` inline.
* Test conditional requests with `--etag-save` and `--etag-compare` to confirm the server returns [`304 Not Modified`](/status-codes/304) for an unchanged [`ETag`](/headers/etag). See [Conditional Requests](/guides/conditional-requests).
* Add `--compressed` when checking response size or caching. Without it curl does not send [`Accept-Encoding`](/headers/accept-encoding), so you see the uncompressed path that real clients rarely take.
* Time requests with `-w` variables such as `%{time_connect}`, `%{time_starttransfer}` and `%{time_total}` to separate network and TLS cost from server processing time.
* For repeatable suites rather than one-off checks, move to [Hurl](/tools/testing-mocking/hurl), which runs on libcurl and adds captures and assertions in a plain-text file.
