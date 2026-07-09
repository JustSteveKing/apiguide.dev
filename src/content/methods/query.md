---
name: "QUERY"
description: "A proposed safe, idempotent method for sending a query as a request body, for cases where GET's URI-only constraints are impractical. Still an IETF Internet-Draft — not yet an RFC."
safe: true
idempotent: true
cacheable: true
relatedCodes: [200, 400, 404, 406]
draft: true
---

## What is the QUERY method?

`QUERY` is a proposed HTTP method defined by the IETF HTTPBIS working group draft "The HTTP QUERY Method" (`draft-ietf-httpbis-safe-method-w-body`). It's designed to behave like `GET` — safe, idempotent, cacheable — but with a request body, so a query can carry a large or complex payload (a structured filter, a GraphQL-style query document, a big list of IDs) without cramming it into a URI or query string.

This solves a real, common workaround problem: teams that need a "GET with a body" today either abuse `POST` (losing safety/idempotency/cacheability semantics) or truncate their query into an unwieldy query string. `QUERY` gives that pattern an actual standard to point to.

**This is still a draft.** It has gone through multiple revisions in the IETF process and is not yet an approved RFC. The mechanics described below reflect the current draft text and can still change before final publication. Don't build production API contracts around it yet — treat this as a heads-up on where the spec is heading, not something to ship.

## API Usage & Best Practices

* **Don't use it yet in public API contracts**: Until this reaches RFC status, treat any `QUERY` support as experimental. Client and intermediary (proxy, CDN, gateway) support is inconsistent or absent since the method isn't finalized.
* **Body carries the query, not a mutation**: The request body describes what to retrieve, not a change to make. Semantically this stays a read, same as `GET` — don't repurpose it for writes.
* **Safe and idempotent by design**: Like `GET`, repeating an identical `QUERY` request should never change server state and should always be safe to retry or send multiple times.
* **Cacheable, with caveats**: The draft allows caching similar to `GET`, but since the "identity" of the request now includes the body (not just the URI), caches need body-aware cache keys — most current cache implementations aren't built for that yet.
* **Track the draft, don't freeze on it**: If you're experimenting with this now, watch the IETF HTTPBIS working group's draft history for changes to headers, status code guidance, or method semantics before committing to it anywhere durable.

## Common Response Codes

* **200 OK**: The query was understood and matching results are returned in the response body.
* **400 Bad Request**: The query body is malformed or fails to parse under the negotiated query content type.
* **404 Not Found**: The target resource/endpoint accepting `QUERY` doesn't exist.
* **406 Not Acceptable**: The server can't produce a response matching the client's `Accept` header for the query results.
