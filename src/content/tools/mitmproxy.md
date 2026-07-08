---
name: "mitmproxy"
description: "An interactive, SSL-capable intercepting HTTP proxy CLI and web tool built for developers."
category: "clients-debugging"
lifecycleStages: ["development", "testing"]
url: "https://mitmproxy.org"
pricing: "open-source"
---

## What is mitmproxy?

mitmproxy is an open-source, interactive man-in-the-middle proxy for HTTP and HTTPS. It provides a CLI (terminal) interface, a web interface (mitmweb), and a Python scripting API for request interception.

## Why use it in the API Lifecycle?

* **Command Line Native**: Inspect and manipulate HTTP traffic directly from your terminal.
* **Python Scripting**: Write Python scripts to programmatically modify requests/responses on the fly (e.g., injecting authentication headers or altering payloads).
* **Record & Playback**: Save traffic streams into files and replay them later to simulate exact user interactions.

## Best Practices

* Use mitmproxy's console interface during local microservice development to inspect request traffic between containers.
