---
name: "User-Agent"
description: "Identifies the client software making the request, as a list of product tokens in decreasing order of significance."
category: "request"
standard: true
relatedCodes: [400, 403]
---

## What is the User-Agent header?

The `User-Agent` request header, defined in Section 10.1.5 of [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-user-agent), identifies the software that originated the request. Its value is one or more product tokens, each a name and optional version, optionally followed by comments in parentheses, listed in decreasing order of significance:

```http
User-Agent: CERN-LineMode/2.15 libwww/2.17b3
```

A user agent should send it on every request unless configured not to. The RFC also sets limits on what goes in it: product identifiers must not carry advertising or other nonessential information, the version part should only ever be a version, and a client should avoid needlessly fine-grained detail because long, specific values increase latency and make users easier to fingerprint.

## API Usage & Best Practices

* **Send a descriptive one from every SDK.** Put your SDK first, its version, then the runtime it is running on: `acme-python/4.2.0 python/3.12.4`. When a bug report arrives, or a breaking change needs a rollout plan, the first question is always which client versions are still calling you, and `User-Agent` answers it.
* **Let integrators append their own product.** Give SDK users an option to add an application token, so traffic from `billing-sync/1.3 acme-node/4.2.0 node/22.9.0` can be traced to a team rather than just to your library. This is the order RFC 9110 asks for: most significant product first.
* **Requiring it is reasonable.** An API is within its rights to reject requests with no `User-Agent`, or with a generic default from an HTTP library, and to ask callers to identify their application. GitHub's REST API does exactly this. If you do, document it and return a clear [`400 Bad Request`](/status-codes/400) or [`403 Forbidden`](/status-codes/403) with a problem body that says what to send.
* **Never use it for authentication or authorization.** It is a free-text string the client chooses. Anyone can copy your mobile app's `User-Agent`. Identity comes from [`Authorization`](/headers/authorization), not from what a client claims to be.
* **Do not use it to block abuse on its own.** Blocking a `User-Agent` stops only the clients that do not change it. Rate-limit on authenticated identity.
* **Avoid feature-switching on it.** Tailoring responses to a parsed `User-Agent` creates behavior that is invisible in your contract and breaks when a client changes its string. If a response genuinely differs by client, version the API or use content negotiation. If you must work around a known client bug, match on the exact product token and version, and remove the workaround once that version is gone.
* **Do not include personal data in it.** No user IDs, email addresses or device serial numbers. It is logged everywhere, by every intermediary.
* **Mind browsers.** Browsers do not let page JavaScript set `User-Agent` reliably, so an API called from browsers sees whatever the browser sends. Do not make it a hard requirement for browser-facing endpoints.

## Examples

An SDK request identifying the application, the SDK and the runtime:

```http
GET /v1/invoices HTTP/1.1
Host: api.example.com
User-Agent: billing-sync/1.3.0 acme-node/4.2.0 node/22.9.0
Authorization: Bearer eyJhbGciOi...
```

A rejected request from an anonymous client:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "https://api.example.com/problems/user-agent-required",
  "title": "User-Agent required",
  "status": 400,
  "detail": "Send a User-Agent that names your application, for example 'my-app/1.0'."
}
```
