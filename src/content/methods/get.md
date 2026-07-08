---
name: "GET"
description: "Requests a representation of the specified resource. Requests using GET should only retrieve data."
safe: true
idempotent: true
cacheable: true
relatedCodes: [200, 206, 304, 404]
---

## What is the GET method?

The `GET` method requests a representation of the specified resource. Requests using GET should only retrieve data and should have no other effect on the state of the system.

## API Usage & Best Practices

* **Always safe & idempotent**: GET requests must be read-only. Performing a GET request must never modify database records or trigger state mutations on the server.
* **Support caching**: GET responses are cacheable by default. Leverage caching headers (`ETag`, `Cache-Control`) to reduce backend load.
* **Pagination & Filtering**: Pass query parameters (e.g. `?page=2&limit=50`) in the URL for list filtering, sorting, or pagination.

## Common Response Codes

* **200 OK**: The resource was found and returned in the body.
* **206 Partial Content**: Used when delivering a range segment of a larger file.
* **304 Not Modified**: The client's cached copy is still fresh.
* **404 Not Found**: The requested resource does not exist.
