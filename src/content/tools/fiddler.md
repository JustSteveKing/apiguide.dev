---
name: "Fiddler (Progress)"
description: "A classic debugging proxy for routing, decrypting, and rewriting HTTP traffic."
category: "clients-debugging"
lifecycleStages: ["testing", "development"]
url: "https://www.telerik.com/fiddler"
pricing: "paid"
updatedDate: 2026-10-14
---

## What is Fiddler (Progress)?

Fiddler is a family of HTTP(S) debugging proxies from Progress Telerik. The current product is Fiddler Everywhere, a cross-platform desktop app for Windows, macOS and Linux that captures traffic as a system proxy or from a browser, terminal, remote device or reverse proxy, decrypts HTTPS, and lets you inspect, modify, mock and replay requests. Fiddler Everywhere is a paid subscription with a trial. Fiddler Classic, the original Windows tool, is free only for eligible non-commercial use under its current EULA. Fiddler Everywhere Reporter is a free capture-only app for collecting traffic from end users, and FiddlerCore is a commercial .NET library for embedding capture in an application.

## Why use it in the API Lifecycle?

* **See what was actually sent**: Captures every request and response from an app, SDK or CLI, with headers, bodies and timings, including decrypted HTTPS once the Fiddler root certificate is trusted on the client.
* **Rules**: Modify headers, redirect requests, change response content, set breakpoints, and mock responses without changing the client or the server.
* **Composer**: Build, edit and resend requests, including one copied out of a captured session.
* **Protocol coverage**: HTTP/2, WebSockets, Server-Sent Events and gRPC, with decoding for formats such as Protobuf and MessagePack.
* **Remote and mobile capture**: Route a phone or another machine through the proxy to debug clients you cannot instrument directly.
* **Shareable snapshots**: Save and share traffic snapshots so a teammate can see the same session.

## Best Practices

* Reproduce a client bug from the wire, not from the client's logs. Compare what the SDK sent with what the API documents: a missing [`Content-Type`](/headers/content-type), a doubled [`Authorization`](/headers/authorization) header or a body sent as form encoding instead of JSON is visible in seconds in a capture and invisible in application logs.
* Use rules to test client error handling without touching the server. Return a [`429 Too Many Requests`](/status-codes/429) with a [`Retry-After`](/headers/retry-after) header, a [`503 Service Unavailable`](/status-codes/503), or a delayed response, and confirm the client backs off as described in [Retries and Backoff](/guides/retries-backoff) rather than retrying in a tight loop.
* Check caching and conditional request behavior in the capture: does the client send [`If-None-Match`](/headers/if-none-match) with the stored [`ETag`](/headers/etag), and does the server answer [`304 Not Modified`](/status-codes/304)? See [Conditional Requests](/guides/conditional-requests).
* Trust the Fiddler root certificate only on development machines and test devices, and remove it when you are done. A trusted interception root on a daily-use machine lets anything holding that key read its TLS traffic. Clients that pin certificates will refuse the proxy by design; that is a client setting to change in a debug build, not something to defeat in production.
* Treat captures as sensitive. They contain bearer tokens, cookies and personal data in clear text. Redact them before attaching a snapshot to a ticket, and do not keep them longer than the investigation needs (see [Logging and PII](/guides/logging-pii)).
* Use Fiddler Classic only if your use is eligible non-commercial use under its license; for commercial work, budget for Fiddler Everywhere or use an open-source alternative such as [mitmproxy](/tools/clients-debugging/mitmproxy).
