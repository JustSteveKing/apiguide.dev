---
title: "PATCH Strategies: JSON Patch vs Merge Patch"
description: "Comparing JSON Patch and JSON Merge Patch for partial resource updates, including null semantics and media types."
category: "core"
---

## Introduction to PATCH Strategies

HTTP APIs often need to update only part of a resource rather than replacing the whole entity. The [`PATCH`](/methods/patch) method exists for exactly this, but sending an arbitrary partial JSON object is ambiguous and can silently overwrite fields. Two IETF standards remove that ambiguity: **JSON Patch (RFC 6902)** and **JSON Merge Patch (RFC 7386)**. Both describe partial updates, but they differ fundamentally in structure, granularity, and how they treat `null`. Choosing between them comes down to how complex your changes are and how much control you need.

Servers advertise which formats they accept using the `Accept-Patch` response header, typically in an `OPTIONS` response.

---

## 1. JSON Patch (RFC 6902)

JSON Patch is an **operation-based** format. The request body is an **ordered array of operations**, each applied in sequence to the target document.

* **Media type**: `application/json-patch+json`
* **Paths**: identified with JSON Pointer syntax (RFC 6901), e.g. `/name` or `/tags/0`.
* **Atomicity**: operations are applied all-or-nothing. If any operation fails, the server applies none of them.

### Operations

| `op` | Purpose |
| --- | --- |
| `add` | Insert a value at a path; append to an array with `/-` |
| `remove` | Delete the value at a path |
| `replace` | Substitute the value at a path (equivalent to `remove` then `add`) |
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

## 2. JSON Merge Patch (RFC 7386)

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

If your domain treats `null` as a meaningful value distinct from "absent," JSON Patch is the safer choice. Some Merge Patch implementations work around the ambiguity with wrapper types (for example an `Optional<T>` struct) to distinguish "explicitly set to null" from "not present in the patch."

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

Apply patches with **optimistic concurrency control**. Have clients send a strong `ETag` in an `If-Match` header so the request fails if the resource changed since it was last read. The JSON Patch `test` operation complements this. A failed precondition returns `412 Precondition Failed`; a detected conflict without a precondition can return `409 Conflict`.

### Validation and security

JSON Patch is powerful, and that power carries risk. `copy` and deeply nested operations can be abused for denial of service. Whitelist patchable paths, run authorization checks, and cap both request body size and operation count. Implementations generally do not mitigate these risks for you.

### Error handling

| Status | When |
| --- | --- |
| `400 Bad Request` | Malformed patch document |
| `409 Conflict` | Business-rule conflict |
| `412 Precondition Failed` | `If-Match` precondition failed |
| `415 Unsupported Media Type` | Server does not support the patch format sent |
| `422 Unprocessable Entity` | Patch is well-formed but semantically invalid |

### Common mistakes

* **Ignoring concurrency**: patching without `If-Match` risks lost updates when clients edit concurrently.
* **Treating PATCH like [PUT](/methods/put)**: deserializing a partial body as a full resource can null out omitted fields.
* **Misreading Merge Patch arrays**: forgetting that arrays are replaced wholesale leads to accidental data loss.

Both formats are solid, standardized tools. Merge Patch wins on simplicity for object-only updates where `null` means delete; JSON Patch wins on precision, array control, and conditional updates.
