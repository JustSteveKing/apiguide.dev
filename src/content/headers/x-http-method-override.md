---
name: "X-HTTP-Method-Override"
description: "De facto request header that tunnels another method, such as PUT or DELETE, through a POST. A workaround that can bypass method-based security."
category: "request"
standard: false
relatedCodes: [400, 403, 405]
updatedDate: 2026-10-17
---

## What is the X-HTTP-Method-Override header?

`X-HTTP-Method-Override` lets a client send a request as [`POST`](/methods/post) while asking the server to process it as a different method: `X-HTTP-Method-Override: DELETE` on a `POST` means "treat this as a [`DELETE`](/methods/delete)". It dates from clients and networks that could only send `GET` and `POST`: HTML forms, old browser plugins, and corporate proxies or firewalls that blocked anything else.

It has never been standardized and is not in the IANA HTTP Field Name Registry. Variants include `X-HTTP-Method`, `X-Method-Override` and a `_method` form or query parameter, which several web frameworks read. A second use is tunneling a long read: Google's APIs document sending a `POST` with `X-HTTP-Method-Override: GET` when the query string would exceed the URL length limit.

## API Usage & Best Practices

* **Do not support it in new APIs.** Every client and proxy worth supporting today sends `PUT`, `PATCH` and `DELETE` without help. For a read that does not fit in a URL, use the [`QUERY`](/methods/query) method, or a documented `POST` search endpoint as the fallback, rather than a `POST` that pretends to be a `GET`.
* **Understand why it is a security problem.** The override creates two answers to "what method is this?". Your WAF, gateway, rate limiter, audit log and authorization rules may all see `POST`, while the application executes `DELETE`. A rule like "this API key may only `POST` to `/v1/users`" is bypassed by any client that adds the header. This is a form of HTTP verb tampering.
* **It can open CSRF holes.** A cross-site HTML form can send a `POST` with arbitrary form fields, so a framework that honors a `_method` body or query parameter lets another site issue a `DELETE` with the victim's cookies. The header form is safer in browsers, because a custom header makes a cross-origin request need a CORS preflight. Honoring the override on `GET` is worse still: a link or an `<img>` is enough.
* **If you must support it, constrain it hard.** Honor it only on `POST`, which is also the default in Express's `method-override` middleware. Allowlist the target methods (`PUT`, `PATCH`, `DELETE`), and reject `GET`, `HEAD`, `CONNECT`, `TRACE` and anything unknown. Read it from the header only, never from the query string. Apply authorization, rate limiting and logging to the **effective** method, and record both methods in your logs.
* **Resolve it in one place.** If the gateway does not understand the override and the application does, they disagree about every overridden request. Either resolve it at the edge, rewriting the method before anything else sees the request, or strip the header at the edge so the application never acts on it.
* **Strip or reject it if you do not support it.** Frameworks sometimes honor it by default or behind a single setting. Check yours. If you do not intend to support overrides, remove the header (and the `_method` parameter) at the edge, or reject requests that carry it with a [`400 Bad Request`](/status-codes/400), so a framework upgrade cannot quietly turn it on. Rejecting is kinder to clients, which otherwise get a `POST` processed when they asked for something else.
* **Watch your caches.** An overridden request is still a `POST` to every cache and proxy on the path, so an override to `GET` loses the caching a real `GET` would get, and anything keyed on the method sees the wrong one.

## Examples

A client behind a proxy that only allows `GET` and `POST`, deleting a resource:

```http
POST /v1/orders/ord_9 HTTP/1.1
Host: api.example.com
X-HTTP-Method-Override: DELETE
Content-Length: 0
```

A long read tunneled through `POST`. Prefer `QUERY` or a search endpoint where you control the API:

```http
POST /v1/orders HTTP/1.1
Host: api.example.com
X-HTTP-Method-Override: GET
Content-Type: application/x-www-form-urlencoded

status=open&customer_id=cus_1&customer_id=cus_2&customer_id=cus_3
```

An API that does not support overrides rejecting the attempt instead of silently processing a `POST`:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "X-HTTP-Method-Override is not supported. Send the intended method directly."
}
```
