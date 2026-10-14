---
title: "JSON Patch (RFC 6902)"
description: "A reference for JSON Patch, the operation-based format for partial updates with PATCH, covering the six operations, JSON Pointer paths, the test operation, atomicity, and error handling."
currentVersion: "RFC 6902"
officialUrl: "https://www.rfc-editor.org/rfc/rfc6902.html"
---

## What is JSON Patch?

JSON Patch is a format for describing changes to a JSON document as an ordered list of operations. It was designed for the HTTP [`PATCH`](/methods/patch) method (RFC 5789), where the request body has to say *how* to modify a resource rather than what the whole resource should become.

```http
Content-Type: application/json-patch+json
```

A patch document is a JSON array. Each element is an operation object with an `op` member, a `path` member that is a [JSON Pointer](/specifications/json-pointer), and whatever else that operation needs. Operations are applied in order, each to the result of the one before.

For when to choose JSON Patch over [JSON Merge Patch](/specifications/json-merge-patch), see [PATCH Strategies](/guides/patch-strategies).

---

## 1. The Six Operations

| `op` | Members | Effect |
| --- | --- | --- |
| `add` | `path`, `value` | Adds an object member (replacing it if present) or inserts into an array at an index |
| `remove` | `path` | Removes the value at `path`, which must exist |
| `replace` | `path`, `value` | Replaces the value at `path`, which must exist |
| `move` | `from`, `path` | Removes the value at `from` and adds it at `path` |
| `copy` | `from`, `path` | Adds a copy of the value at `from` at `path` |
| `test` | `path`, `value` | Succeeds only if the value at `path` equals `value` |

Rules that catch implementers out:

* **`add` needs the parent to exist.** Adding `/address/city` fails if there is no `/address`. It does not create intermediate objects.
* **Array indexes shift.** `add` at `/tags/1` inserts before the current element 1; it does not overwrite it. The index may equal the array length, and `-` means "append after the last element".
* **`replace` is not upsert.** Replacing a member that does not exist is an error; use `add` if you mean "set".
* **`move` cannot move a location into one of its own children.**
* **Unknown members are ignored**, so a typo like `"vaule"` on a `test` makes the operation invalid for a missing `value`, not silently pass.

---

## 2. An Example Request

```http
PATCH /v1/orders/ord_8c1f HTTP/1.1
Host: api.example.com
Content-Type: application/json-patch+json
If-Match: "v7"

[
  { "op": "test", "path": "/status", "value": "draft" },
  { "op": "replace", "path": "/shipping/method", "value": "express" },
  { "op": "add", "path": "/items/-", "value": { "sku": "TSHIRT-M", "qty": 1 } },
  { "op": "remove", "path": "/coupon" },
  { "op": "copy", "from": "/billing/address", "path": "/shipping/address" }
]
```

If the order is no longer a draft, the `test` fails and none of the other operations take effect.

---

## 3. The `test` Operation

`test` turns a patch into a conditional update. It compares by JSON value, not by text: numbers are equal if numerically equal, objects are equal if they have the same members regardless of order, and arrays are equal only if their elements match position by position. Strings compare by code point, so there is no case folding.

Use `test` for business preconditions ("only if status is `draft`") and an [`If-Match`](/headers/if-match) [`ETag`](/headers/etag) for "only if nobody else has changed this resource". They solve different problems and work well together: `If-Match` protects the whole representation, `test` asserts the specific facts the patch depends on.

---

## 4. Atomicity and Errors

RFC 6902 says evaluation should stop at the first failing operation and the patch as a whole is then not successful. Combined with RFC 5789, which requires a server to apply a `PATCH` atomically, that means **all or nothing**: a client must never observe a resource with half a patch applied. If your storage cannot do that, apply the patch to an in-memory copy and write the result in one transaction.

RFC 5789 suggests status codes for patch failures:

| Situation | Status |
| --- | --- |
| Body is not a valid JSON Patch document | [`400 Bad Request`](/status-codes/400) |
| Server does not accept `application/json-patch+json` | [`415 Unsupported Media Type`](/status-codes/415), with [`Accept-Patch`](/headers/accept-patch) listing what it does accept |
| Patch is valid but cannot apply to the current state (a path does not exist, a `test` fails) | [`409 Conflict`](/status-codes/409) |
| Patch would produce a resource that fails validation | [`422 Unprocessable Content`](/status-codes/422) |
| `If-Match` precondition fails | [`412 Precondition Failed`](/status-codes/412) |

Report which operation failed. An index into the patch array (`/2` for the third operation) in a [problem details](/specifications/problem-details) extension member tells the client exactly what to fix.

---

## 5. Design Guidance

* **Do not apply patches blindly to your storage model.** A path like `/owner_id` or `/role` is a request to change a field the client may not be allowed to touch. Allowlist patchable paths and authorize each operation, not just the request.
* **Validate the result, not just the patch.** A sequence of individually valid operations can produce an invalid resource. Run your normal schema validation on the patched document before saving it.
* **Cap the size.** Limit the number of operations and the size of `copy` targets; a short patch that copies a large subtree repeatedly is cheap to send and expensive to apply.
* **Advertise support.** Return `Accept-Patch: application/json-patch+json` from [`OPTIONS`](/methods/options) so clients can discover the format without trial and error.
