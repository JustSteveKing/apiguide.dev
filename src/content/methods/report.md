---
name: "REPORT"
description: "Requests a named, parameterized report about a resource, in WebDAV; the read used by CalDAV and CardDAV to query calendars and address books."
safe: true
idempotent: true
cacheable: false
relatedCodes: [200, 207, 403]
reference:
  title: "RFC 3253, Section 3.6"
  url: https://www.rfc-editor.org/rfc/rfc3253.html#section-3.6
updatedDate: 2026-10-14
---

## What is the REPORT method?

The `REPORT` method is a WebDAV extension, defined in RFC 3253 Section 3.6 (Versioning Extensions to WebDAV), for obtaining information about a resource that depends on parameters in the request. The XML request body names which report is wanted and supplies its arguments, and the response body carries the result. RFC 3253 requires that a `REPORT` not change the content or dead properties of any resource, and the IANA HTTP Method Registry lists it as safe and idempotent.

It was introduced for version history, but its lasting use is calendaring and contacts. CalDAV (RFC 4791) defines the `calendar-query`, `calendar-multiget` and `free-busy-query` reports, CardDAV (RFC 6352) defines `addressbook-query` and `addressbook-multiget`, and RFC 6578 adds `sync-collection` for incremental sync. If you are building or integrating a CalDAV or CardDAV server, you will implement `REPORT`.

## API Usage & Best Practices

* **Do not adopt it for a general API**: `REPORT` only makes sense inside the WebDAV model of XML bodies, properties and `207` multistatus responses. For a JSON API that needs a read with a structured body, look at [`QUERY`](/methods/query), standardized in RFC 10008 as the general-purpose safe, idempotent method with a body, or use [`GET`](/methods/get) with query parameters, or [`POST`](/methods/post) to a search resource if neither fits. The WebDAV relatives [`PROPFIND`](/methods/propfind) and [`SEARCH`](/methods/search) have the same limitation.
* **Advertise what you support**: A resource lists the reports it implements in the `DAV:supported-report-set` property. Requesting a report the resource does not support fails the `DAV:supported-report` precondition.
* **Control the scope with Depth**: The request MAY include a `Depth` header; with none, `Depth: 0` is assumed. If `Depth` is present, the response MUST be a [`207 Multi-Status`](/status-codes/207), with the report applied separately to the collection and each member in scope.
* **Treat it as read-only, but not cacheable**: Clients can retry a `REPORT` freely, since it is safe and idempotent. Nothing defines it as cacheable, so shared caches will not store it; CalDAV and CardDAV clients use `sync-collection` tokens and [`ETag`](/headers/etag) values to avoid refetching instead.
* **Use `Prefer: return=minimal` for large result sets**: RFC 8144 lets a client ask the server to omit `404` property entries from `207` responses to `REPORT` types such as `calendar-query` and `sync-collection`, which shrinks responses that ask for many properties.

## Common Response Codes

* **207 Multi-Status**: The usual success response, carrying per-resource results in a `DAV:multistatus` XML body. Required whenever the request has a `Depth` header.
* **200 OK**: The requested report is returned directly, for a report on a single resource that does not use a multistatus body.
* **403 Forbidden**: A precondition such as `DAV:supported-report` failed and retrying will not help. RFC 3253 returns failed preconditions as `403`, or [`409 Conflict`](/status-codes/409) when the client can fix the problem and retry, with a `DAV:error` body naming the condition.
