---
name: "Proxyman"
description: "A native debugging proxy for macOS, Windows and Linux that captures and decrypts HTTPS traffic from desktop apps, browsers, iOS and Android."
category: "clients-debugging"
lifecycleStages: ["development", "testing"]
url: "https://proxyman.com"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is Proxyman?

Proxyman is a desktop web debugging proxy that sits between a client and the network, capturing and decrypting HTTP and HTTPS traffic so it can be inspected, modified and replayed. It started as a native macOS app and now runs on macOS, Windows and Linux, with one-click setup for iOS simulators and Android emulators and support for physical devices. It is commercial software: the free tier is limited to evaluation, and debugging tools such as breakpoints, Map Local, Map Remote and scripting require a paid license.

## Why use it in the API Lifecycle?

* **HTTPS inspection**: Installs and trusts its own root certificate to decrypt TLS traffic from apps, browsers and devices, showing every request, response and header in full.
* **Mobile debugging**: Captures traffic from iOS simulators and Android emulators with automatic setup, plus physical iOS and Android devices, which is where many API integration bugs actually surface.
* **Breakpoints**: Pauses a matching request or response so it can be edited before it continues, for testing how a client handles a changed status code or a malformed body.
* **Map Local and Map Remote**: Serves a local file in place of a real response, or redirects requests to another host, so a client can be pointed at a staging API or a fixture without a rebuild.
* **Scripting**: JavaScript scripts rewrite requests and responses programmatically, for cases too dynamic for a static rule.
* **Network conditions and GraphQL rules**: Throttles bandwidth and latency, and matches rules on GraphQL operation names rather than a single shared endpoint URL.

## Best Practices

* Enable SSL proxying only for the hosts you are debugging, not for everything. Decrypting all traffic is noisy, breaks apps that pin certificates, and puts unrelated credentials in the capture.
* Remove or distrust the Proxyman root certificate on devices and simulators when you are finished. A trusted interception CA left on a test phone is a standing risk.
* Use Map Local to reproduce client behavior against a specific error, such as a [`429 Too Many Requests`](/status-codes/429) with a [`Retry-After`](/headers/retry-after) header or a [`503 Service Unavailable`](/status-codes/503), instead of waiting for the server to misbehave.
* Use breakpoints for one-off investigation and scripts or Map rules for anything you will repeat. Rules can be saved and reapplied, and a breakpoint is easy to leave active and forget.
* Redact tokens and personal data before exporting or sharing a capture. Session logs contain [`Authorization`](/headers/authorization) headers and cookies verbatim.
* Turn what you find into an automated test. A proxy shows a bug once; a regression test in the suite described in [API Testing](/guides/api-testing) keeps it fixed.
