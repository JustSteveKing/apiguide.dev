---
title: "The HTTP QUERY Method (RFC 10008)"
description: "A reference for RFC 10008, which defines QUERY, a safe, idempotent and cacheable HTTP method that carries the query in the request body: Content-Type rules, the Accept-Query field, Location and Content-Location, redirects and cache keys."
currentVersion: "RFC 10008"
officialUrl: "https://www.rfc-editor.org/rfc/rfc10008.html"
updatedDate: 2026-10-17
---

## What is RFC 10008?

Every API that offers search eventually meets a query too large or too structured for a URI: a filter tree, a list of five hundred IDs, a JSONPath or SQL expression. The two workarounds are both bad. Squeezing it into the query string runs into URI length limits and leaks the query into every access log on the path. Sending it as a [`POST`](/methods/post) body works, but tells every client, cache and proxy that the request might change state, so it cannot be retried automatically or cached.

RFC 10008, "The HTTP QUERY Method", published as a Proposed Standard in June 2026, adds the missing method: [`QUERY`](/methods/query) is safe and idempotent like [`GET`](/methods/get), its responses are cacheable, and the query travels in the request content. It was developed in the IETF HTTP working group as `draft-ietf-httpbis-safe-method-w-body`, whose final revision was -14. That draft is now an RFC; cite RFC 10008, not the draft.

| Method | Safe | Idempotent | Cacheable | Query in |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | Yes | Yes | Yes | URI |
| `QUERY` | Yes | Yes | Yes | Request content |
| `POST` | Not in general | Not in general | Only with explicit freshness and a `Content-Location` matching the target URI | Request content |

---

## 1. A QUERY request

```http
QUERY /contacts HTTP/1.1
Host: example.org
Content-Type: application/x-www-form-urlencoded
Accept: application/json

select=surname,givenname,email&limit=10&match=%22email=*@example.*%22
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  { "surname": "Smith", "givenname": "John", "email": "smith@example.org" }
]
```

The media type of the request content defines the query language. The target resource decides what that query means against its data. A form-encoded body, a JSON filter document and a SQL string are all legitimate, as long as the resource advertises support for them.

---

## 2. Content-Type and error codes

`Content-Type` is not optional. RFC 10008 requires a server to fail the request when it is missing or inconsistent with the content, and forbids content sniffing to guess a type.

| Situation | Status |
| :--- | :--- |
| No media type, or one inconsistent with the content | [`400 Bad Request`](/status-codes/400) |
| Query media type not supported by this resource | [`415 Unsupported Media Type`](/status-codes/415), with `Accept-Query` listing what would work |
| Query understood but cannot be processed, for example it names a table that does not exist | [`422 Unprocessable Content`](/status-codes/422) |
| Requested response format not available | [`406 Not Acceptable`](/status-codes/406) |

---

## 3. Accept-Query

[`Accept-Query`](/headers/accept-query) is a response field that lists the query media types a resource accepts. It is a Structured Field List of Tokens or Strings, order is not significant, and wildcards are limited to `*/*` and `type/*`:

```http
Accept-Query: "application/jsonpath", application/sql;charset="UTF-8"
```

It applies to every URI on the server with the same path, ignoring the query component. Send it on `OPTIONS`, `HEAD` and `415` responses so clients can discover what to send, and list `QUERY` in [`Allow`](/headers/allow).

---

## 4. Location and Content-Location

A successful `QUERY` response can carry two URIs, and they mean different things:

| Field | Points to | What a `GET` on it returns |
| :--- | :--- | :--- |
| [`Content-Location`](/headers/content-location) | A resource holding these results | The results as they were computed for this request |
| [`Location`](/headers/location) | The equivalent resource for the query itself | Fresh results, as if the same `QUERY` were sent again |

`Location` is the more useful one. It turns an expensive, body-keyed query into a plain URI that clients can bookmark, share and re-fetch with `GET`, and that every cache already understands. Either URI may be temporary; if a later `GET` on it fails, the client falls back to the original `QUERY`. Do not put sensitive parts of the query into these URIs, because that recreates the logging problem `QUERY` exists to avoid.

---

## 5. Redirects

| Status | Client behavior |
| :--- | :--- |
| [`301`](/status-codes/301), [`308`](/status-codes/308) | Moved permanently: resend the `QUERY` to the new URI |
| [`302`](/status-codes/302), [`307`](/status-codes/307) | Moved temporarily: resend the `QUERY` to the new URI |
| [`303 See Other`](/status-codes/303) | The result can be obtained with a `GET` on the `Location` URI |

The historical exception that lets a client turn `POST` into `GET` on a `301` or `302` does not apply to `QUERY`. Use `303` deliberately when you want the client to switch to `GET`, for example after storing a query and returning a URI for its results.

---

## 6. Caching and conditional requests

A cache can store a `QUERY` response and use it for later `QUERY` requests, but the cache key must include the request content and its related metadata, not just the URI. Caches may normalize away differences that do not change meaning, such as content coding, or apply format-aware normalization (for `+json` types, say), but only for the key; the request forwarded upstream is unchanged. Normalize wrongly and the cache serves one query's results for another, so be conservative. See [HTTP caching](/specifications/http-caching).

Conditional requests work as for `GET`: the selected representation of a `QUERY` is the one a `GET` on the equivalent resource would return, so [`ETag`](/headers/etag) and [`If-None-Match`](/headers/if-none-match) behave normally. Range requests are defined, but byte ranges are rarely useful on query results; paginate in the query language instead.

---

## 7. Adopting it

* **Prefer `GET` when the query fits in the URI.** `QUERY` is for queries that do not fit, or that should not appear in logs. It is not a replacement for ordinary filters.
* **Check the whole path.** `QUERY` is new. Proxies, CDNs, WAFs, gateways, frameworks and HTTP client libraries may reject an unknown method or drop its body. Test every hop before putting it in a public contract, and keep a `POST` search endpoint for clients that cannot send it.
* **Expect a CORS preflight.** `QUERY` is not a CORS-safelisted method, so browser clients send `OPTIONS` first. See [CORS](/guides/cors).
* **Never mutate state in a `QUERY` handler.** Clients and intermediaries are entitled to retry it. Logging and metering are fine; creating resources is not.
* **Do not use `GET` with a body.** RFC 9110 says content on a `GET` has no generally defined semantics and may lead some implementations to reject the request. That gap is what `QUERY` closes.

For the method-level summary see [`QUERY`](/methods/query); for designing search parameters in general see [filtering, sorting and searching](/guides/filtering-sorting-searching).
