---
name: "X-Content-Type-Options"
description: "Tells browsers not to second-guess the declared Content-Type, blocking scripts and stylesheets served with the wrong media type."
category: "response"
standard: true
reference:
  title: "WHATWG Fetch Standard"
  url: https://fetch.spec.whatwg.org/
updatedDate: 2026-10-14
---

## What is the X-Content-Type-Options header?

The `X-Content-Type-Options` response header has one valid value, `nosniff`. It is defined in the WHATWG Fetch Standard (Section 3.6) and registered as a permanent field in the IANA HTTP Field Name Registry, despite the `X-` prefix. It tells the browser to trust the [`Content-Type`](/headers/content-type) the server declared instead of guessing a type from the bytes.

Fetch specifies exactly what it enforces: when `nosniff` is present, a response requested as a script (or a worker or worklet script) is blocked unless it has a JavaScript media type, and a response requested as a stylesheet is blocked unless it is `text/css`. Only the first value counts, compared case-insensitively.

## API Usage & Best Practices

* **Send it on every response**: It is one constant header with no negotiation and no downside for a correctly typed API. Set it once at the gateway or framework level rather than per endpoint.
* **It protects JSON from being loaded as script**: An attacker page can try to pull your API response in with a `<script>` tag. With `nosniff`, a response served as `application/json` is refused as a script by the browser, rather than being executed if its content happens to parse as JavaScript.
* **It only works if your Content-Type is right**: `nosniff` makes the browser enforce whatever you declared. Serve JSON as `application/json` or `application/problem+json`, never `text/html` or `text/plain`, and set an explicit type on user-uploaded files you serve back.
* **Do not treat it as a defense on its own**: It does not stop a browser rendering a response typed `text/html`, which is why an error page that reflects user input as HTML is still an XSS risk. Correct media types, output encoding, a restrictive `Content-Security-Policy` on HTML and [CORS](/guides/cors) policy do the rest.
* **Ignore it for non-browser clients**: HTTP libraries and SDKs do not sniff, so the header has no effect on them. That is no reason to omit it.

## Examples

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Content-Type-Options: nosniff
```
