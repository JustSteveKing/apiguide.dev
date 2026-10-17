---
title: "Quotas & Usage Metering"
description: "How a quota differs from a rate limit, how to meter usage without double-counting retries, how to tell clients where they stand, and what to return when the allowance runs out."
category: "reliability"
updatedDate: 2026-10-14
---

## Quotas Are Not Rate Limits

A rate limit governs throughput: how fast a client may send requests, measured over seconds or minutes. A quota governs an allowance: how much a client may consume in a billing period, measured over a day, a month or a contract term. The two are enforced by similar counters and both end in a [`429 Too Many Requests`](/status-codes/429), which is why they get conflated. They answer different questions and they fail in different ways.

| | Rate limit | Quota |
| --- | --- | --- |
| Protects | Your infrastructure from bursts | Your business model from overuse |
| Window | Seconds to minutes | A billing period |
| Reset | Continuous or every window | At the period boundary, often a calendar date |
| Waiting it out | Takes seconds | Can take weeks, or needs an upgrade |
| Accuracy needed | Approximate is fine | Has to match the invoice |

That last row is the one that changes the engineering. A rate limiter that miscounts by a few percent is harmless. A meter that miscounts by a few percent is a billing dispute. Run both, with a short-window rate limit in front of a long-window quota, and build the quota as a ledger rather than a counter.

For the throughput side, see [rate limiting](/guides/rate-limiting).

---

## 1. Decide What a Unit Is

Before you can meter anything, decide what you are counting, write it down, and publish it. "Requests" is the obvious unit and often the wrong one, because requests vary enormously in cost.

| Unit | Fits when | Watch out for |
| --- | --- | --- |
| Requests | Every call costs roughly the same | A [bulk endpoint](/guides/bulk-operations) doing 1,000 items for the price of one |
| Items or records | Work scales with the number of objects processed | Defining an item consistently across endpoints |
| Bytes | Cost is transfer or storage | Compressed vs. uncompressed size |
| Compute or tokens | Cost varies per call (search, inference, rendering) | Clients cannot predict the charge in advance |
| Credits | Several of the above, weighted | An exchange rate you now have to document and keep stable |

Whatever you pick, the published definition needs to answer the questions customers will ask the first time their bill surprises them:

- **Do failed requests count?** Do not charge for [`5xx`](/status-codes/500) responses: the failure was yours. Whether a `4xx` counts is a policy choice, but a validation error that did no work should not consume a paid allowance. The rate limit headers draft explicitly leaves this to the implementation, so your documentation is the only place a client can find the answer.
- **Do reads cost the same as writes?** If not, say so per endpoint.
- **When is usage recorded?** At admission, at completion, or when an [asynchronous job](/guides/async-operations) finishes. Pick one and apply it everywhere.

---

## 2. Meter Idempotently

The network will deliver the same request more than once. A client times out, retries, and the original attempt also succeeded. If the meter counts both, you have charged the customer twice for one operation, and they are entitled to be annoyed.

The fix is to make usage records idempotent, keyed on the same identity you use to make the operation itself idempotent. When a client sends an [`Idempotency-Key`](/headers/idempotency-key), the server already recognizes the retry and replays the stored response. The meter must sit behind that check, not in front of it:

```text
receive request
  if Idempotency-Key seen before:
      replay stored response        -> no usage recorded
  else:
      perform operation
      record usage event (key = account + Idempotency-Key)
      store response
```

Record usage as **immutable events with a unique key**, not as increments to a counter. An event table with a uniqueness constraint on the key turns a duplicate write into a no-op. An `UPDATE quota SET used = used + 1` turns it into an overcharge, and leaves no trail to prove it happened.

```json
{
  "id": "use_01J9ZK3T6Q",
  "account": "acct_42",
  "dedupe_key": "acct_42:7f3c9a2e-1b4d-4c8e-9f61-2d5a8b0e3c17",
  "metric": "documents.processed",
  "quantity": 12,
  "occurred_at": "2026-10-14T09:31:07Z"
}
```

The current usage for a period is then a sum over events, which you can cache in a counter for fast enforcement. The counter is a derived view: if it drifts, you rebuild it from the events, and the events are what the invoice is generated from. See [idempotency](/guides/idempotency) for the request side.

---

## 3. Enforcement Is Approximate, Billing Is Not

In a distributed system, checking the quota and recording the usage are two separate steps, and concurrent requests can all pass the check before any of them records. A customer with 10 units left who fires 50 parallel requests can end up at 40 over.

Decide in advance which way you want to be wrong:

- **Enforce from a fast, approximate counter** (an in-memory or cache counter per account) and accept a small overrun at the boundary. Bill from the event ledger, which is exact. For most APIs this is the right trade: a few units of overrun cost less than a strongly consistent check on every request.
- **Reserve before you work** when a single unit is expensive enough that overrun matters, such as a long-running export or a paid inference call. Atomically decrement the allowance before starting, and release the reservation if the operation fails.

Either way, never let the enforcement counter be the billing record. It is optimized for speed, it is allowed to be slightly wrong, and it will be reset, sharded and rebuilt in ways an invoice cannot survive.

---

## 4. Soft Limits and Hard Limits

A quota is a commercial decision before it is a technical one, and there are two kinds:

- **Soft limit**: usage beyond the allowance is permitted and billed as overage, or permitted up to a grace margin. The API keeps serving and the customer is notified.
- **Hard limit**: usage beyond the allowance is rejected until the period resets or the plan changes.

Use a hard limit on free tiers and where overage would create cost the customer has not agreed to. Use soft limits for paying customers whose integrations are in production: cutting off a customer's checkout flow on the 28th of the month because they had a good month is a worse outcome for both of you than an overage line on an invoice. Many APIs combine the two, a soft limit at the plan allowance and a hard ceiling well above it as a spending cap the customer can set.

Warn before either one bites. Thresholds at a fixed share of the allowance, delivered by email or a [webhook](/guides/webhooks), give the customer time to act. A client that only discovers its quota when requests start failing will discover it in production.

---

## 5. Communicating Usage

Clients should be able to see where they stand without waiting for an error. Use both headers and an endpoint, because they serve different readers.

### Headers on every response

The IETF Internet-Draft `draft-ietf-httpapi-ratelimit-headers` (revision -11 at the time of writing, not yet an RFC) defines two Structured Fields that cover quotas as well as rate limits. [`RateLimit-Policy`](/headers/ratelimit-policy) describes each named policy: `q` is the quota, `w` the window in seconds, and `qu` the unit. [`RateLimit`](/headers/ratelimit) reports the live state: `r` is what remains and `t` is the number of seconds within which that remainder applies.

```http
HTTP/1.1 200 OK
RateLimit-Policy: "burst";q=100;w=60, "monthly";q=50000;w=2592000
RateLimit: "monthly";r=1200;t=1468800
```

Three things to know about these fields as drafted:

- **`w` is informative.** It describes the policy; it does not tell the client when the current period ends. A monthly quota resets on a date, not after a fixed number of seconds, so put the time to reset in `t` on `RateLimit`.
- **`qu` takes a value from an IANA registry** the draft creates, with three initial units: `"requests"` (the default), `"content-bytes"` and `"concurrent-requests"`. A bespoke unit such as credits is not one of them, so generic clients will not understand it. Document it, and keep the authoritative numbers in the usage endpoint.
- **Report the policy closest to exhaustion.** `RateLimit` can carry several items, but the draft's own examples report the limit the client is nearest to hitting. When the burst limit is fine and the monthly quota is nearly gone, that is the one to show.

Because the draft may still change, avoid building anything that depends on a detail other than the policy name, `q`, `r` and `t`.

### A usage endpoint

Headers describe one request's view. Customers also need the period's total, broken down, matching what they will be invoiced for:

```http
GET /v1/usage?period=current HTTP/1.1
Authorization: Bearer <token>
```

```json
{
  "period": {
    "start": "2026-10-01T00:00:00Z",
    "end": "2026-11-01T00:00:00Z"
  },
  "metrics": [
    {
      "metric": "documents.processed",
      "used": 48800,
      "included": 50000,
      "limit_type": "soft",
      "overage_unit_price": "0.002"
    }
  ],
  "as_of": "2026-10-14T09:30:00Z"
}
```

Include `as_of`. Usage aggregated from an event stream lags, and a customer comparing this endpoint against their own logs needs to know how stale it is. Serve it from the same ledger the invoice uses, so the two can never disagree. Money belongs in a decimal string, not a float; see [money, decimals and nulls](/guides/money-decimals-nulls).

---

## 6. When the Quota Runs Out

Return [`429 Too Many Requests`](/status-codes/429) for an exhausted hard quota, with a problem details body that says it is the quota, not the rate limit, and a [`Retry-After`](/headers/retry-after) pointing at the period reset.

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/problem+json
Retry-After: Sun, 01 Nov 2026 00:00:00 GMT
RateLimit-Policy: "monthly";q=50000;w=2592000
RateLimit: "monthly";r=0;t=1520940

{
  "type": "https://apiguide.dev/errors/quota-exceeded",
  "title": "Quota Exceeded",
  "status": 429,
  "detail": "The monthly allowance of 50000 documents for this account has been used. It resets on 2026-11-01.",
  "violatedPolicies": ["monthly"]
}
```

Why each piece is there:

- **429, not 403 or 402.** 429 is what clients and SDKs already treat as "back off and retry later", which is exactly the right behavior. [`403 Forbidden`](/status-codes/403) says the client is not permitted, which is false and discourages any retry. [`402 Payment Required`](/status-codes/402) fits a different case, an exhausted prepaid balance where a payment fixes it immediately ([insufficient funds](/errors/insufficient-funds)); RFC 9110 reserves 402 without defining its semantics, so do not stretch it to cover a period allowance as well.
- **`Retry-After` as an HTTP-date.** `Retry-After` accepts a date as well as a number of seconds, and for a reset at the start of the next billing period the date is clearer. Do not send `Retry-After: 30` out of habit: a client that obeys it will retry every 30 seconds for two weeks.
- **A distinct problem `type`.** The status code is the same as a rate limit; the remedy is not. A client hitting the [rate limit](/errors/rate-limit-exceeded) should slow down. A client hitting the [quota](/errors/quota-exceeded) should stop, alert a human, or upgrade, and it can only tell the two apart from the body.
- **`violatedPolicies`.** The rate limit headers draft defines a `violated-policies` extension member, an array of policy names, so a client can match the failure to a policy in `RateLimit-Policy`; this member mirrors it under the [quota exceeded](/errors/quota-exceeded) page's naming. The draft also proposes an IANA-registered `quota-exceeded` problem type, but it is not yet in the registry, so use a `type` URI that resolves today.

Do not return [`503 Service Unavailable`](/status-codes/503). The service is fine; this client has used its allowance. And do not fail silently by degrading responses (fewer results, lower quality) without saying so: a quota that is enforced invisibly looks like a bug.
