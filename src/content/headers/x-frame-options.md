---
name: "X-Frame-Options"
description: "Legacy header that tells browsers whether a response may be shown in a frame. Superseded by CSP frame-ancestors, but still worth sending as DENY."
category: "response"
standard: true
reference:
  title: "WHATWG HTML Living Standard"
  url: https://html.spec.whatwg.org/multipage/
updatedDate: 2026-10-17
---

## What is the X-Frame-Options header?

The `X-Frame-Options` response header tells a browser whether the response may be rendered inside a `<frame>`, `<iframe>`, `<embed>` or `<object>`. It was introduced to stop clickjacking, where an attacker frames your page invisibly and tricks the user into clicking on it. Despite the `X-` prefix, it is registered as a permanent field in the IANA HTTP Field Name Registry, with the WHATWG HTML Standard as its specification. RFC 7034 described it first, as an Informational RFC documenting existing practice.

Two values are valid:

| Value | Effect |
| :--- | :--- |
| `DENY` | The response may not be framed by anyone. |
| `SAMEORIGIN` | The response may be framed only if every ancestor frame, up to the top level, is same-origin with it. |

The HTML Standard defines exactly how browsers treat everything else. `ALLOW-FROM`, an old Internet Explorer extension, is not valid, and a lone invalid value is treated as if the header were absent, so `ALLOW-FROM https://example.com` **allows framing from anywhere**. Conflicting values such as `SAMEORIGIN, DENY` block framing. Values are case-insensitive, and the header has no effect in a `<meta>` element.

If the response also carries an enforced [`Content-Security-Policy`](/headers/content-security-policy) with a `frame-ancestors` directive, the browser ignores `X-Frame-Options` entirely.

## API Usage & Best Practices

* **Send `DENY` on API responses.** A JSON response has no reason to be framed, and the header costs nothing. It only matters when a browser renders the response itself, but that is exactly the case an attacker tries to engineer.
* **Treat `frame-ancestors` as the real control.** `Content-Security-Policy: frame-ancestors 'none'` is the modern equivalent of `DENY`, takes precedence where both are present, and can express things `X-Frame-Options` cannot, such as a list of allowed origins. Send both: `frame-ancestors` for current browsers, `X-Frame-Options` for anything that predates it. The OWASP REST Security Cheat Sheet recommends the same pair for API responses.
* **Never send `ALLOW-FROM`.** Current browsers treat it as invalid, which means no protection at all. If you need to allow specific origins to frame a page, use `frame-ancestors https://partner.example`.
* **Send it once, with one value.** Gateways and frameworks that both add the header can produce `DENY, SAMEORIGIN` or duplicated lines. Browsers resolve a conflict by blocking, which is safe, but it signals that two layers disagree about policy. Pick one layer to own it.
* **Exempt only what must be embeddable.** An embeddable widget or a hosted payment form may genuinely need to be framed. Scope the exception to those routes with `frame-ancestors` listing the allowed origins, rather than dropping the header API-wide.
* **It means nothing to non-browser clients.** SDKs and server-side callers ignore it.

## Examples

The usual pairing on a JSON API response:

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Frame-Options: DENY
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
```

A hosted page that the API's own front end embeds, and nobody else:

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
X-Frame-Options: SAMEORIGIN
Content-Security-Policy: frame-ancestors 'self'
```
