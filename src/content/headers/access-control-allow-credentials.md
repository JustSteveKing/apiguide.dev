---
name: "Access-Control-Allow-Credentials"
description: "Indicates whether the response can be exposed when the CORS request includes credentials."
category: "response"
standard: true
relatedCodes: []
---

## What is the Access-Control-Allow-Credentials header?

The `Access-Control-Allow-Credentials` response header tells the browser whether JavaScript may read the response when the cross-origin request was made with credentials such as cookies, TLS client certificates, or `Authorization` headers. Its only valid value is `true`.

## API Usage & Best Practices

* **Requires an explicit origin**: When set to `true`, `Access-Control-Allow-Origin` must name a specific origin; the wildcard `*` is rejected by the browser for credentialed requests.
* **Client must opt in too**: The header only has effect when the client sends the request with `credentials: 'include'` (Fetch) or `withCredentials = true` (XHR).
* **Applies to headers too**: With credentials, wildcards in `Access-Control-Allow-Headers` and `Access-Control-Allow-Methods` are also ignored.

## Examples

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
```
