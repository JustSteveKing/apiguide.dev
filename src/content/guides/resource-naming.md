---
title: "Resource Naming & URI Design"
description: "Conventions for naming resources and designing clean URIs: nouns over verbs, plural collections, sensible nesting, kebab-case, and path versus query parameters."
category: "core"
---

## Introduction to URI Design

URIs are the public contract of your API. They are the first thing developers read and the hardest thing to change once clients depend on them. A consistent, predictable naming scheme makes an API feel intuitive; an inconsistent one forces developers back to the documentation for every call.

The goal is a scheme so regular that developers can guess the next endpoint correctly.

---

## 1. Nouns, Not Verbs

A URI names a *resource*, not an action. The HTTP method already supplies the verb. Let the two work together.

```http
GET    /orders          # list orders
POST   /orders          # create an order
GET    /orders/42       # fetch order 42
DELETE /orders/42       # delete order 42
```

Avoid verb-based paths like `/getOrders`, `/createOrder`, or `/orders/42/delete`. These duplicate what the method already conveys and multiply the surface area of your API.

For genuine actions that do not map to CRUD (for example, "publish" or "cancel"), a controller-style sub-resource is an accepted pragmatic exception: `POST /orders/42/cancel`.

---

## 2. Plural Collection Names

Use plural nouns for collections and append an identifier for a single item. This keeps the mental model consistent: a collection contains items.

```http
GET /users          # the collection
GET /users/7        # one member of the collection
```

Pick plural or singular and never mix them. `/user/7` and `/orders` in the same API is exactly the kind of inconsistency that erodes trust.

---

## 3. Nesting & Depth

Nest resources to express containment, but stop at one level of nesting. Deep hierarchies are brittle and verbose.

```http
GET /users/7/orders        # good: orders belonging to user 7
GET /users/7/orders/42/items/9/tax   # too deep
```

Once a resource has its own identifier, address it directly instead of nesting further:

```http
GET /orders/42/items    # fine
GET /items/9            # prefer this over /users/7/orders/42/items/9
```

---

## 4. Casing & Formatting

Use lowercase **kebab-case** for multi-word path segments. It reads well and avoids case-sensitivity surprises across systems.

| Style | Example | Verdict |
| --- | --- | --- |
| kebab-case | `/shipping-addresses` | Preferred |
| snake_case | `/shipping_addresses` | Avoid in paths |
| camelCase | `/shippingAddresses` | Avoid in paths |

Do not include file extensions (`.json`) or trailing slashes. Use [content negotiation](/guides/content-negotiation) via the `Accept` header instead of extensions.

---

## 5. Path vs Query Parameters

Use **path parameters** to identify a specific resource. Use **query parameters** to filter, sort, or paginate a collection.

```http
GET /orders/42                       # path: identifies one order
GET /orders?status=shipped&sort=-created_at   # query: filters the collection
```

If removing the parameter would still leave a valid, meaningful resource, it belongs in the query string. See [filtering, sorting & searching](/guides/filtering-sorting-searching) for conventions.

---

## 6. Versioning in the Path

The most common and operationally simple approach is a version prefix in the path.

```http
GET /v1/orders
GET /v2/orders
```

This makes the version obvious in logs, proxies, and browser testing. Header-based versioning is more "pure" but harder to debug. Whichever you choose, be consistent and document it. See the [versioning guide](/guides/versioning) for the full trade-offs.

---

## 7. Consistency Above All

The single most valuable property of a URI scheme is internal consistency. If IDs are UUIDs in one place, they should be UUIDs everywhere. If timestamps are query-filterable on one collection, developers will expect the same on the next. Write the rules down and enforce them in review.
