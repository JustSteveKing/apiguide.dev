---
title: "PATCH Strategies: JSON Patch vs Merge Patch"
description: "Comparing JSON Patch and JSON Merge Patch for partial resource updates, including null semantics and media types."
category: "design"
updatedDate: 2026-10-14
---

## Introduction to PATCH Strategies

HTTP APIs often need to update only part of a resource rather than replacing the whole entity. The [`PATCH`](/methods/patch) method exists for exactly this, but sending an arbitrary partial JSON object is ambiguous and can silently overwrite fields. Two IETF standards remove that ambiguity: **[JSON Patch](/specifications/json-patch) (RFC 6902)** and **[JSON Merge Patch](/specifications/json-merge-patch) (RFC 7396)**. Both describe partial updates, but they differ fundamentally in structure, granularity, and how they treat `null`. Choosing between them comes down to how complex your changes are and how much control you need.

Servers advertise which formats they accept using the [`Accept-Patch`](/headers/accept-patch) response header, typically in an [`OPTIONS`](/methods/options) response.

Whichever format you choose, RFC 5789 requires the server to apply the entire patch atomically: if any part of it cannot be applied, none of it is, and no client ever sees a partially modified representation. That is a property of `PATCH` itself, not of either format.

---

## 1. JSON Patch (RFC 6902)

JSON Patch is an **operation-based** format. The request body is an **ordered array of operations**, each applied in sequence to the target document.

* **Media type**: `application/json-patch+json`
* **Paths**: identified with [JSON Pointer](/specifications/json-pointer) syntax (RFC 6901), e.g. `/name` or `/tags/0`.
* **Failure**: RFC 6902 says evaluation stops at the first failing operation and the patch as a whole is not successful; combined with RFC 5789's atomicity rule, the server applies none of the operations.

### Operations

| `op` | Purpose |
| --- | --- |
| `add` | Insert a value at a path; append to an array with `/-` |
| `remove` | Delete the value at a path |
| `replace` | Substitute the value at a path; the target must already exist (equivalent to `remove` then `add`) |
| `move` | Relocate a value from `from` to `path` |
| `copy` | Duplicate a value from `from` to `path` |
| `test` | Assert a value equals an expected value; abort the patch if not |

### Example

```http
PATCH /v1/users/42 HTTP/1.1
Host: api.apiguide.dev
Content-Type: application/json-patch+json

[
  { "op": "test", "path": "/version", "value": 7 },
  { "op": "replace", "path": "/email", "value": "new@example.com" },
  { "op": "add", "path": "/roles/-", "value": "editor" },
  { "op": "remove", "path": "/nickname" }
]
```

The `test` operation makes JSON Patch well suited to conditional updates: if `/version` no longer equals `7`, the entire patch is rejected before any change is made.

---

## 2. JSON Merge Patch (RFC 7396)

JSON Merge Patch is a **state-based** format. Instead of a list of operations, the body is a partial JSON object describing the desired end state.

* **Media type**: `application/merge-patch+json`
* The server merges the patch into the target recursively.

### Merge rules

* A field with a **non-`null` value** replaces the target field's value.
* A field set to **`null`** **removes** that field from the target.
* A field **omitted** from the patch is left unchanged.
* Nested objects merge recursively.
* Any **array** in the patch **replaces** the target array entirely; there is no per-element merging.

### Example

```http
PATCH /v1/users/42 HTTP/1.1
Host: api.apiguide.dev
Content-Type: application/merge-patch+json

{
  "email": "new@example.com",
  "nickname": null,
  "profile": { "bio": "Updated bio" },
  "tags": ["a", "b"]
}
```

Here `email` and `profile.bio` are updated, `nickname` is deleted, and `tags` is fully replaced with the two-element array.

---

## 3. Null Semantics: The Critical Difference

The handling of `null` is the sharpest distinction between the two formats.

* In **Merge Patch**, `null` always means "delete this field." As a consequence, you **cannot set a field's value to `null`** with Merge Patch.
* In **JSON Patch**, `add` and `replace` can explicitly set a field to `null`, because deletion is a separate `remove` operation.

If your domain treats `null` as a meaningful value distinct from "absent," JSON Patch is the safer choice. Server code often deserializes Merge Patch bodies into wrapper types (for example an `Optional<T>` struct) so it can tell "field sent as `null`" from "field not present". That distinguishes delete from leave-unchanged, which naive deserialization into a plain struct loses, but it does not add a third meaning: under RFC 7396 a `null` in the patch still means remove, so Merge Patch still cannot set a field to `null`.

---

## 4. Choosing Between Them

| Consideration | JSON Patch | Merge Patch |
| --- | --- | --- |
| Format | Ordered operations | Partial document |
| Array element edits | Yes | No (full replace only) |
| Conditional updates (`test`) | Yes | No |
| Set a field to `null` | Yes | No (`null` deletes) |
| Client simplicity | Lower | Higher |

* **Use Merge Patch** for simple, object-centric updates where clients modify a local copy of the resource and full array replacement is acceptable.
* **Use JSON Patch** when you need fine-grained array manipulation, preconditions via `test`, auditable change instructions, or the ability to set fields to `null`.

---

## 5. Best Practices and Pitfalls

### Concurrency

Apply patches with **optimistic concurrency control**. Have clients send a strong [`ETag`](/headers/etag) in an [`If-Match`](/headers/if-match) header so the request fails if the resource changed since it was last read. The JSON Patch `test` operation complements this. A failed precondition returns [`412 Precondition Failed`](/status-codes/412); a detected conflict without a precondition can return [`409 Conflict`](/status-codes/409).

### Validation and security

JSON Patch is powerful, and that power carries risk. `copy` and deeply nested operations can be abused for denial of service. Allowlist patchable paths, run authorization checks, and cap both request body size and operation count. Implementations generally do not mitigate these risks for you.

### Error handling

| Status | When |
| --- | --- |
| [`400 Bad Request`](/status-codes/400) | Malformed patch document |
| [`404 Not Found`](/status-codes/404) | The resource being patched does not exist |
| [`409 Conflict`](/status-codes/409) | The patch cannot be applied to the resource's current state: a failed `test`, a `replace` or `remove` whose path does not exist, or a concurrent modification |
| [`412 Precondition Failed`](/status-codes/412) | `If-Match` precondition failed |
| [`415 Unsupported Media Type`](/status-codes/415) | Server does not support the patch format sent; include `Accept-Patch` in the response |
| [`422 Unprocessable Content`](/status-codes/422) | Patch is well-formed but applying it would leave the resource invalid |

These follow RFC 5789 Section 2.2, which RFC 6902 points to for error handling. Its "conflicting state" case is the one where structures the patch assumes to exist do not, which is exactly a missing path or a failed `test`, so prefer `409` there and keep `422` for patches that apply cleanly but produce a resource your validation rejects.

### Common mistakes

* **Ignoring concurrency**: patching without `If-Match` risks lost updates when clients edit concurrently.
* **Treating PATCH like [PUT](/methods/put)**: deserializing a partial body as a full resource can null out omitted fields.
* **Misreading Merge Patch arrays**: forgetting that arrays are replaced wholesale leads to accidental data loss.

Both formats are solid, standardized tools. Merge Patch wins on simplicity for object-only updates where `null` means delete; JSON Patch wins on precision, array control, and conditional updates.
