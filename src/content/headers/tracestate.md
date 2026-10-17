---
name: "tracestate"
description: "W3C Trace Context companion to traceparent that carries vendor-specific trace data as an ordered list of key=value entries."
category: "request"
standard: true
relatedCodes: []
reference:
  title: "W3C Trace Context"
  url: https://www.w3.org/TR/trace-context/
updatedDate: 2026-10-14
---

## What is the tracestate header?

The `tracestate` request header, defined in the W3C Recommendation [Trace Context](https://www.w3.org/TR/trace-context/), carries tracing data that is specific to one vendor or system alongside the vendor-neutral [`traceparent`](/headers/traceparent). Where `traceparent` gives every system the same trace ID and parent span, `tracestate` lets each tracing system keep its own state for the same trace, so a request that passes through services monitored by different vendors stays traceable in each of them.

Like `traceparent`, the name is lowercase by convention and must be accepted in any case.

The value is a comma-separated list of `key=value` entries, ordered with the most recently updated entry first:

```http
tracestate: rojo=00f067aa0ba902b7,congo=t61rcWkgMzE
```

The rules from the Recommendation that implementations most often get wrong:

| Rule | Detail |
| :--- | :--- |
| Keys are lowercase | A simple key starts with a lowercase letter and may contain `a`-`z`, `0`-`9`, `_`, `-`, `*` and `/`, up to 256 characters. |
| Multi-tenant keys | `tenant@system`, for example `tenant42@xyz`. The system ID is at most 14 characters. |
| Values are opaque | Up to 256 printable ASCII characters, excluding `,` and `=`, and not ending in a space. |
| One entry per key | A system that sees the trace again overwrites its entry rather than adding a second. |
| At most 32 entries | Empty and whitespace-only entries are allowed and must be tolerated. |

## API Usage & Best Practices

* **Propagate it whenever you propagate `traceparent`.** The Recommendation says a vendor receiving `tracestate` MUST send it on outgoing requests. A service or proxy that forwards `traceparent` and drops `tracestate` breaks every other vendor's view of the trace.
* **Only touch your own entry, and move it to the front.** When you update or add your entry, put it at the beginning of the list and leave the order of the others alone. Do not delete entries you did not create: someone else's correlation depends on them.
* **Do not change it if you did not change `traceparent`.** The Recommendation forbids modifying `tracestate` when `traceparent` was passed through unchanged. A pass-through proxy forwards both untouched.
* **Truncate whole entries, never characters.** Vendors SHOULD propagate at least 512 characters of the combined value. If you must cut it down, drop entries longer than 128 characters first, then drop from the end of the list. Chopping a value in half corrupts it for its owner.
* **Never put personal data in it.** The Recommendation says vendors MUST NOT include personally identifiable information. It travels to every downstream service, and possibly to third parties, so treat its contents as public.
* **Strip it at trust boundaries.** Entries can reveal which monitoring products you run. Remove your internal entries, or the whole header, on calls to external systems.
* **Ignore it if `traceparent` is invalid.** A receiver that fails to parse `traceparent` MUST NOT parse `tracestate`. The reverse does not hold: a bad `tracestate` never invalidates `traceparent`.
* **Do not use it for application data.** It is for tracing systems. Business context such as a tenant ID or feature flag belongs in the W3C Baggage header, or in your own headers, not here.

## Examples

A request carrying state for two tracing systems. `rojo` touched the trace most recently, so it is first:

```http
GET /v1/invoices HTTP/1.1
Host: api.example.com
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
tracestate: rojo=00f067aa0ba902b7,congo=t61rcWkgMzE
```

After `congo` processes the request and calls onward, it updates its own entry and moves it to the front, together with a new `parent-id` in `traceparent`:

```http
GET /internal/ledger HTTP/1.1
Host: ledger.internal
traceparent: 00-0af7651916cd43dd8448eb211c80319c-53995c3f42cd8ad8-01
tracestate: congo=ucfJifl5GOE,rojo=00f067aa0ba902b7
```
