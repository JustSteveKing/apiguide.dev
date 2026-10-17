---
name: "Content-Security-Policy"
description: "Tells browsers which sources a document may load and who may frame it. For a JSON API, send the most restrictive policy there is."
category: "response"
standard: true
---

## What is the Content-Security-Policy header?

The `Content-Security-Policy` (CSP) response header declares a policy that the browser enforces on the document or worker created from the response: which origins scripts, styles, images and connections may come from, whether inline script may run, where forms may submit and which pages may embed it in a frame. It is defined in the W3C [Content Security Policy Level 3](https://www.w3.org/TR/CSP3/) specification, still a Working Draft, and is registered as a permanent field in the IANA HTTP Field Name Registry.

A policy is a semicolon-separated list of directives, each a name followed by a source list. The ones that matter for an API:

| Directive | Effect |
| :--- | :--- |
| `default-src` | The fallback for every fetch directive (`script-src`, `style-src`, `img-src`, `connect-src` and so on) that is not set explicitly. `'none'` means nothing may be loaded. |
| `frame-ancestors` | Which origins may embed the response in a frame. `'none'` forbids all framing. It does **not** fall back to `default-src`. |
| `sandbox` | Applies iframe-style sandbox restrictions to the document, blocking script, forms and more. |
| `report-to` | Where to send violation reports. Replaces the deprecated `report-uri`. |

Browsers ignore CSP for non-document requests: a `fetch()` from your single-page app is governed by [CORS](/guides/cors), not by the CSP on the API response. The policy only takes effect when a browser renders the response itself, for example when a user opens an API URL directly, a response is loaded in a frame, or an attacker tricks a browser into treating your response as HTML.

## API Usage & Best Practices

* **For JSON APIs, send the restrictive policy.** `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` costs one constant header and has nothing to break: a JSON response loads no scripts, styles or images, and nobody legitimately frames it. Set it once at the gateway or framework level for every API response, including errors.
* **Include `frame-ancestors` explicitly.** CSP Level 3 spells this out: a policy of `default-src 'none'` "will still allow the resource to be embedded by anyone." `frame-ancestors 'none'` is what blocks clickjacking-style framing of your responses, and it supersedes [`X-Frame-Options`](/headers/x-frame-options) in browsers that support both.
* **Know where it actually helps.** The real protection is for the response that ends up rendered as HTML: an error page from your framework that reflects a path or parameter, a misconfigured route that returns `text/html`, a user-uploaded file served back. `default-src 'none'` stops script on such a page from running inline or loading anything, which turns a reflected XSS into a dead end. Pair it with a correct [`Content-Type`](/headers/content-type) and [`X-Content-Type-Options: nosniff`](/headers/x-content-type-options).
* **It does nothing for machine clients.** SDKs, `curl` and server-to-server callers ignore it completely. That is not a reason to omit it; it is a reason not to count it as access control.
* **APIs that serve HTML need a real policy.** OAuth consent screens, hosted docs (Swagger UI, Redoc), admin consoles and webhook test pages are documents. Give them a policy written for what they load, typically with `script-src` and nonces or hashes, and keep the blanket `'none'` policy for the JSON routes. Do not loosen the API-wide header to accommodate one HTML page.
* **Multiple policies all apply.** If a gateway and the application both send `Content-Security-Policy`, the browser enforces each one, so the effective policy is the stricter combination. Adding a second header can only tighten things, never loosen them.
* **Roll out with Report-Only on HTML.** `Content-Security-Policy-Report-Only` reports violations without blocking. It is worth using on documents with a complex policy. For the JSON `'none'` policy there is nothing to test.
* **Some directives only work as a header.** `frame-ancestors`, `sandbox` and `report-uri` are ignored in a `<meta>` element, so an API must send them in the response header.

## Examples

The baseline for a JSON API response:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
```

The same baseline on an error, which is where reflected input most often ends up rendered:

```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
```

An HTML documentation page served by the same API, with its own policy:

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-r4nd0m'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'
```
