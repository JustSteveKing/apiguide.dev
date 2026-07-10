---
title: "Internationalization & Localization"
description: "How REST APIs negotiate language, separate message localization from data formatting, and standardize timestamps for a global audience."
category: "negotiation"
---

## Introduction to Internationalization

Internationalization (i18n) is the practice of designing an API so it can serve a global audience without re-engineering; localization (l10n) is adapting responses for a specific locale — translating text, formatting numbers and dates, and honoring regional conventions. For REST APIs the two concerns pull in different directions: human-readable text belongs to language negotiation, while values like timestamps and amounts are best delivered in a neutral, machine-friendly form and formatted by the client. Getting this separation right keeps an API adaptable and its consumers in control of presentation.

---

## 1. Language Negotiation

The primary tool for negotiating translated text is the [`Accept-Language`](/headers/accept-language) request header, part of standard [content negotiation](/guides/content-negotiation). Clients send a ranked list of BCP 47 language tags, and the server selects the best available translation.

```http
GET /articles/42 HTTP/1.1
Host: api.apiguide.dev
Accept-Language: en-GB, en;q=0.9, de;q=0.5
```

Tags combine a primary language code with optional regional subtags (`en`, `en-US`, `pt-BR`, `zh-CN`). Quality values (`q`) rank preferences, defaulting to `1.0`, with `q=0` marking a language as unacceptable and `*` matching anything not listed. A tag like `en` matches any English variant, while `en-GB` targets a specific locale.

The server reports the language it chose with the [`Content-Language`](/headers/content-language) response header:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Language: en-GB
```

### Fallback over `406`

HTTP allows a server to return [`406 Not Acceptable`](/status-codes/406) when it has no matching translation, but this is rarely the right choice. Most APIs return a default language instead, providing a usable response rather than an error. `Accept-Language` should not be mandatory; treat its absence as "any language acceptable."

### Limits of `Accept-Language`

The header is a good signal but a weak contract. It can expose linguistic preferences (a privacy and fingerprinting concern), and it conflates translation with formatting and business rules. It cannot cleanly express "labels in French but prices in US dollars," so it should drive text translation only — not data formatting or geography-dependent logic.

---

## 2. Message Localization vs. Data Localization

A central principle is to separate **localizing messages** (translating text) from **formatting data** (numbers, dates, currencies).

### Messages

For translated text, an API can either return fully translated strings keyed off `Accept-Language`, or return locale-neutral **message keys and arguments** and let the client interpolate and translate them. The key-based approach keeps display logic in the client and produces consistent results across interfaces. In larger systems, a dedicated localization service can centralize translations rather than burdening every service.

### Data

`Accept-Language` is a poor fit for data formatting. Deliver values in a **universal, locale-independent form** — ISO 8601 timestamps, `.` as the decimal separator, ISO currency and country codes — and let the client format them for the user's locale. When business rules genuinely depend on location (pricing, availability), pass an **explicit parameter** rather than overloading the language header.

```http
GET /products/9001?country=FR HTTP/1.1
Host: api.apiguide.dev
Accept-Language: fr-FR
```

Here `country=FR` (a normalized ISO code) drives business logic, while `Accept-Language` drives only the language of any labels. Keeping these axes independent avoids tightly coupled logic where language and geography cannot vary separately.

| Concern | Mechanism | Example |
| --- | --- | --- |
| Text translation | `Accept-Language` / message keys | `Accept-Language: de` |
| Number & date formatting | Client-side, from neutral values | `1234.56`, `2026-07-10T09:00:00Z` |
| Currency / region rules | Explicit parameter (ISO code) | `?country=US` |
| Timezone rendering | Client-side, or explicit request input | `America/Los_Angeles` |

---

## 3. Timezones and Date/Time Formats

The consensus for timestamps is unambiguous: **return UTC in ISO 8601 format**. RFC 3339 defines the internet-protocol profile of ISO 8601 used here.

```json
{
  "id": 42,
  "published_at": "2026-07-10T09:00:00Z",
  "updated_at": "2026-07-10T14:30:00Z"
}
```

The trailing `Z` denotes UTC and removes any ambiguity about offset. A common defect is returning times in the server's or the user's local zone without indicating the offset, which produces silent off-by-hours errors downstream.

### Be liberal on input

While responses should be consistently UTC, an API should accept timezone information on requests. That can mean parsing ISO 8601 strings with an explicit offset, or reading a dedicated header that names an IANA timezone:

```http
POST /events HTTP/1.1
Host: api.apiguide.dev
Content-Type: application/json
Time-Zone: America/Los_Angeles
```

Whatever the input, convert and store internally as UTC. Prefer storing a timezone identifier (for example `America/Los_Angeles`) over a fixed offset so that Daylight Saving Time and political changes are handled correctly.

### Client responsibility

Converting UTC to the user's local time and formatting it for their region is the client's job. Treat timezones and number formats as presentation-layer concerns; the API's role is to provide correct, neutral values.

---

## Summary

Robust global APIs negotiate language with `Accept-Language` and report it with `Content-Language`, falling back to a default rather than returning `406`. They keep message translation separate from data formatting, use explicit parameters for geography-dependent business rules, and standardize on UTC ISO 8601 timestamps while accepting timezone input liberally. This division of labor lets clients deliver locale-tailored experiences over a stable, unambiguous API surface.
