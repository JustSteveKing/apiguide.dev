---
name: "Accept-Query"
description: "Signals that a resource supports the QUERY method and lists the query formats it accepts, as a Structured Field list of media types."
category: "response"
standard: true
relatedCodes: [200, 415]
---

## What is the Accept-Query header?

The `Accept-Query` response header, defined in Section 3 of [RFC 10008](https://www.rfc-editor.org/rfc/rfc10008.html) (The HTTP QUERY Method, Standards Track, June 2026), tells a client two things at once: that the resource supports the [`QUERY`](/methods/query) method, and which media types it accepts as query content.

A `QUERY` request carries its query in the body, and the body's [`Content-Type`](/headers/content-type) decides how it is interpreted: a form-encoded filter, a JSONPath expression, SQL. `Accept-Query` is how the server advertises which of those it understands, in the same way [`Accept-Patch`](/headers/accept-patch) does for `PATCH`.

Unlike `Accept-Patch`, it is a [Structured Field](/specifications/structured-fields): a List whose members are media ranges written as Tokens or Strings, with media type parameters mapped to Structured Field parameters.

```http
Accept-Query: "application/jsonpath", application/sql;charset="UTF-8"
```

Points from RFC 10008 Section 3 that differ from `Accept` and catch people out:

- **Token or String is your choice, and means the same.** Recipients must not treat them differently. A media type that is not a valid Token (one beginning with a digit, for example) has to be a String.
- **Order is not significant**, and there are no `q` weights.
- **Wildcards are limited** to `*/*` and `type/*`.
- **It applies to the path, not the full URI.** The value covers every URI on the server sharing the same path; the query component is ignored. If responses disagree, the most recently received fresh value wins.

## API Usage & Best Practices

* **Parse it as a Structured Field, not with your `Accept` parser.** RFC 10008 requires processing per RFC 9651. An `Accept` parser will mishandle the quoted strings and parameters, and a hand-rolled split on commas will break on a quoted parameter value.
* **Send it on `415` responses to `QUERY`.** RFC 10008 recommends [`415 Unsupported Media Type`](/status-codes/415) when the query's media type is not supported by the resource, including a type known in general but without query semantics there, and names `Accept-Query` as the way to tell the client what would work.
* **Advertise it on `GET`, `HEAD` and `OPTIONS` too.** A client that wants to switch from `GET` to `QUERY` needs to learn that it can before it tries. RFC 10008 shows it on a `HEAD` response; pair it with `QUERY` in [`Allow`](/headers/allow) on [`OPTIONS`](/methods/options).
* **Add it to `Vary` if it changes with the request.** The examples in RFC 10008 list `Accept-Query` in [`Vary`](/headers/vary) alongside `Content-Type` on cacheable `QUERY` responses.
* **Only list formats with real query semantics.** Listing `application/json` is meaningless unless you define what a JSON query document means for that resource. Prefer a registered query format (`application/jsonpath`, `application/sql`) or a vendor media type you document.
* **Check the path before relying on it.** QUERY was published as RFC 10008 in June 2026, and proxies, CDNs, gateways and client libraries that have not caught up may reject or mishandle an unknown method. Test the full path to your origin before you expose `QUERY` in a public contract, and keep a `POST` fallback for clients that cannot send it.

## Examples

Discovering supported query formats with `HEAD`:

```http
HEAD /v1/contacts HTTP/1.1
Host: api.example.com
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Accept-Query: application/x-www-form-urlencoded, "application/jsonpath"
```

A `QUERY` sent in a format the resource does not support:

```http
QUERY /v1/contacts HTTP/1.1
Host: api.example.com
Content-Type: application/sql
Accept: application/json

SELECT surname, email FROM contacts LIMIT 10
```

```http
HTTP/1.1 415 Unsupported Media Type
Content-Type: application/problem+json
Accept-Query: application/x-www-form-urlencoded, "application/jsonpath"

{
  "type": "https://apiguide.dev/errors/unsupported-media-type",
  "title": "Unsupported Media Type",
  "status": 415,
  "detail": "QUERY content must be application/x-www-form-urlencoded or application/jsonpath."
}
```
