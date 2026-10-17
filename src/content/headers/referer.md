---
name: "Referer"
description: "The misspelled request header naming the resource the target URI was obtained from. Optional, often trimmed, and never trustworthy."
category: "request"
standard: true
relatedCodes: [403]
---

## What is the Referer header?

The `Referer` request header, defined in Section 10.1.3 of [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-referer), lets a user agent say which resource the target URI was obtained from: the page with the link, the document that loaded the script. The name is a misspelling of "referrer" that has been in the protocol since the beginning, and RFC 9110 keeps it with a `[sic]`.

```http
Referer: https://app.example.com/orders/ord_123
```

The value is an absolute or relative URI. A user agent MUST NOT include the fragment or userinfo, MAY truncate it to the origin, and when the URI came from somewhere with no URI of its own, such as a bookmark or typed address, MUST either omit the header or send `about:blank`. A user agent MUST NOT send it on an unsecured HTTP request if the referring page was loaded over HTTPS.

Browsers go further. The Fetch standard makes `Referer` a forbidden request header, so page scripts cannot set it, and the W3C Referrer Policy specification sets the default policy to `strict-origin-when-cross-origin`: the full URL for same-origin requests, only the origin for cross-origin requests, and nothing when going from HTTPS to HTTP. Pages and responses can change that with a `Referrer-Policy` header.

## API Usage & Best Practices

* **Never use it for authentication or authorization.** Any non-browser client can send any value. RFC 9110 notes some servers use it to resist CSRF or deep linking, "but not all requests contain it". Use [`Origin`](/headers/origin) checks and CSRF tokens, or token authentication that browsers do not attach automatically.
* **Do not expect the full URL cross-origin.** With the default browser policy, a call from `https://app.example.com/orders/ord_123` to your API on another origin carries `Referer: https://app.example.com/`. Code that parses paths out of it will see only the origin.
* **Treat it as analytics data.** It is fine for "where does traffic come from" and for finding broken inbound links, which is what RFC 9110 lists it for. It is optional, often trimmed, and sometimes stripped by privacy tools and proxies, so do not build features that break without it.
* **Keep secrets out of URLs.** If a page URL contains a token or personal data, the `Referer` on requests that page makes can leak it to third parties. Set `Referrer-Policy: no-referrer` or `strict-origin` on such pages, and stop putting secrets in URLs.
* **Do not rewrite it at your edge.** RFC 9110 says an intermediary SHOULD NOT modify or delete `Referer` when it shares the scheme and host of the target URI, because stripping it interferes with CSRF defenses that rely on it.
* **Spell it the protocol's way.** The header is `Referer`. The policy header and the HTML attribute are spelled correctly, `Referrer-Policy` and `referrerpolicy`, which catches everyone at least once.

## Examples

A same-origin request from a browser, carrying the full referring URL:

```http
GET /v1/orders/ord_123/items HTTP/1.1
Host: app.example.com
Referer: https://app.example.com/orders/ord_123
```

A cross-origin request under the default `strict-origin-when-cross-origin` policy, trimmed to the origin:

```http
GET /v1/orders/ord_123 HTTP/1.1
Host: api.example.com
Origin: https://app.example.com
Referer: https://app.example.com/
```
