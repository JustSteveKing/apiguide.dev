---
title: "Logging Without Leaking: Secrets and Personal Data"
description: "What an API must never write to its logs, why redaction belongs at the source, how to correlate requests without identifying people, and how retention and erasure apply to log data."
category: "security"
updatedDate: 2026-10-14
---

## Logs Are a Copy of Your Traffic

Every log line is a copy of part of a request, written to a store with weaker access controls than your database, shipped to third-party vendors, indexed for search, and kept long after anyone remembers why. An access token in a database row is protected by your authorization model. The same token in a log line is readable by everyone with access to the logging platform, and by anyone who compromises it.

So the question is not whether your logs contain sensitive data; by default they do. Frameworks log full URLs, HTTP clients log headers on error, exception handlers serialize request objects, and debug logging switched on during an incident is rarely switched off again. The question is whether you removed it before it was written.

This guide covers what to keep out, where to remove it, and what regulation expects of what is left. For the observability side (what you should log), see [observability and tracing](/guides/observability-tracing).

---

## 1. What Never to Log

Some values are credentials: anyone who reads them can act as the client. They do not go into logs in any form, including truncated, partially masked or base64-encoded.

| Never log | Where it hides |
| --- | --- |
| [`Authorization`](/headers/authorization) header values | Header dumps, HTTP client debug output, proxy logs |
| [`Cookie`](/headers/cookie) and [`Set-Cookie`](/headers/set-cookie) values | Session identifiers are credentials |
| API keys | Custom headers such as `X-Api-Key`, request bodies of key-management endpoints |
| Tokens in query strings | `?access_token=`, `?api_key=`, signed URL signatures, password reset links |
| Passwords and one-time codes | Login and verification request bodies |
| Client secrets and private keys | OAuth token requests, configuration dumps at startup |
| Webhook signing secrets | Subscription creation and rotation endpoints |

A hash of a credential is still sensitive if the credential has low entropy (a short PIN, a password); log a stable non-secret identifier instead, such as the key's ID or prefix, which lets you trace usage without enabling it.

Personal data is a broader category, and the rule there is minimization rather than prohibition. Email addresses, names, phone numbers, postal addresses, payment details, government identifiers and free-text fields all count. IP addresses and device identifiers count too: GDPR Recital 30 names IP addresses and cookie identifiers as online identifiers that can be used to identify people. Log personal data only where you can say what the log line is for, and prefer an internal user ID that is meaningless outside your system.

**Request and response bodies** deserve their own rule: do not log them by default. A body can contain anything the client chose to send, and the fields you would need to redact are not known in advance. If you need body logging to debug an integration, enable it per tenant, for a bounded time, through an allowlist of fields.

---

## 2. Keep Secrets Out of URLs

The easiest way to keep a value out of logs is to never put it where logs are written. URLs are logged by everything: your access logs, load balancers, CDNs, API gateways, browser history, and the `Referer` header a browser sends when a user follows a link onward. RFC 9110 (Section 17.9) is direct about it: URIs "are intended to be shared, not secured", and "it is therefore unwise to include information within a URI that is sensitive, personally identifiable, or a risk to disclose."

- **Send credentials in headers.** The [OAuth 2.0](/specifications/oauth2) Security Best Current Practice (RFC 9700, Section 4.3.2) states that clients MUST NOT pass access tokens in a URI query parameter.
- **Send personal data in bodies.** A lookup by email address is a [`POST`](/methods/post) with the address in the body, or a search resource, not `GET /users?email=jane@example.com`. RFC 9110 names this exact trade-off: `POST` loses cacheability, which is the right price for keeping the value out of every log between client and server. The [`QUERY`](/methods/query) method, standardized in RFC 10008, removes that trade-off where it is supported: it is safe and idempotent like `GET`, and its parameters travel in the body.
- **Use opaque identifiers in paths.** `/users/usr_8f2k` instead of `/users/jane@example.com`. See [identifiers](/guides/identifiers).

When a value must travel in a URL, as with a password reset link or a pre-signed download, make it single-use and short-lived so that the copy in someone's logs is worthless by the time anyone reads it.

---

## 3. Redact at the Source

Redaction belongs in the process that creates the log line, not downstream in the log pipeline. A pipeline filter runs after the data has left your process, crossed the network and possibly been buffered to disk, and every vendor and intermediate store on the way has a copy. Scrubbing at the destination is a second line of defense, never the first.

### Use structured logs

Structured logging is what makes source redaction tractable. A free-text line like `"Request failed for jane@example.com with token eyJ..."` can only be cleaned with regular expressions, which will miss the next format somebody invents. A structured event has named fields, and named fields can be handled by policy:

```json
{
  "timestamp": "2026-10-14T09:31:07.412Z",
  "level": "warn",
  "message": "payment declined",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "user_id": "usr_8f2k",
  "api_key_id": "key_live_3Hx",
  "route": "/v1/payments",
  "status": 422,
  "duration_ms": 43
}
```

Note what is absent: no email, no token, no card number, and `route` is the matched route template rather than the raw URL with its query string.

### Allowlist, do not denylist

A denylist of field names to redact (`password`, `token`, `authorization`) fails open: the first field named `pwd`, `secret_value` or `X-Partner-Auth` goes straight through. An allowlist of fields that may be logged fails closed. Apply it in one place, the logging middleware or the logger's serializer, so no call site can bypass it:

```text
for each header in request.headers:
    if header.name in LOGGABLE_HEADERS:      # e.g. content-type, user-agent, traceparent
        log header
    else:
        log header.name with value "[REDACTED]"
```

Log the name of a redacted field with a placeholder rather than dropping it entirely. "An `Authorization` header was present" is useful when debugging; its value never is.

### Watch the indirect paths

The leaks that survive a careful logging policy usually come from elsewhere:

- **Exception messages and stack traces** that include the arguments of the failing call.
- **HTTP client errors** that embed the full outbound request, including the partner's API key.
- **ORM and query logs** with bound parameter values.
- **Error trackers and APM agents** that capture request headers and bodies unless configured not to. Check their scrubbing defaults explicitly.
- **Validation errors echoed back** with the rejected value, which then gets logged with the response. See [error handling](/guides/error-handling).

---

## 4. Correlate Without Identifying

You need to follow one request through many services, and you need to find all the requests from one customer. Neither requires personal data in the log.

For the request, use W3C Trace Context. The [`traceparent`](/headers/traceparent) header carries a random trace ID that every service logs and propagates. The specification requires that the random number generators behind it not rely on any information that can be user-identifiable, and it forbids vendors from putting personally identifiable information in [`tracestate`](/headers/tracestate). Do not undo that by adding user attributes to baggage or span attributes that flow to every downstream system and vendor. See [Trace Context](/specifications/trace-context).

For the customer, log your own opaque account and user IDs. Support can resolve an ID to a person by looking it up in the system of record, under that system's access controls, with that lookup audited. The log itself stays meaningless to anyone who does not have that access.

---

## 5. Retention and Data Minimization

The GDPR's principles apply to log data like any other personal data. Two are directly relevant:

- **Data minimization**, Article 5(1)(c): personal data must be "adequate, relevant and limited to what is necessary" for the purpose.
- **Storage limitation**, Article 5(1)(e): it must be kept "for no longer than is necessary" for that purpose.

In practice, that means a retention period per log stream, chosen for its purpose and enforced automatically:

| Stream | Typical purpose | Retention approach |
| --- | --- | --- |
| Debug and application logs | Diagnosing current incidents | Short; days to weeks |
| Access logs | Abuse detection, capacity, debugging | Short to medium, with IPs truncated or dropped once the security purpose expires |
| Security and audit logs | Investigating incidents, proving who did what | Longer, with tight access control and the minimum fields needed |
| Delivery and job history | Customer-facing diagnostics | Its own window; see [webhook delivery history](/guides/webhook-delivery-history) |

Separate the streams physically. A single log index with one retention setting forces the longest-lived purpose onto every line, and debug logs end up kept for as long as the audit trail requires.

---

## 6. Erasure Versus Immutable Logs

Article 17 of the GDPR gives people the right to have their personal data erased "without undue delay" when one of its grounds applies. Logs are often designed to be the opposite of erasable: append-only, replicated, archived to write-once storage, and sometimes tamper-evident by design.

You resolve this by design, not by searching archives when a request arrives:

- **Keep personal data out of logs in the first place.** If logs contain only opaque internal IDs, erasing the user in your system of record leaves log lines that point at nothing. This is the strongest position and it is why sections 1 to 4 matter.
- **Let short retention do the erasing.** If debug logs expire in 14 days, an erasure request is satisfied by the time expiry runs, provided your documented response time allows for it.
- **Pseudonymize what must be kept.** For long-lived audit logs, log a pseudonymous ID and keep the mapping to the person in a separate store. Deleting the mapping disconnects the log from the individual without rewriting the log. Pseudonymized data is still personal data while the mapping exists, so this is a technique for erasure, not an exemption from the rules.
- **Know your exceptions.** Article 17(3) does not apply erasure where processing is necessary for compliance with a legal obligation, or "for the establishment, exercise or defence of legal claims". Some audit logs are kept for exactly those reasons. Name the obligation in your retention policy rather than assuming it.

None of this is legal advice for your jurisdiction. It is the engineering that makes the legal answer cheap to give: a log that never held the data does not need a process for removing it.
