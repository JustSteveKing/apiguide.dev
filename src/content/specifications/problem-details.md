---
title: "Problem Details for HTTP APIs (RFC 9457)"
description: "A reference for the application/problem+json format, covering the standard members, extension members, and validation error patterns used to communicate HTTP API errors."
currentVersion: "RFC 9457"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9457.html"
---

## What is Problem Details?

Problem Details for HTTP APIs is a standardized machine-readable format for carrying error information in an HTTP response body. Rather than every API inventing its own ad-hoc error shape, RFC 9457 (which obsoletes the earlier RFC 7807) defines a small, predictable set of members that clients can parse consistently across services.

The format is serialized as JSON using the media type:
```http
Content-Type: application/problem+json
```

An equivalent XML serialization is defined using `application/problem+xml`.

---

## 1. Standard Members

A problem details object is a JSON object with the following optional members. All members are optional, but a useful response typically includes at least `type`, `title`, and `status`.

| Member     | Type            | Purpose                                                                 |
|------------|-----------------|-------------------------------------------------------------------------|
| `type`     | string (URI)    | A URI reference identifying the problem type. Defaults to `about:blank`. |
| `title`    | string          | A short, human-readable summary of the problem type.                    |
| `status`   | number          | The HTTP status code, duplicated for convenience.                       |
| `detail`   | string          | A human-readable explanation specific to this occurrence.               |
| `instance` | string (URI)    | A URI reference identifying the specific occurrence of the problem.     |

The `type` URI is the primary identifier for the kind of error. When dereferenced it should ideally provide human-readable documentation. If `type` is absent, it is assumed to be `about:blank`, and the `title` should then be the HTTP status phrase.

---

## 2. A Full Example

The following describes a request that failed because the account has insufficient credit:

```json
{
  "type": "https://example.com/probs/out-of-credit",
  "title": "You do not have enough credit.",
  "status": 403,
  "detail": "Your current balance is 30, but that costs 50.",
  "instance": "/account/12345/msgs/abc",
  "balance": 30,
  "accounts": ["/account/12345", "/account/67890"]
}
```

Note that `balance` and `accounts` are not standard members — they are extension members, described next.

---

## 3. Extension Members

Problem detail objects may include any number of additional members, called extension members, to convey machine-readable context beyond the standard fields. Consumers that do not recognize an extension member must ignore it.

Extension members are what make the format practical. A rate-limit error might add `retryAfter`; an out-of-stock error might add `sku`. Because the `type` URI defines the problem, it also defines which extension members a client can expect.

---

## 4. Validation Errors

A common pattern is reporting multiple field-level validation failures in a single response. RFC 9457 does not mandate a specific shape, but the widely used convention is an `errors` extension array where each entry references a location within the request:

```json
{
  "type": "https://example.com/probs/validation-error",
  "title": "Your request is not valid.",
  "status": 422,
  "detail": "The request body failed validation.",
  "errors": [
    {
      "detail": "must be a positive integer",
      "pointer": "#/quantity"
    },
    {
      "detail": "must be a valid email address",
      "pointer": "#/customer/email"
    }
  ]
}
```

Here `pointer` is a JSON Pointer (RFC 6901) into the request body. Some APIs instead use `parameter` for query/form fields or `header` for header-based failures.

---

## 5. Design Guidance

* **Keep `type` stable.** Clients branch on the `type` URI, so treat it as part of your API contract — changing it is a breaking change.
* **Do not leak internals.** `detail` is for the client, not a stack trace. Avoid exposing implementation specifics.
* **Mirror the status code.** The `status` member should match the actual HTTP response status so intermediaries and logs agree.
* **Document extensions.** Every extension member a `type` can emit should be documented at the `type` URI.

---

## RFC 7807 vs RFC 9457

RFC 9457 is a maintenance revision of RFC 7807. The wire format is unchanged and fully backward compatible.

| Aspect                     | RFC 7807            | RFC 9457                          |
|----------------------------|---------------------|-----------------------------------|
| Status                     | Obsoleted           | Current                           |
| Media type                 | `application/problem+json` | `application/problem+json` (same) |
| Multiple problems guidance | Minimal             | Clarified (errors as extension)   |
| `type` default             | `about:blank`       | `about:blank` (unchanged)         |
