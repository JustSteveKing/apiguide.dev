---
title: "Pagination Patterns (Offset vs. Cursor)"
description: "Detailed guide comparing offset and cursor pagination, detailing how to implement cursors and hypermedia headers."
category: "caching"
---

## Introduction to Pagination

Web APIs serving large datasets must paginate their responses. Returning thousands of database records in a single response bloats network transfer, exhausts server memory, and degrades database query performance.

---

## 1. Offset-Limit Pagination

The simplest pagination model, utilizing SQL-like parameters to skip records.
* **Parameters**: `?limit=50&offset=150` (or `?page=4`).
* **Underlying Query**: `SELECT * FROM leads ORDER BY created_at DESC LIMIT 50 OFFSET 150;`

### Pros:
* Extremely easy to implement.
* Allows clients to jump directly to arbitrary pages (e.g. Page 12).

### Cons:
* **Performance degradation**: Database servers must read and discard all rows up to the offset value. At offsets in the millions, queries become extremely slow.
* **Drift / Duplicates**: If records are created or deleted while a client is browsing, items will shift between pages, causing the client to see duplicate items or skip items entirely.

---

## 2. Keyset / Cursor-Based Pagination

Instead of offset skips, cursor pagination tracks a specific pointer (usually the encoded ID or timestamp of the last item in the page) and queries relative to that pointer.
* **Parameters**: `?limit=50&cursor=eyJpZCI6MTI1LCJjcmVhdGVkX2F0IjoxNzIwNDQ5NjAwfQ==` (base64 encoded JSON).
* **Underlying Query**: `SELECT * FROM leads WHERE created_at < '2026-07-07 10:00:00' ORDER BY created_at DESC LIMIT 50;`

### Pros:
* **O(1) Performance**: Uses indexes directly without scanning discarded rows, making it fast even on billions of rows.
* **Consistent Window**: Prevents record drift. If items are created or deleted, the cursor pointer remains anchored, ensuring no duplicates or skipped rows.

### Cons:
* Does not support jumping to arbitrary pages; clients can only page forward (`next`) or backward (`prev`).

---

## 3. Serialization via Link Headers

Avoid packing pagination links in your JSON payload envelope. Use the standard `Link` header to convey traversal options to clients:

```http
HTTP/1.1 200 OK
Link: <https://api.apiguide.dev/v1/leads?cursor=abc>; rel="next",
      <https://api.apiguide.dev/v1/leads?cursor=xyz>; rel="prev"
```
