---
name: "Charles Proxy"
description: "An HTTP proxy and monitor that enables developers to view and inspect all HTTP traffic between their machine and the internet."
category: "clients-debugging"
lifecycleStages: ["development", "testing"]
url: "https://charlesproxy.com"
pricing: "paid"
---

## What is Charles Proxy?

Charles is an HTTP proxy, HTTP monitor, and Reverse Proxy that enables a developer to view all HTTP and SSL/HTTPS traffic between their local machine (or mobile device) and the internet.

## Why use it in the API Lifecycle?

* **Mobile App Debugging**: Route your iOS or Android device traffic through Charles to inspect exact API payloads sent by mobile apps.
* **SSL Proxying**: Decrypts SSL/HTTPS traffic in real-time (using local trust certificates) so you can inspect headers and JSON bodies.
* **Bandwidth Throttling**: Simulate slow networks (3G, high latency, dropped packets) to test client app behavior under poor conditions.

## Best Practices

* Use Charles' "Map Local" feature to intercept an API response and replace it with a mock local file to test UI layouts.
