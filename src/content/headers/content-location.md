---
name: "Content-Location"
description: "Identifies a URI for the specific representation enclosed in the message, distinct from the redirect or creation target given by Location."
category: "both"
standard: true
relatedCodes: [200, 201]
reference:
  title: "RFC 9110, Section 8.7"
  url: https://www.rfc-editor.org/rfc/rfc9110.html#section-8.7
updatedDate: 2026-10-14
---

## What is the Content-Location header?

The `Content-Location` header, defined in Section 8.7 of [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-location), gives a URI for the representation enclosed in the message. The test the RFC uses is concrete: a `GET` on that URI, at the time the message was generated, would return a `200 OK` with the same representation as this message's content.

It is representation metadata. It does not redirect anything, it does not replace the request's target URI, and a client is never expected to follow it.

That is the key difference from [`Location`](/headers/location). `Location` points to a resource **related to the response**, with the relationship set by the status code: the resource created by a [`201 Created`](/status-codes/201), or the target to redirect to on a `3xx`. `Content-Location` describes **the body you are holding**. The two can appear in the same response.

| Response | `Content-Location` means |
| :--- | :--- |
| `2xx` to `GET`, same URI as the target | Nothing beyond the default; the body is the target's representation |
| `2xx` to `GET`, different URI | The target is negotiated, and this is the URI of the specific variant selected |
| `2xx` to `PUT` or `POST`, same URI as the target | The body is the new state of the resource, not a status message |
| `201`, same URI as `Location` | The body is a current representation of the newly created resource |
| Any other `2xx` to a state-changing request | The body is a report on the action, retrievable later at that URI |

## API Usage & Best Practices

* **Send it with `Location` on a `201` that returns the resource.** When `POST` creates a resource and the response body is that resource, set `Content-Location` to the same URI as `Location`. That tells the client it already has the current representation and does not need a follow-up [`GET`](/methods/get).
* **Use it to say a `PUT` or `PATCH` response is the resource.** A `200` to a [`PUT`](/methods/put) carrying `Content-Location` equal to the target URI tells the client the body is the updated state, so it can replace its local copy. Without it, the body could just as well be a summary of what happened.
* **Use it to give a receipt a permanent address.** When a `POST` to `/v1/payments` returns a payment report, a `Content-Location` of `/v1/payments/pay_123/receipt` says the same report can be fetched there later.
* **Use it for negotiated variants.** If `/v1/reports/42` serves JSON or CSV depending on [`Accept`](/headers/accept), the CSV response can carry `Content-Location: /v1/reports/42.csv` to name the specific variant. Pair that with [`Vary`](/headers/vary) so caches key correctly.
* **Never use it in place of `Location`.** Clients do not redirect on `Content-Location`, and a `201` without `Location` is missing the one field that says where the new resource is.
* **Do not treat a different URI as authoritative.** RFC 9110 notes that a `Content-Location` pointing somewhere else can only be trusted if both URIs share the same owner, which HTTP cannot prove. A client should not, for example, cache a representation under a third-party URI because a response claimed it.
* **On requests, treat it as context only.** A client may send `Content-Location` to say where it originally got the content it is sending. The server must not save it verbatim as part of the representation and must not let it change the request's meaning: a `PUT` to a negotiated resource updates that resource, not the variant named in `Content-Location`.

## Examples

A `201` whose body is the created resource:

```http
HTTP/1.1 201 Created
Location: https://api.example.com/v1/orders/ord_123
Content-Location: https://api.example.com/v1/orders/ord_123
Content-Type: application/json

{"id": "ord_123", "status": "pending", "total": "49.00"}
```

A negotiated response naming the variant it selected:

```http
HTTP/1.1 200 OK
Content-Type: text/csv
Content-Location: /v1/reports/42.csv
Vary: Accept
```

A `POST` that returns a receipt also available at its own URI:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Location: /v1/payments/pay_123/receipt
```
