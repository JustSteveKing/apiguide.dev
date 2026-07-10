---
name: "Access-Control-Allow-Headers"
description: "Lists the request headers that are permitted during the actual CORS request."
category: "response"
standard: true
relatedCodes: [204]
---

## What is the Access-Control-Allow-Headers header?

The `Access-Control-Allow-Headers` response header is sent in reply to a CORS preflight to tell the browser which request headers may be used when making the actual cross-origin request. It answers the headers listed in `Access-Control-Request-Headers`.

## API Usage & Best Practices

* **Preflight only**: It appears on the `OPTIONS` preflight response (usually `204 No Content`) and must cover any non-safelisted header your client sends, such as `Authorization` or `Content-Type: application/json`.
* **Mirror the request**: A common pattern is to echo back the value of `Access-Control-Request-Headers`, though listing headers explicitly is more secure. The wildcard `*` is ignored for credentialed requests.

## Examples

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Headers: Authorization, Content-Type
```
