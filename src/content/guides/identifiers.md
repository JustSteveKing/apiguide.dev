---
title: "Resource Identifiers: Integers, UUIDs, ULIDs and Prefixed IDs"
description: "Choosing public identifiers for an API: sequential integers versus UUIDv4, UUIDv7, ULID and prefixed opaque IDs, enumeration risk, why IDs are strings in JSON, case sensitivity, and why clients must never parse them."
category: "representation"
---

## An ID Is a Promise You Cannot Take Back

The format of a resource identifier is one of the few decisions in an API that can never be revised. IDs end up in consumers' databases, URLs, logs, support tickets and foreign keys. Change the format and every one of those copies becomes a migration someone else has to run.

So the choice deserves more thought than "whatever the database generates". The recommendation, argued below: **expose IDs as opaque strings, preferably with a type prefix, generated from a time-ordered random value such as UUIDv7, and never expose an auto-increment integer.**

---

## 1. The Options

| Format | Example | Sortable by creation | Enumerable by counting | Leaks |
| :--- | :--- | :--- | :--- | :--- |
| Sequential integer | `48213` | Yes | Trivially | Record counts and growth rate |
| UUIDv4 | `9b2e7c1a-4f3d-4a8e-9c61-2d7f0b5e8a14` | No | No (122 random bits) | Nothing |
| UUIDv7 | `019a1f3c-7b2e-7c41-8f0a-5d3e9b6c2a71` | Yes, to the millisecond | No (up to 74 random bits) | Creation time |
| ULID | `01JA3Z8K4M7Q2R9T5V6W8X0Y1Z` | Yes, to the millisecond | No (80 random bits) | Creation time |
| Prefixed opaque | `cus_NffrFeUfNV2Hib` | Depends on what is inside | Depends on what is inside | The resource type, deliberately |

UUIDs are specified by [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562), which obsoleted RFC 4122 in May 2024 and added versions 6, 7 and 8. A UUIDv7 places a 48-bit Unix timestamp in milliseconds in its most significant bits, followed by the version and variant bits and 74 bits that are random, or partly a counter if the implementation uses one for monotonicity. ULID is a [community specification](https://github.com/ulid/spec), not a standards-track document: the same 48-bit millisecond timestamp plus 80 random bits, encoded as 26 characters of Crockford base32.

### Picking one

- **UUIDv7** is the default for new systems. It is a published standard, it sorts by creation time, and that ordering keeps new rows together at the end of a B-tree index instead of scattering them across it the way UUIDv4 does.
- **UUIDv4** wins when creation time must not be inferable from the ID, for example where the timing of an account's creation is itself sensitive.
- **ULID** is shorter than a hyphenated UUID and URL-friendly, but it is not an IETF standard and gives you no ordering or uniqueness property UUIDv7 does not. Prefer UUIDv7 unless you already have ULIDs.
- **Sequential integers** are fine as an internal primary key. Do not put them in a public URL.

---

## 2. Enumeration Is an Authorization Problem, and Also an ID Problem

A sequential ID invites a client to try `/invoices/48214` after `/invoices/48213`. If your API returns someone else's invoice, that is Broken Object Level Authorization, the first item on the OWASP API Security Top 10 (2023), and the fix is an ownership check on every object access, not a different ID format. See [authorization models](/guides/authorization-models).

Random IDs still matter, for two reasons the authorization check does not cover:

- **They leak business data even when access is denied.** Two orders created a week apart tell a competitor how many orders you took that week.
- **They make a missing check harder to exploit.** Defense in depth is not a substitute for the check, but an attacker who has to guess 122 random bits will not find the hole by counting.

Do not go further and treat an unguessable ID as a credential. RFC 9562 says UUIDs "MUST NOT be used as security capabilities". A shareable link that grants access needs a separate, revocable token, not a long ID.

Return the same [`404 Not Found`](/status-codes/404) for "does not exist" and "exists but is not yours", so the response does not confirm which IDs are valid.

---

## 3. Prefixed Opaque IDs

A short type prefix in front of the random part, as in Stripe's `cus_` for customers, costs a few bytes and earns its keep everywhere an ID appears without context:

- **Logs and support tickets.** `inv_...` is an invoice; nobody has to ask.
- **Better errors.** An endpoint that receives a `cus_` ID where it expected an `ord_` ID can say so precisely in a [`422`](/status-codes/422) instead of returning a confusing `404`.
- **Routing and polymorphism.** A field that can reference several resource types is self-describing.

Keep the prefix short, lowercase, fixed per type, and separated by a character that cannot appear in the body (an underscore is conventional). Treat the prefix as part of the ID, not as a separate field: clients store and send the whole string.

---

## 4. IDs Are Strings in JSON

Send every ID as a JSON string, including numeric ones.

RFC 8259 notes that integers are only interoperable in the range [-(2^53)+1, (2^53)-1], because many parsers decode JSON numbers as IEEE 754 doubles. JavaScript's `JSON.parse` is one of them, and it rounds silently:

```text
JSON.parse('{"id": 9007199254740993}').id   ->  9007199254740992
```

A 64-bit ID from a snowflake-style generator crosses that line, and the client ends up fetching, updating or deleting the wrong record with no error anywhere. A string cannot be rounded.

```json
{
  "id": "ord_019a1f3c7b2e7c418f0a5d3e9b6c2a71",
  "customer_id": "cus_NffrFeUfNV2Hib"
}
```

Strings also keep the format your own business. An ID that starts life as an integer and is typed `integer` in your OpenAPI document cannot later become a UUID without a breaking change; one typed `string` can. GraphQL reached the same conclusion: its `ID` scalar "should always serialize as a String".

---

## 5. Case Sensitivity

Decide whether IDs are case-sensitive, document it, and emit them in exactly one case.

- **UUIDs** are hexadecimal and RFC 9562 permits upper, lower or mixed case. Emit lowercase and accept any case on input, normalizing before lookup.
- **ULIDs** are case-insensitive by design.
- **Base62 or similar encodings** are case-sensitive: `aB3` and `ab3` are different IDs. If you use one, say so, because consumers storing your IDs in a database column with a case-insensitive collation (common in MySQL) will see collisions and duplicate-key errors that are hard to trace back to you.

---

## 6. Clients Must Never Parse IDs

Every ID format in the table except the integer carries structure: a timestamp in a UUIDv7, a type in a prefix. None of it is part of your contract. RFC 9562 itself advises treating UUIDs "as opaquely as possible".

Say so in your documentation: an ID is an opaque string of a bounded maximum length, compare it for equality, do not extract anything from it. Then expose anything a client might want as a real field. If they need creation time, return `created_at` (see [timestamps and formats](/guides/timestamps-and-formats)). If they need the type, return an `object` or `type` field.

The client that parses the timestamp out of a UUIDv7 today is the client that breaks when you switch generators, and under [Hyrum's Law](/guides/breaking-changes) that break is yours.

Also publish a maximum length, and leave headroom in it. Consumers will size a database column to whatever you document, and to whatever they observe if you document nothing.
