---
title: "JSON Merge Patch (RFC 7396)"
description: "A reference for JSON Merge Patch, the document-shaped format for partial updates with PATCH, covering the merge algorithm, null-as-delete semantics, array replacement, and when the format is the wrong choice."
currentVersion: "RFC 7396"
officialUrl: "https://www.rfc-editor.org/rfc/rfc7396.html"
---

## What is JSON Merge Patch?

JSON Merge Patch describes a change to a JSON document by sending a document that looks like the target: the members you include are set, the members you set to `null` are removed, and everything you leave out is untouched. It is the format most developers reach for by instinct when they write a [`PATCH`](/methods/patch) handler, and RFC 7396 pins down the rules so client and server agree on them.

```http
Content-Type: application/merge-patch+json
```

RFC 7396 obsoletes RFC 7386, which defined the same format. Its alternative is [JSON Patch](/specifications/json-patch), an explicit list of operations; [PATCH Strategies](/guides/patch-strategies) compares the two.

---

## 1. The Merge Algorithm

The whole specification fits in a short recursive function. In outline:

```text
merge(target, patch):
  if patch is not an object:
    return patch                      # scalars and arrays replace outright
  if target is not an object:
    target = {}                       # an object patch onto a non-object starts empty
  for each (name, value) in patch:
    if value is null:
      delete target[name]             # no error if it was absent
    else:
      target[name] = merge(target[name], value)
  return target
```

Read off its consequences:

* **Objects merge recursively.** A nested object in the patch is merged into the matching nested object in the target.
* **`null` deletes.** A member set to `null` is removed from the target. Removing a member that does not exist is not an error.
* **Everything else replaces.** Strings, numbers, booleans and **arrays** in the patch replace the target value outright.
* **A non-object patch replaces the whole document.** Sending `[]` or `"x"` as the patch body is a full replacement, not a merge.

---

## 2. An Example

Given this resource:

```json
{
  "name": "Ada Lovelace",
  "contact": { "email": "ada@example.com", "phone": "+44 20 7946 0000" },
  "roles": ["viewer", "editor"],
  "timezone": "Europe/London"
}
```

This request:

```http
PATCH /v1/users/42 HTTP/1.1
Host: api.example.com
Content-Type: application/merge-patch+json

{
  "name": "Ada King",
  "contact": { "phone": null },
  "roles": ["viewer"],
  "locale": "en-GB"
}
```

Produces:

```json
{
  "name": "Ada King",
  "contact": { "email": "ada@example.com" },
  "roles": ["viewer"],
  "timezone": "Europe/London",
  "locale": "en-GB"
}
```

`name` is replaced, `locale` is added, `contact.phone` is removed while `contact.email` survives, `roles` loses `"editor"` because the whole array was replaced, and `timezone` is untouched.

---

## 3. The Limits

Merge Patch buys its simplicity with three things it cannot express:

| You want to | Merge Patch | Why |
| --- | --- | --- |
| Set a member to `null` | Not possible | `null` in a patch always means "remove" |
| Change one element of an array | Not possible | Arrays are replaced whole; send the full new array |
| Make the update conditional on a current value | Not possible | There is no equivalent of JSON Patch's `test`; use [`If-Match`](/headers/if-match) |

The `null` limitation is the one that bites. If your API distinguishes "explicitly null" from "absent" (a `middleName` known to be empty versus one never collected), a Merge Patch client has no way to write the explicit `null`. Either model "no value" as absence throughout the API, or use JSON Patch for that resource.

Array replacement creates lost updates. Two clients that each append a tag by sending the array they last read will overwrite each other. Require an [`ETag`](/headers/etag) and `If-Match` on any resource with arrays that clients edit, and return [`412 Precondition Failed`](/status-codes/412) when it no longer matches.

---

## 4. Implementation Notes

* **Every JSON value is a valid patch.** RFC 7396 defines no errors of its own, so failures come from your own rules: a field the client may not change, or a result that fails validation. Return [`422 Unprocessable Content`](/status-codes/422) with a [problem details](/specifications/problem-details) body naming the field, and [`415 Unsupported Media Type`](/status-codes/415) for a body sent as plain `application/json` if you only accept the merge patch type.
* **Do not deserialize the patch into your resource model.** Most languages cannot tell "field absent" from "field null" once the JSON is bound to a typed object, which turns every omitted field into a delete. Work on the parsed JSON tree, or use a type that preserves the three states.
* **Validate after merging.** Apply the patch to the current representation, then run the same schema validation you use for [`PUT`](/methods/put).
* **Advertise it.** `Accept-Patch: application/merge-patch+json` tells clients which formats a resource takes; see [`Accept-Patch`](/headers/accept-patch).

Merge Patch is the right default for resources that are mostly flat objects of scalar fields. Reach for JSON Patch as soon as clients need to edit arrays element by element or set values to `null`.
