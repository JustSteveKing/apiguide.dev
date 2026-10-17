---
name: "From"
description: "An email address for the human responsible for the requesting user agent. Crawlers and bots should send it; nobody should trust it."
category: "request"
standard: true
reference:
  title: "RFC 9110, Section 10.1.2"
  url: https://www.rfc-editor.org/rfc/rfc9110.html#section-10.1.2
updatedDate: 2026-10-17
---

## What is the From header?

The `From` request header, defined in Section 10.1.2 of [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-from), contains an Internet email address for the human who controls the requesting user agent. The value is a `mailbox` as defined in RFC 5322 Section 3.4.

```http
From: spider-admin@example.org
```

It exists so that the people running a server can contact whoever is running a client that misbehaves. RFC 9110 says a robotic user agent SHOULD send a valid `From` so its operator can be reached if it sends excessive, unwanted or invalid requests. A browser or other user agent acting for a person SHOULD NOT send it without explicit configuration, because an email address in every request conflicts with the user's privacy.

## API Usage & Best Practices

* **Send it from crawlers, scrapers and batch jobs.** If you run automated traffic against someone else's API, `From` plus a descriptive [`User-Agent`](/headers/user-agent) is the polite minimum: the operator can email you instead of blocking your IP range.
* **Use a role address, not a person's.** `api-integrations@example.com` survives staff changes and does not tie one employee's name to your traffic in other people's logs.
* **Never use it for authentication or access control.** RFC 9110 says servers SHOULD NOT, because the value is visible to anyone who sees the request and is routinely logged. Any client can also put any address in it. Identify callers with [`Authorization`](/headers/authorization).
* **Do not require it from API clients.** It is a courtesy for unattended clients, not a way to collect contact details. If you need to reach an integrator, get the address when they register for a key.
* **Treat it as personal data when you log it.** It is an email address. Apply the same retention and access rules as for any other in your logs. See [logging and PII](/guides/logging-pii).

## Examples

A crawler identifying its operator:

```http
GET /v1/public/catalog?page=12 HTTP/1.1
Host: api.example.com
User-Agent: catalog-indexer/2.1 (+https://indexer.example.org/about)
From: crawler-ops@indexer.example.org
```
