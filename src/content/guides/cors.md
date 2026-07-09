---
title: "Cross-Origin Resource Sharing (CORS)"
description: "Understand CORS, preflight OPTIONS requests, and access control headers in web APIs."
category: "security"
---

## Introduction to CORS

Cross-Origin Resource Sharing (CORS) is a browser security mechanism that restricts web applications running in one origin (domain) from interacting with resources hosted on a different origin.

CORS is enforced entirely by the client browser. If an API does not return the proper CORS headers, browser clients will block the response payload, even if the server successfully processed the request.

---

## 1. Simple Requests vs. Preflight Requests

Browsers segment cross-origin requests into two categories:

### Simple Requests
Requests using [`GET`](/methods/get), [`HEAD`](/methods/head), or [`POST`](/methods/post) with standard media types (like URL-encoded form data) do not trigger a preflight. The browser makes the request directly and inspects the response headers to see if the origin is allowed.

### Preflight Requests
Requests that use mutating methods ([`PUT`](/methods/put), [`PATCH`](/methods/patch), [`DELETE`](/methods/delete)) or send custom headers (like [`Authorization`](/headers/authorization) or JSON [`Content-Type: application/json`](/headers/content-type)) require a preflight check. 
* The browser automatically sends a preflight [**`OPTIONS`**](/methods/options) request first.
* The server must respond with access control headers permitting the actual request.
* If the preflight succeeds, the browser sends the actual request.

---

## 2. Essential CORS Headers

### `Access-Control-Allow-Origin`
Specifies which origins are permitted to read the response. E.g. `Access-Control-Allow-Origin: https://app.example.com`. Avoid using wildcard `*` in authenticated production APIs.

### `Access-Control-Allow-Methods`
Lists HTTP methods allowed during the actual request. E.g. `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`.

### `Access-Control-Allow-Headers`
Lists custom headers the client is permitted to send. E.g. `Access-Control-Allow-Headers: Authorization, Content-Type, Idempotency-Key`.

### `Access-Control-Max-Age`
Instructs the browser how many seconds it can cache the preflight OPTIONS permission. Setting this (e.g. to `86400` seconds) prevents the browser from sending redundant OPTIONS requests before every single call.

---

## 3. CORS and Credentials

If your API relies on HTTP cookies or client-side Authorization headers, you must send:
```http
Access-Control-Allow-Credentials: true
```
When credentials are enabled, `Access-Control-Allow-Origin` **cannot** be a wildcard `*`. It must be an explicit, single domain matching the incoming `Origin` header.
