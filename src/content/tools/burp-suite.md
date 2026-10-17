---
name: "Burp Suite"
description: "PortSwigger's web security testing toolkit: a free Community Edition for manual testing, Professional for penetration testers, and Burp Suite DAST for scanning at scale, with API scans from OpenAPI definitions."
category: "security-testing"
lifecycleStages: ["testing"]
url: "https://portswigger.net/burp"
pricing: "freemium"
---

## What is Burp Suite?

Burp Suite is a web application security testing platform from PortSwigger. It is built around an intercepting proxy: traffic between a client and an API passes through Burp, where it can be inspected, modified and replayed. It comes in several editions:

* **Community Edition** is free. It includes the HTTP and WebSocket proxy with history, Repeater, Decoder, Sequencer and Comparer, and a demo version of Intruder. It has no automated vulnerability scanner.
* **Professional** adds Burp Scanner, the full Intruder, automated crawling, project files, Burp Collaborator for out-of-band testing, and Pro-only extensions. It is aimed at penetration testers.
* **Burp Suite DAST** runs scheduled and CI-driven scans across many applications, for AppSec and engineering teams.

For APIs, Burp Scanner can run an API-only scan from an [OpenAPI](/specifications/openapi) definition or a SOAP WSDL, treating each server, path and method combination as a separate endpoint. Its documentation also covers scanning Postman Collections and [GraphQL](/specifications/graphql) APIs.

## Why use it in the API Lifecycle?

* **The manual workflow is the point.** Repeater, which resends a captured request with edits, is how many authorization bugs are actually found: capture a request as one user, swap in another user's token or object ID, and see whether the API notices.
* **Scanner coverage from the contract.** An API-only scan from the definition reaches operations a crawler never would.
* **Extensibility.** The BApp Store adds parsers, authentication helpers and checks, and the extension API lets a team write its own.
* **A common format with security teams.** Penetration test findings often arrive as Burp requests, which you can load and replay against a fix.

## Best Practices

* **Use Repeater to test object-level authorization by hand.** For each endpoint that takes an ID, replay it with a second account's credentials. A [`200 OK`](/status-codes/200) where you expected [`403 Forbidden`](/status-codes/403) or [`404 Not Found`](/status-codes/404) is a broken object level authorization bug. See [Authorization Models](/guides/authorization-models).
* **Check the definition parses before scanning.** Burp's API scan expects JSON or YAML without external references, with server URLs it can reach. A definition split across files needs bundling first.
* **Scope the target.** Set the project scope to your API's hosts so the proxy history and scanner ignore third-party traffic, and never scan a system you do not have permission to test.
* **Scan staging, with real credentials.** An unauthenticated scan of an authenticated API tests the login screen. Configure authentication for the scan and run it against an environment whose data you can throw away.
* **Do not treat Community as a scanner.** It has none. If you need automated scanning without a license, use [ZAP](/tools/security-testing/zap).
