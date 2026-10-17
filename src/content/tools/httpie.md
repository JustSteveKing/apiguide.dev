---
name: "HTTPie"
description: "A command-line HTTP client built for developers, offering clean syntax, syntax highlighting, and auto-formatted JSON."
category: "clients-debugging"
lifecycleStages: ["development"]
url: "https://httpie.io"
pricing: "open-source"
updatedDate: 2026-10-14
---

## What is HTTPie?

HTTPie is a command-line HTTP client, released under the BSD-3-Clause license and installed as the `http` and `https` commands, designed to make ad hoc API calls quicker to type and easier to read than curl. Its request-item syntax builds a JSON body from `key=value` pairs by default, and responses are formatted and syntax-highlighted. HTTPie, Inc. also publishes a separate graphical client for desktop and web, which is not open source and is labeled a public beta; the CLI is the long-standing core of the project.

## Why use it in the API Lifecycle?

* **Terse request syntax**: `Header:Value` sets a header, `field=value` adds a JSON string field, `field:=123` adds a raw JSON value (number, boolean, array, object), `param==value` adds a query parameter, and `field@file` uploads a file with `--form` or `--multipart`.
* **JSON by default**: Data fields are serialized as a JSON object with the matching `Content-Type` and `Accept` headers; `--form` switches to form encoding.
* **Readable output**: Formatted, colorized responses, with `--print` (`-p`) selecting which parts to show: request headers `H`, request body `B`, response headers `h`, response body `b`.
* **Offline mode**: `--offline` builds and prints the request without sending it.
* **Sessions**: `--session` persists headers, auth and cookies across calls to the same host.

## Best Practices

* Use `--check-status` in scripts. By default HTTPie exits 0 whatever the status code; with the flag it exits 3, 4 or 5 for a 3xx (without `--follow`), 4xx or 5xx response, so a [`500 Internal Server Error`](/status-codes/500) fails the script.
* Use `:=` for anything that is not a string. `count=5` sends `"5"` and `count:=5` sends `5`; the difference is exactly the kind of type mismatch an API should reject with [`400 Bad Request`](/status-codes/400) or [`422 Unprocessable Content`](/status-codes/422), so it is worth testing both. See [Input Validation](/guides/input-validation).
* Use `--offline` to show a colleague or a bug report the exact request, headers and body, without hitting a production endpoint or needing credentials.
* Use `-p Hh` to see request and response headers without bodies when debugging caching, content negotiation or redirects, where the answer is usually in [`Cache-Control`](/headers/cache-control), [`Vary`](/headers/vary) or [`Location`](/headers/location).
* Remember that `--session` files are plain-text JSON containing whatever auth and cookies were used. Keep them out of repositories and shared directories, and prefer short-lived tokens. See [Token Lifecycle](/guides/token-lifecycle).
* Do not use `--verify=no` to get past a TLS error on anything but a disposable local environment. Point `--verify` at your internal CA bundle instead.
* For repeatable test suites rather than interactive calls, use a runner with assertions such as [Hurl](/tools/testing-mocking/hurl).
