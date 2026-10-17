---
name: "Referrer-Policy"
description: "Controls how much of the current URL a browser puts in the Referer header of requests made from a page. Send no-referrer on API responses."
category: "response"
standard: true
reference:
  title: "W3C Referrer Policy"
  url: https://www.w3.org/TR/referrer-policy/
updatedDate: 2026-10-17
---

## What is the Referrer-Policy header?

The `Referrer-Policy` response header tells the browser how much of the document's URL to include in the `Referer` header of requests the document goes on to make: links the user follows, images, scripts, and `fetch()` calls. It is defined in the W3C [Referrer Policy](https://w3c.github.io/webappsec-referrer-policy/) specification and registered as a permanent field in the IANA HTTP Field Name Registry. Unlike `Referer`, its name is spelled correctly.

| Value | What the `Referer` contains |
| :--- | :--- |
| `no-referrer` | Nothing. The header is omitted. |
| `no-referrer-when-downgrade` | The full URL, except on HTTPS-to-HTTP requests, which get nothing. |
| `origin` | Only the origin, such as `https://app.example.com/`, on every request. |
| `origin-when-cross-origin` | The full URL for same-origin requests, only the origin otherwise. |
| `same-origin` | The full URL for same-origin requests, nothing for cross-origin ones. |
| `strict-origin` | Only the origin, and nothing on HTTPS-to-HTTP requests. |
| `strict-origin-when-cross-origin` | The full URL for same-origin requests, the origin for cross-origin ones, nothing on HTTPS-to-HTTP. The browser default when no policy is set. |
| `unsafe-url` | The full URL, path and query string included, on every request, even to HTTP. |

The header may list several values separated by commas. The browser uses the last one it understands, which lets you add a newer value with an older fallback in front of it.

## API Usage & Best Practices

* **Send `no-referrer` on API responses.** A JSON response is not a page and makes no onward requests, so there is nothing to lose. It is one constant header alongside [`X-Content-Type-Options`](/headers/x-content-type-options) and [`Content-Security-Policy`](/headers/content-security-policy), and it covers the case where a browser renders an API response and something in it triggers a request.
* **It matters most on the HTML your API serves.** OAuth authorization and callback pages, password reset links and magic-link sign-in pages often carry a secret in the URL. Without a strict policy, the next cross-origin request from that page, such as a third-party script or a link the user clicks, can carry the path and query in `Referer`. Under the default policy only the origin leaks cross-origin, but same-origin requests still get the full URL, and anything that logs it there keeps your secret. `no-referrer` on those pages closes it; better still, keep secrets out of URLs.
* **Never use `unsafe-url`.** It sends full URLs, query strings included, to every destination, including plain HTTP ones.
* **Do not rely on `Referer` arriving at your API.** Clients choose their own policy, privacy tools strip the header, and non-browser clients rarely send it. Use it for analytics, never for authentication or CSRF protection. For CSRF, check [`Origin`](/headers/origin) and use tokens or `SameSite` cookies.
* **Expect only the origin from browser apps.** Under the default `strict-origin-when-cross-origin`, a single-page app on `app.example.com` calling your API on `api.example.com` sends `Referer: https://app.example.com/`, not the page path. If you need to know which screen made a call, have the client send it explicitly.
* **Server-side clients are unaffected.** The header only changes what browsers send. It does nothing for SDKs or server-to-server calls.

## Examples

The baseline for a JSON API response:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Referrer-Policy: no-referrer
```

A hosted password reset page that must not leak its token-bearing URL:

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Referrer-Policy: no-referrer
Cache-Control: no-store
```

A fallback list. A browser that does not know `strict-origin-when-cross-origin` uses `no-referrer`:

```http
HTTP/1.1 200 OK
Referrer-Policy: no-referrer, strict-origin-when-cross-origin
```
