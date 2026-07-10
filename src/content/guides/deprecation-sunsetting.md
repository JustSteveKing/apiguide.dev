---
title: "API Deprecation & Sunsetting"
description: "Signaling API retirement with the Deprecation (RFC 9745) and Sunset (RFC 8594) headers, Link relations, and migration timelines."
category: "core"
---

## Introduction to Deprecation and Sunsetting

Every API changes over time, and retiring endpoints or versions is unavoidable. Doing it well preserves consumer trust; doing it badly breaks client applications without warning. Effective deprecation pairs **machine-readable signals** — standardized HTTP headers — with **human communication** through changelogs, email, and documentation, all on a predictable timeline. This guide covers the headers, the timelines, and the final removal.

---

## 1. The Deprecation Header (RFC 9745)

The `Deprecation` response header tells clients that a resource is or will be deprecated. Its value is a Structured Field Date (RFC 9651), expressed as a Unix timestamp prefixed with `@`.

```http
HTTP/1.1 200 OK
Deprecation: @1735689600
```

Here `@1735689600` corresponds to 2025-01-01 00:00:00 UTC. The date may be in the future (an early warning of upcoming deprecation) or in the past (deprecation already in effect). Crucially, a deprecated resource **still functions normally** — the header is a signal, not an error. See [`Deprecation`](/headers/deprecation) for the header reference.

---

## 2. The Sunset Header (RFC 8594)

Once a resource is on its way out, the `Sunset` header (published May 2019) announces the point in time when the URI is expected to become unresponsive. Its value is an **HTTP-date** in IMF-fixdate format.

```http
HTTP/1.1 200 OK
Deprecation: @1735689600
Sunset: Wed, 31 Dec 2025 23:59:59 GMT
```

Two rules matter:

* The `Sunset` timestamp **must not be earlier** than the `Deprecation` date — the progression is always warning first, removal later.
* The two headers use different date formats (Structured Field Date vs. HTTP-date) for historical reasons; this is expected.

`Sunset` should be treated as a hint about a resource's planned retirement. See the [`Sunset`](/headers/sunset) reference for details.

---

## 3. The Link Header for Documentation

Concise header values cannot explain *why* or *how to migrate*. Pair them with a `Link` header using `rel="deprecation"` pointing to human-readable documentation:

```http
Deprecation: @1735689600
Sunset: Sun, 27 Sep 2026 00:00:00 GMT
Link: <https://developer.apiguide.dev/deprecation>; rel="deprecation"; type="text/html"
```

You can add a second `Link` with `rel="successor-version"` to point at the replacement endpoint. One real-world caution: keep these links maintained — a `rel="deprecation"` URL that 404s leaves consumers unable to find migration details, which defeats the purpose.

---

## 4. Migration Timelines

How much notice to give depends on the scope of the change. Longer is safer, especially for public APIs with unknown consumers.

| Change type | Minimum notice | Recommended |
| --- | --- | --- |
| Minor field removal | 3 months | 6 months |
| Endpoint removal | 6 months | 12 months |
| Breaking change | 6 months | 12 months |
| Major version sunset | 12 months | 18–24 months |
| Security-related | 30 days | 90 days |

Industry examples bracket this range: GitHub supports each API version for at least 24 months, while Twilio offers 12 months of prior-version support followed by a 12-month end-of-life period. General practice for a deprecation notice lands around 6–12 months. See the [versioning](/guides/versioning) guide for how deprecation ties into version strategy.

---

## 5. Communicating the Change

Programmatic headers are necessary but not sufficient. Reach consumers through multiple channels:

* **Developer portals and changelogs** for official announcements, ideally subscribable via RSS and email.
* **Direct email** to registered API users.
* **Blog posts or webinars** explaining the rationale, timeline, and migration steps.
* **In-response signals** using the standard `Deprecation` and `Sunset` headers, which are preferred over custom `X-API-Warn` headers or the deprecated `Warning` header.

Offer clear migration paths and, for critical accounts, dedicated support. Monitor usage of deprecated features so you can track migration progress and reach out to stragglers directly. A useful readiness test is an **API brownout**: temporarily disabling the deprecated feature to surface hidden dependencies and gather feedback before the real cutoff.

---

## 6. The Final Sunset

At the sunset date, return **`410 Gone`** for permanently removed resources, not `404 Not Found`. `410` communicates that the resource is intentionally and permanently gone, which is distinct from a resource that simply cannot be found.

```http
HTTP/1.1 410 Gone
Content-Type: application/problem+json

{
  "type": "https://developer.apiguide.dev/errors/sunset",
  "title": "This endpoint has been retired",
  "detail": "GET /v1/search was sunset on 2025-12-31. Use /v2/search.",
  "migration": "https://developer.apiguide.dev/migrate/v2"
}
```

---

## 7. Encoding Deprecation in the Spec

Push lifecycle information into your API definition so tooling and clients can react automatically. OpenAPI 3.x already supports `deprecated: true` on individual operations and fields. Proposed extensions would add `deprecationDate`, `sunsetDate`, and `migration` URLs at the API level, mapping directly to the `Deprecation`, `Sunset`, and `Link` headers so servers can emit them consistently.

Embedding deprecation policy early — defining a reasonable maintenance window, obtaining consent from key consumers, and documenting the migration path — turns retirement into a predictable, well-signposted process rather than a disruption.
