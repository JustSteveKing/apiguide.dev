---
name: "Date"
description: "The date and time at which the message was originated, sent as an IMF-fixdate in GMT."
category: "both"
standard: true
relatedCodes: [200, 304]
reference:
  title: "RFC 9110, Section 6.6.1"
  url: https://www.rfc-editor.org/rfc/rfc9110.html#section-6.6.1
updatedDate: 2026-10-14
---

## What is the Date header?

The `Date` header, defined in Section 6.6.1 of [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-date), gives the date and time at which a message was originated. Its value is an HTTP-date, and every sender must generate that in the **IMF-fixdate** format:

```http
Date: Tue, 15 Nov 1994 08:12:31 GMT
```

IMF-fixdate is fixed-length, always UTC, and always written with the literal `GMT`. The day and month names are case-sensitive three-letter English abbreviations, the day is two digits, and there is no extra whitespace. Recipients must also accept two obsolete formats (the RFC 850 format and C's `asctime()`), but nothing may generate them.

An origin server with a clock **must** send `Date` on every `2xx`, `3xx` and `4xx` response, and may send it on `1xx` and `5xx`. An origin without a reliable clock must not send it at all. A cache or proxy with a clock that receives a response without `Date` must add one if it caches or forwards the response.

## API Usage & Best Practices

* **Let your server or framework set it.** Almost every HTTP server emits a correct `Date` automatically. Hand-written `Date` values are where non-compliant formats come from.
* **Never send ISO 8601 in it.** `Date: 2026-10-14T08:12:31Z` is not an HTTP-date, and a strict parser will reject it. ISO 8601 belongs in your JSON bodies; see [timestamps and formats](/guides/timestamps-and-formats). The same rule applies to every header that takes an HTTP-date: [`Last-Modified`](/headers/last-modified), [`Expires`](/headers/expires), [`Retry-After`](/headers/retry-after) and [`Sunset`](/headers/sunset).
* **Keep the clock in sync.** RFC 9110 expects a clock to be synchronized with NTP or similar. Caches use `Date` to calculate the apparent age of a response, together with [`Age`](/headers/age), so a skewed origin clock makes responses look older or younger than they are.
* **Use it to detect client clock skew.** A client that signs requests with a timestamp, or validates token expiry locally, can compare its own clock against the `Date` on a response and correct for the difference rather than failing mysteriously.
* **Do not rely on it for ordering events.** `Date` has one-second resolution and reflects one server's clock. For ordering resources, use version fields or [`ETag`](/headers/etag), not response dates.
* **Clients rarely need to send it.** A user agent may include `Date` in a request, but normally only does so when a scheme specifically asks for it, such as a request-signing protocol that covers the header.

## Examples

A response with a correctly formatted `Date` alongside other HTTP-date fields:

```http
HTTP/1.1 200 OK
Date: Wed, 14 Oct 2026 08:12:31 GMT
Last-Modified: Tue, 13 Oct 2026 17:40:02 GMT
Cache-Control: max-age=300
Content-Type: application/json
```

Formats that are not valid for a sender to generate:

```text
Date: 2026-10-14T08:12:31Z            ISO 8601, not an HTTP-date
Date: Wed, 14 Oct 2026 08:12:31 UTC   must be GMT
Date: wed, 14 oct 2026 08:12:31 GMT   names are case-sensitive
Date: Wed, 14 Oct 2026 8:12:31 GMT    hour must be two digits
```
