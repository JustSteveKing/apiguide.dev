---
name: "mitmproxy"
description: "An interactive, SSL-capable intercepting HTTP proxy CLI and web tool built for developers."
category: "clients-debugging"
lifecycleStages: ["development", "testing"]
url: "https://mitmproxy.org"
pricing: "open-source"
updatedDate: 2026-10-14
---

## What is mitmproxy?

mitmproxy is a free, MIT-licensed intercepting proxy for HTTP/1, HTTP/2, HTTP/3, WebSockets and other TLS-protected traffic. It ships as three front-ends over one core: `mitmproxy`, an interactive console UI; `mitmweb`, a browser-based UI; and `mitmdump`, a non-interactive command-line version that works like tcpdump for HTTP. It decrypts HTTPS by generating certificates on the fly from its own certificate authority, and every part of its behavior can be scripted in Python through addons.

## Why use it in the API Lifecycle?

* **See the real exchange**: Inspect exact request and response lines, headers and bodies between a client (a mobile app, an SDK, a third-party integration) and your API, including what the client actually sent rather than what its code claims to send.
* **Many ways to sit in the path**: Regular proxy mode, `reverse:https://api.example.com` in front of a server, `upstream:` to chain to another proxy, `transparent`, `socks5`, `wireguard`, and `local` mode, which captures traffic from a named process without configuring it.
* **Modify on the fly**: Built-in `modify_headers`, `modify_body`, `map_remote` and `map_local` options rewrite traffic without writing code, and interactive interception pauses a flow so you can edit it by hand.
* **Record and replay**: `mitmdump -w` saves flows to a file; client replay re-sends saved requests and server replay answers from recorded responses.
* **Decoding**: Pretty-prints JSON, HTML, XML, Protobuf and other content types, and decodes compressed bodies.
* **Python addons**: `mitmdump -s addon.py` runs scripts that can inspect, rewrite, block or log any flow.

## Best Practices

* Start with `mitmdump -w capture.flow` while reproducing a bug, then filter the capture offline (`mitmdump -nr capture.flow "~m POST & ~c 500"`). A flow file is a precise bug report: share it instead of a screenshot of a log line.
* Install the CA only where you need it, by browsing to `mitm.it` through the proxy, and remember each installation generates its own CA in `~/.mitmproxy`. Protect `mitmproxy-ca.pem`: it contains the private key, and anyone who has it can impersonate any site to a device that trusts it. Remove the CA from devices when you are done.
* Expect certificate pinning to fail rather than silently pass. Apps that pin will reject mitmproxy's certificates; add those hosts to `ignore_hosts` if you do not need to see them, and do not weaken pinning in production builds to make debugging easier.
* Use `modify_headers` to test how your API handles edge cases without changing client code: strip [`If-None-Match`](/headers/if-none-match) to confirm full responses still work, inject a stale [`If-Match`](/headers/if-match) to confirm you return [`412 Precondition Failed`](/status-codes/412), or drop [`Authorization`](/headers/authorization) to confirm a clean [`401 Unauthorized`](/status-codes/401).
* Use server replay (`server_replay`) to give a client deterministic responses for a demo or a flaky test, but do not mistake it for a contract: a recording only proves what the server said once. For mocks that follow the API definition, use a mock server such as [Prism](/tools/testing-mocking/prism).
* Treat captures as sensitive data. They contain bearer tokens, cookies and request bodies; scrub them with an addon before attaching them to tickets, as covered in [Logging Without Leaking](/guides/logging-pii).
