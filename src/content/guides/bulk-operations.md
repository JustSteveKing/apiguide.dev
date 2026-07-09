---
title: "Bulk & Batch Operations"
description: "How to design batch endpoints, handle partial success, and process bulk writes idempotently and asynchronously."
category: "core"
---

## Introduction to Bulk Operations

A bulk (or batch) endpoint accepts multiple operations in a single request — creating, updating, or deleting many resources at once — rather than requiring the client to issue one HTTP request per item. As integrations scale to syncing thousands of records, per-item requests stop being a reasonable default and a dedicated batch API becomes necessary.

---

## 1. Batch Endpoint Design

A typical batch endpoint accepts an array of operations in the request body and returns an array of results, preserving order so the client can match each result back to its corresponding input item:

```http
POST /v1/contacts/bulk
Content-Type: application/json

{
  "operations": [
    { "method": "create", "data": { "email": "a@example.com" } },
    { "method": "update", "id": "c_123", "data": { "email": "b@example.com" } },
    { "method": "create", "data": { "email": "invalid-email" } }
  ]
}
```

Keep the shape of each item consistent with the single-resource endpoints it corresponds to, so clients can largely reuse the validation and serialization logic they've already written for one-at-a-time calls.

---

## 2. Bulk vs. N Individual Requests

Batching isn't free — it trades one set of costs for another, so it's worth being deliberate about when to reach for it:

* **Network overhead**: N individual requests each pay a full round trip of TCP/TLS negotiation and HTTP overhead; a single batch call pays that cost once no matter how many items it carries.
* **Atomicity expectations**: Individual requests are naturally independent — one client's failure has no bearing on another's. A batch request needs an explicit policy for what happens when item 3 of 10 fails: does the whole batch roll back, or do the other 9 still commit? Most bulk APIs choose partial success (see below) specifically to avoid this ambiguity.
* **Rate limiting and quotas**: A single batch endpoint counting as "one request" against a rate limit lets clients accomplish far more within the same quota than would be possible one item at a time — a real reason to prefer bulk endpoints for high-volume sync jobs.
* **Debuggability**: A failure in one of a thousand individual requests is easy to isolate from server logs and status codes alone; a failure buried inside item 742 of a single batch call requires the response body itself to carry enough detail to pinpoint it, since the request itself won't tell you which item failed.
* **Latency for the caller**: A large synchronous batch can take much longer to return than a single item would, which pushes larger batch jobs toward the asynchronous pattern described below rather than blocking the client's connection for the entire duration.

---

## 3. Partial Success & Multi-Status Responses

Because a batch contains independent operations, one item failing validation shouldn't necessarily fail the other nine. The standard approach is a partial success response: return an overall success indicator alongside a per-item result that mirrors the order of the request.

```http
HTTP/1.1 207 Multi-Status
Content-Type: application/json

{
  "results": [
    { "status": 201, "id": "c_456" },
    { "status": 200, "id": "c_123" },
    { "status": 422, "error": { "code": "invalid_email", "field": "email" } }
  ]
}
```

[`207 Multi-Status`](/status-codes/207) is the most semantically precise status code for this shape of response — it exists specifically to signal that the body contains several independent outcomes rather than one. That said, many production APIs pragmatically return a plain `200 OK` with the same per-item body instead, on the reasoning that many HTTP clients and monitoring tools don't have special handling for 207 and would otherwise treat it as an unexpected status. Either choice is defensible; what matters is that the response body always makes per-item success or failure explicit and never forces the client to infer it from a single top-level status code.

---

## 4. Idempotency for Bulk Writes

Bulk writes are exposed to the same retry hazards as single writes — a client that times out waiting for a large batch to finish has no way to know whether the server actually processed some, all, or none of the items, and a naive retry risks creating duplicates for whichever items did succeed. The [Idempotency guide](/guides/idempotency) covers the general mechanism; for bulk endpoints it applies at two levels:

* **Request-level idempotency key**: A single `Idempotency-Key` header covering the entire batch, so retrying the whole request after a timeout replays the cached per-item results rather than re-executing anything.
* **Per-item idempotency keys**: For batches assembled from independent sources (e.g. syncing records from another system), letting the client attach an idempotency key to each item individually gives finer-grained protection — a retry of the batch can safely skip items that already succeeded and only reprocess the ones that didn't, rather than being all-or-nothing at the batch level.

---

## 5. Asynchronous Bulk Jobs

Once a batch grows large enough that processing it would hold an HTTP connection open for an uncomfortable length of time, switch from a synchronous response to a queued job:

1. **Submit the batch**: The client posts the batch as usual, but instead of processing inline, the server enqueues it and immediately responds [`202 Accepted`](/status-codes/202) along with a [`Location`](/headers/location) header pointing to a status resource.
   ```http
   HTTP/1.1 202 Accepted
   Location: https://api.example.com/v1/bulk-jobs/job_789
   ```
2. **Poll for status**: The client (or a webhook, if the API supports one) checks the job resource until it reports completion.
   ```http
   GET /v1/bulk-jobs/job_789

   HTTP/1.1 200 OK
   {
     "status": "processing",
     "total": 10000,
     "completed": 4213,
     "failed": 12
   }
   ```
3. **Retrieve results**: Once the job resource reports `status: "completed"`, its body (or a linked results URL for very large batches) contains the same per-item success/failure detail as a synchronous batch response would.

This pattern trades immediacy for scale: the client gives up getting an answer in the same request, but the server is freed from holding a connection open for a job that might take minutes rather than milliseconds.
