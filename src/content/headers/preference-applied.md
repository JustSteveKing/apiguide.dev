---
name: "Preference-Applied"
description: "Tells the client which of the preferences it sent in Prefer the server actually honored."
category: "response"
standard: true
relatedCodes: [200, 201, 202]
reference:
  title: "RFC 7240"
  url: https://www.rfc-editor.org/rfc/rfc7240.html
updatedDate: 2026-10-14
---

## What is the Preference-Applied header?

The `Preference-Applied` response header, defined in RFC 7240 Section 3, lists the [`Prefer`](/headers/prefer) tokens the server honored when it processed the request. Preferences are optional hints, so without this header a client often cannot tell whether a preference was applied or silently ignored.

## API Usage & Best Practices

* **Send it when the response is ambiguous**: RFC 7240 says the header is only necessary when it is not obvious from the response that a preference was applied. The canonical case is `return=minimal` versus `return=representation`: a client cannot reliably infer from a body which one the server chose, so echo it.
* **Echo only what you applied**: List the preferences that changed how you processed the request. Never echo a preference you ignored; the header exists precisely so clients can trust it.
* **No parameters**: The syntax is a comma-separated list of `token` or `token=value`. Unlike `Prefer`, it does not carry preference parameters.
* **Pair Prefer support with Vary**: If honoring a preference can change the response a cache would store, RFC 7240 requires `Vary: Prefer` on the response, whether or not this particular request sent `Prefer`. See [`Vary`](/headers/vary).
* **Do not use Prefer for content negotiation**: RFC 7240 advises against it. Use [`Accept`](/headers/accept) and friends for choosing formats.

## Examples

The client asks for the full resource back after a [`PATCH`](/methods/patch):

```http
PATCH /v1/orders/ord_123 HTTP/1.1
Host: api.example.com
Content-Type: application/merge-patch+json
Prefer: return=representation

{"status": "shipped"}
```

The server honored it and says so:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Preference-Applied: return=representation
Content-Location: /v1/orders/ord_123
Vary: Prefer

{"id": "ord_123", "status": "shipped", "total": "49.00"}
```
