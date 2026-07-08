---
title: "HTTP Caching & Conditional Requests"
description: "A developer guide on HTTP caching headers (Cache-Control, ETag) and conditional requests (If-Match, If-None-Match)."
category: "caching"
---

## Introduction to HTTP Caching

HTTP caching is one of the most powerful mechanisms available to optimize web APIs. By caching responses on the client, mobile application, or intermediary CDN (Content Delivery Network) nodes, you can dramatically reduce API latency, conserve network bandwidth, and lower server load.

---

## 1. Freshness Controls (`Cache-Control`)

The `Cache-Control` header specifies caching directives that must be obeyed by all caches along the request/response chain.

### Key Directives:
* **`no-store`**: Under no circumstances should the response be cached. Enforce this on all mutating or sensitive user endpoints (GET credentials, transactions).
* **`no-cache`**: The response can be cached, but the cache *must* validate the freshness with the server (using conditional request headers) before serving it.
* **`private`**: The response can only be cached by browser caches, not by public shared caches (like CDNs).
* **`public`**: The response can be cached by any cache, including CDNs.
* **`max-age=<seconds>`**: The maximum amount of time a resource is considered fresh.

---

## 2. Validation & Conditional Requests

When a cache stores a response, it eventually needs to check if that copy is still valid. This is called validation, and it relies on two server-generated metadata markers:

### Etags (Entity Tags)
An `ETag` is a unique string hash representing the current version of the resource. If the resource changes, the ETag changes.

### Last-Modified
A timestamp indicating the last time the resource was modified.

---

## 3. Conditional Headers

A client makes a conditional request by sending specific headers containing the ETag or timestamp they previously saved:

### Read Operations (GET Validation)
1. The client requests a resource and receives `ETag: "abc1234"`.
2. Later, the client requests the resource again and sends `If-None-Match: "abc1234"`.
3. If the resource has not changed, the server responds with **`304 Not Modified`** and no body, saving bandwidth.

### Write Operations (Concurrency Check)
1. The client reads a resource and receives `ETag: "version_5"`.
2. The client prepares a PUT update. To prevent overwriting concurrent updates, they send **`If-Match: "version_5"`**.
3. If the resource ETag on the server is still `"version_5"`, the update succeeds.
4. If another process updated the resource first (updating its ETag to `"version_6"`), the check fails. The server aborts the update and returns **`412 Precondition Failed`** (or `409 Conflict`).
