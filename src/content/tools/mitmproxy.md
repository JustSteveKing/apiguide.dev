---
name: "mitmproxy"
description: "An interactive, SSL-capable intercepting HTTP proxy CLI and web tool built for developers."
category: "clients-debugging"
lifecycleStages: ["development", "testing"]
url: "https://mitmproxy.org"
pricing: "open-source"
---

## What is mitmproxy?

Mitmproxy is an open-source interactive HTTPS proxy. It can be used for debugging, testing, privacy measurements, and penetration testing of web traffic. It intercepts, inspects, modifies, and replays various web traffic protocols.

## Why use it in the API Lifecycle?

* **Intercept and Inspect Traffic**: Intercept, inspect, modify, and replay web traffic for protocols such as HTTP/1, HTTP/2, HTTP/3, WebSockets, and other SSL/TLS-protected protocols.
* **Traffic Manipulation**: Modify messages before they reach their destination and replay them to a client or server.
* **Message Decoding and Prettifying**: Prettify and decode various message types, from HTML to Protobuf.
* **Graphical Web Interface**: Access mitmproxy's features through a graphical interface for a DevTools-like experience with additional interception and replay capabilities.
* **Scriptable Python API**: Automate message modification, redirect traffic, visualize messages, and implement custom commands using the mitmdump scripting API.

## Best Practices

* Utilize mitmproxy for debugging web applications to examine request and response flows.
* Employ the tool for security testing, including penetration testing and privacy measurements.
* Develop custom scripts with the Python API to automate complex traffic manipulation scenarios.
* Use mitmweb for a visual inspection and interaction with network traffic, similar to browser developer tools.
