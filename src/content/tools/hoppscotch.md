---
name: "Hoppscotch"
description: "An open-source, browser-based API client for building and testing HTTP, GraphQL, WebSocket, and other requests, with a self-hostable option."
category: "clients-debugging"
lifecycleStages: ["development"]
url: "https://hoppscotch.io"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is Hoppscotch?

Hoppscotch is an MIT-licensed open-source API client that runs in the browser (installable as a progressive web app) and as a desktop app for Windows, macOS and Linux. It sends REST and GraphQL requests and connects to real-time endpoints over WebSocket, Server-Sent Events, Socket.IO and MQTT. Collections, environments and pre-request and test scripts are organized in workspaces. The hosted cloud has a free personal tier and paid Organization and Enterprise plans that add team workspaces, SSO and audit logs; the Community Edition can be self-hosted. The `@hoppscotch/cli` package runs collections and their tests from a terminal with `hopp test`.

## Why use it in the API Lifecycle?

* **No install required**: The web app sends requests from a browser tab, which is useful on locked-down machines and for sharing a quick request.
* **Real-time protocols in one place**: WebSocket, SSE, Socket.IO and MQTT connections sit alongside REST and GraphQL requests.
* **Self-hosting**: The Community Edition runs on your own infrastructure, so collections and the requests they contain stay inside your network.
* **Scripted tests**: Test scripts assert on the response after each request, and the same collection runs headlessly in CI.
* **CI runner**: `hopp test` takes an exported collection file or a collection ID, an environment (`-e`), a delay between requests (`-d`), CSV iteration data and `--reporter-junit` output.

## Best Practices

* Know where requests originate. In the browser, requests are subject to [CORS](/guides/cors), which a desktop client or curl is not; Hoppscotch routes around it with interceptors (the Hoppscotch Agent, a browser extension, or a proxy such as Proxyscotch). If a request works in curl and fails here, check the interceptor before blaming the API, and do not loosen your API's CORS policy just to make a testing tool work.
* Self-host the Community Edition, or use the desktop app, for internal APIs and anything carrying production credentials, rather than routing those requests through a hosted proxy you do not control.
* Run collections in CI with `hopp test collection.json -e ci-env.json --reporter-junit results.xml`. The command exits non-zero when a test assertion fails; a non-2xx status alone is not a failure unless a test checks for it, so assert the expected status explicitly.
* Write tests for the error paths, not just the happy path: an invalid body should return [`400 Bad Request`](/status-codes/400) or [`422 Unprocessable Content`](/status-codes/422), a missing token [`401 Unauthorized`](/status-codes/401). See [API Testing](/guides/api-testing).
* When testing a [Server-Sent Events](/specifications/server-sent-events) endpoint, check the response is `text/event-stream`, that events carry an `id`, and that reconnecting with `Last-Event-ID` resumes rather than replays the stream. See [Streaming APIs](/guides/streaming-apis).
* Keep tokens in environment variables marked secret. Their values are never synced to the server, shared with workspace members, or included in exports, unlike a token pasted into a request header.
