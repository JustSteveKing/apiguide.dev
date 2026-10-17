---
title: "OpenAPI Overlay Specification"
description: "The OpenAPI Initiative format for describing repeatable changes to an OpenAPI document: JSONPath targets, update, remove and copy actions, applied in order."
currentVersion: "1.2.0"
officialUrl: "https://spec.openapis.org/overlay/v1.2.0.html"
updatedDate: 2026-10-14
---

## What is the Overlay Specification?

An [OpenAPI](/specifications/openapi) document rarely has one audience. The version generated from your code is not the version you publish: the public docs need better descriptions and examples, the SDK generator needs extension fields, and internal operations need to disappear from the partner portal. Editing the generated file by hand is lost on the next regeneration, and keeping a second copy guarantees the two drift.

The Overlay Specification, published by the OpenAPI Initiative, describes those changes as a separate document: an ordered list of actions, each selecting nodes in the source document with a JSONPath expression and then updating, removing or copying them. The source stays the single truth; the overlay is a reviewable, repeatable patch applied in your build. Version 1.0.0 was released in October 2024, 1.1.0 in January 2026 and 1.2.0 in September 2026.

---

## 1. Document Structure

```yaml
overlay: 1.2.0
info:
  title: Public documentation overlay
  version: 1.0.0
extends: ./openapi.yaml
actions:
  - target: $.info
    description: Replace the generated description
    update:
      description: The Orders API lets you create, track and cancel orders.
  - target: $.paths['/orders'].post
    update:
      x-codegen-method-name: create
  - target: $.paths.*[?@['x-internal'] == true]
    remove: true
```

| Field | Required | Purpose |
| :--- | :--- | :--- |
| `overlay` | Yes | The Overlay Specification version the document uses. |
| `info` | Yes | `title` and `version` of the overlay itself, plus an optional `description`. |
| `extends` | No | A URI reference to the document the overlay is meant for. Relative references are allowed. |
| `actions` | Yes | The ordered list of actions. Must contain at least one. |

`extends` is optional, but set it anyway: it tells a reader, and a tool, which document the JSONPath expressions were written against.

---

## 2. Targets: JSONPath per RFC 9535

Every action has a `target`, a JSONPath query that selects zero or more nodes. The specification requires tools to implement [RFC 9535](https://www.rfc-editor.org/rfc/rfc9535), the IETF JSONPath standard, in full, and interoperable overlays must not use tool-specific extensions.

That requirement matters more than it looks. JSONPath existed for years as a loosely specified convention, and implementations disagreed on filters, quoting and wildcard behavior. An overlay written against one tool's dialect can select different nodes in another. Stick to RFC 9535 syntax, and test overlays with the tool your pipeline actually runs.

A target that selects no nodes is not an error: the action succeeds and changes nothing. This is the most common silent failure in an overlay pipeline. A path is renamed in the source, the JSONPath stops matching, and the internal endpoint you were removing ships to the public docs. Add a check in CI that diffs the output, or asserts on it, rather than trusting a clean exit.

---

## 3. Actions: update, remove and copy

Actions are applied **in sequence**, each to the result of the previous one, so order is significant: an `update` that targets a node an earlier action removed selects nothing.

### update

The value is merged into each selected node:

| Target is | Effect |
| :--- | :--- |
| An object | Merged recursively. Properties only in the target are kept, new ones are inserted, primitives replace primitives, arrays concatenate. |
| An array | An array value is concatenated; any other value is appended as one item. |
| A primitive | Replaced. |

To delete a property, use a separate `remove` action targeting it rather than trying to express the deletion inside an `update`.

### remove

`remove: true` deletes each selected node from its parent object or array. When `remove` is true, `update` has no effect.

### copy

Added in 1.1.0. `copy` is a JSONPath expression selecting a single node, whose value is merged into the target using the same rules as `update`. It is how you duplicate a path item, a parameter set or an example without restating it.

---

## 4. Reusable Actions in 1.2.0

Version 1.2.0 adds a `components` object holding reusable actions under `components.actions`, and a reference form that applies one to a new target:

```yaml
overlay: 1.2.0
info:
  title: Shared error responses
  version: 1.0.0
components:
  actions:
    errorResponse:
      description: Adds a 404 response to an operation
      update:
        '404':
          description: Not found
actions:
  - $ref: '#/components/actions/errorResponse'
    target: $.paths['/orders/{orderId}'].get.responses
  - $ref: '#/components/actions/errorResponse'
    target: $.paths['/orders/{orderId}'].delete.responses
```

It also adds `$self`, which gives the overlay its own URI and base URI for resolving relative references. Check that your tooling supports 1.2.0 before using either; a tool that only knows 1.0.0 will not understand `copy`, components or references.

---

## Best Practices

* Keep overlays small and single-purpose (one for documentation copy, one for SDK hints, one for audience filtering) and apply them in a fixed order in the build.
* Mark operations in the source with an extension such as `x-internal` and remove them by filter, rather than listing each path in the overlay. New internal endpoints are then excluded without anyone remembering to add them.
* Lint the output, not just the source. An overlay can produce a document that no longer validates, and nothing in the format prevents it.
