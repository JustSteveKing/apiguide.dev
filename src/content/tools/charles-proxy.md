---
name: "Charles Proxy"
description: "An HTTP proxy and monitor that enables developers to view and inspect all HTTP traffic between their machine and the internet."
category: "clients-debugging"
lifecycleStages: ["development", "testing"]
url: "https://www.charlesproxy.com"
pricing: "paid"
---

## What is Charles Proxy?

Charles is a desktop HTTP proxy, HTTP monitor and reverse proxy from XK72 for macOS, Windows and Linux. Pointing a browser, a mobile device or an application at it shows every request and response passing through, including headers, cookies and caching information. HTTPS is decrypted by acting as a man in the middle: Charles issues per-host certificates signed by its own root certificate, which the client has to trust, and only for hosts you enable in its SSL Proxying settings. It is commercial software sold as a per-user license, with a 30-day free trial.

## Why use it in the API Lifecycle?

* **See what the client actually sends**: Inspect the real request a mobile app or SDK produces, rather than what the code appears to send.
* **Selective HTTPS decryption**: SSL Proxying is enabled per host (or `*` for all), so unrelated traffic stays encrypted.
* **Breakpoints**: Pause a matching request or response, edit it, then execute or abort it.
* **Map Local, Map Remote and Rewrite**: Serve a response from a local file, redirect a host to another environment, or rewrite headers and bodies with rules.
* **Throttling**: Simulate limited bandwidth and added latency.
* **Repeat and Repeat Advanced**: Resend a captured request, or send it many times with set concurrency.

## Best Practices

* Enable SSL Proxying only for the API hosts you are debugging, not `*`. Decrypting everything breaks applications that pin certificates and puts unrelated credentials into your session file.
* Remove or untrust the Charles root certificate when you are done, especially on test phones. A trusted interception root left on a device is a standing man-in-the-middle risk. Expect apps that use certificate pinning to fail under Charles; that is the pinning working, not a bug.
* Use Map Local to reproduce client handling of responses that are hard to trigger on demand: a [`429 Too Many Requests`](/status-codes/429) with a [`Retry-After`](/headers/retry-after) header, a [`503 Service Unavailable`](/status-codes/503), or a body with an unknown enum value. See [Retries and Backoff](/guides/retries-backoff).
* Use Breakpoints to tamper with a request before it reaches the server, for example removing [`If-Match`](/headers/if-match) or changing an ID, to check the API rejects it with [`428 Precondition Required`](/status-codes/428) or [`403 Forbidden`](/status-codes/403) rather than trusting the client.
* Use Throttling with added latency to test timeouts and duplicate submissions. Slow connections are where retries without an [`Idempotency-Key`](/headers/idempotency-key) create double charges. See [Idempotency](/guides/idempotency).
* Inspect caching behavior on the wire: whether [`Cache-Control`](/headers/cache-control), [`ETag`](/headers/etag) and [`Vary`](/headers/vary) are present, and whether the client sends conditional requests and receives [`304 Not Modified`](/status-codes/304).
* Treat saved Charles sessions as sensitive. They contain full headers including [`Authorization`](/headers/authorization) and cookies; redact them before attaching to a ticket. For a scriptable, open-source alternative, see [mitmproxy](/tools/clients-debugging/mitmproxy).
