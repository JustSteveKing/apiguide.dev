---
name: "Server-Timing"
description: "Lets a server report named backend timings, such as database or cache time, which browsers expose in developer tools and to JavaScript."
category: "response"
standard: false
relatedCodes: [200]
---

## What is the Server-Timing header?

The `Server-Timing` response header, defined in the W3C [Server Timing](https://www.w3.org/TR/server-timing/) specification, lets a server describe where the time went while it produced a response. Each entry is a metric name with optional parameters:

```http
Server-Timing: db;dur=53, app;dur=47.2, cache;desc="Cache Read";dur=23.2
```

The specification defines two parameters, both optional:

| Parameter | Meaning |
| :--- | :--- |
| `dur` | A duration. Milliseconds are recommended but not enforced. |
| `desc` | A human-readable description, as a token or a quoted string. |

A metric with no parameters is allowed and acts as a flag, such as `miss` for a cache miss. Browsers show these metrics in the network panel of their developer tools and expose them to JavaScript through `PerformanceResourceTiming.serverTiming`, which is the main reason to send them.

Server Timing is a W3C Working Draft rather than a Recommendation, which is why this page marks it non-standard. The field is nonetheless registered as permanent in the IANA HTTP Field Name Registry and is implemented in browsers.

## API Usage & Best Practices

* **Name a few stable phases, not every function.** `db`, `cache`, `auth`, `upstream` and `total` answer most questions. Metric names are tokens, so keep them short, lowercase and constant: a dashboard keyed on `db` breaks when someone renames it `database`.
* **Always use milliseconds in `dur`.** The specification only recommends it, and a consumer has no way to discover that you chose another unit. Mixing units across services makes the numbers worse than useless.
* **Treat it as information disclosure.** Timings reveal your architecture, and fine-grained ones can leak whether a record exists or a cache was warm, which is the raw material of a timing attack. For a public API, send detailed metrics only to authenticated internal callers, or only behind a debug flag, and send nothing on authentication endpoints.
* **Know that browsers restrict it cross-origin.** The JavaScript interface follows the same-origin policy by default. A cross-origin page only sees the metrics if your response carries a `Timing-Allow-Origin` header naming it, and user agents may still withhold them.
* **Report total time as a trailer if you stream.** The specification shows a `total` metric delivered via `Trailer: Server-Timing`, because the total is only known once the body is complete. Do not rely on it arriving, though: HTTP lets recipients discard trailer fields.
* **Let each hop add its own entry.** The header is a list, and the specification's use cases include proxies and CDNs reporting their own metrics on the same response. Duplicate names are allowed and all entries are exposed, so prefix intermediary metrics (`edge-cache`, `lb`) to keep them distinguishable.
* **Do not use it as your observability pipeline.** It is for the caller's benefit: a developer in DevTools, or real-user monitoring in a browser. Server-side latency belongs in your metrics and traces, linked by [`traceparent`](/headers/traceparent). See [observability and tracing](/guides/observability-tracing).

## Examples

A response breaking down server time, with a cache miss flag:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Server-Timing: miss, db;dur=53, app;dur=47.2
Server-Timing: auth;desc="Token introspection";dur=8.1
```

A streamed response announcing the total as a trailer:

```http
HTTP/1.1 200 OK
Content-Type: application/x-ndjson
Transfer-Encoding: chunked
Trailer: Server-Timing
Server-Timing: db;dur=12

...streamed body...

Server-Timing: total;dur=123.4
```
