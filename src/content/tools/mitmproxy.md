---
name: "mitmproxy"
description: "An interactive, SSL-capable intercepting HTTP proxy CLI and web tool built for developers."
category: "clients-debugging"
lifecycleStages: ["development", "testing"]
url: "https://mitmproxy.org"
pricing: "open-source"
---

## What is mitmproxy?

mitmproxy is a free and open source interactive HTTPS proxy that can intercept, inspect, modify, and replay web traffic including HTTP/1, HTTP/2, HTTP/3, WebSockets, and other SSL/TLS-protected protocols. It is a tool for debugging, testing, privacy measurements, and penetration testing.

## Why use it in the API Lifecycle?

* **Traffic Interception and Manipulation**: The tool allows for the interception, inspection, modification, and replaying of web traffic across various protocols, including HTTP/1, HTTP/2, HTTP/3, WebSockets, and any SSL/TLS-protected protocols.
* **Message Decoding and Prettification**: It provides capabilities to prettify and decode a range of message types, from HTML content to Protobuf messages.
* **Web-Based Graphical Interface**: A web interface, mitmweb, offers a graphical environment for core features, enabling request interception and replay for diverse applications and devices.
* **Python Scripting API**: The mitmdump component offers a Python API for full control over the proxy, allowing for automated message modification, traffic redirection, and implementation of custom commands.
* **Addon Ecosystem Integration**: The tool supports an ecosystem of addons and tools, enabling extended functionality and integration with other systems, such as converting captures to OpenAPI specifications or interacting with Kubernetes Services.

## Best Practices

* Utilize mitmproxy for specific use cases like debugging, testing, privacy measurements, and penetration testing of web traffic.
* Employ mitmweb to gain a graphical overview and control of traffic for applications or devices outside of a browser's built-in developer tools.
* Develop custom Python scripts with mitmdump to automate complex traffic manipulation tasks or integrate the proxy into automated testing workflows.
* Explore existing community-contributed addons and tools to enhance mitmproxy's capabilities for specific needs, such as converting captures to OpenAPI specifications.
