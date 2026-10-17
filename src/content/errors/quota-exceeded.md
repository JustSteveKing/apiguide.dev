---
title: Quota Exceeded
statusCode: 429
statusText: Too Many Requests
category: client-error
relatedCodes: ['rate-limit-exceeded', 'insufficient-funds', 'forbidden', 'account-frozen']
publishedDate: 2026-10-14
updatedDate: 2026-10-14
---

## When to use it

Use 429 with a Quota Exceeded error when the client has used up the allowance on its plan for the current billing period, such as 100,000 requests a month or 50 GB of exports per cycle, and further requests are refused until the period resets or the plan changes.

Some APIs return 403 for this. Use 429, for three reasons:

- **The definition covers it.** RFC 6585 defines 429 as the user having "sent too many requests in a given amount of time". A billing period is a given amount of time; it is just longer than a minute.
- **It tells the client when to come back.** RFC 6585 says a 429 MAY carry [`Retry-After`](/headers/retry-after), and an HTTP-date set to the start of the next period gives the exact time the allowance resets. A 403 has no such convention.
- **403 says something else.** RFC 9110 says a client receiving 403 "SHOULD NOT automatically repeat the request with the same credentials", and generic clients treat it as a permissions failure. A quota is not a permissions failure. The same credentials will work again on the first day of the next period.

The RateLimit header fields Internet-Draft (`draft-ietf-httpapi-ratelimit-headers`, revision 11 at the time of writing) agrees: it proposes a `quota-exceeded` problem type with 429 as its recommended status code. It is still a draft and the type is not yet in the IANA HTTP Problem Types registry, so use this page's type URI today.

Advertise the allowance before the client hits it. The draft's [`RateLimit-Policy`](/headers/ratelimit-policy) field describes a policy with `q` (the quota), `w` (the window in seconds) and `qu` (the unit: `requests`, `content-bytes` or `concurrent-requests`, defaulting to `requests`). The [`RateLimit`](/headers/ratelimit) field reports what is left with `r` and the seconds until the window resets with `t`. A billing period does not map exactly onto a fixed `w`, because calendar months vary in length, so treat `w` as an approximation and rely on `t` and `Retry-After` for the exact reset.

## When not to use it

Do not use it for a short rolling or fixed window that exists to protect capacity, such as 100 requests a minute. That is `rate-limit-exceeded`. The difference matters to the client: a rate limit means "slow down and retry in seconds", so retry with backoff; a quota means "you are done until the reset or until you upgrade", so stop and tell a human. Both are 429, and the `type` is what lets a client tell them apart.

Do not use it when the request needs money the account does not have, such as a prepaid balance or credits that have run out. That is `insufficient-funds` (402): the fix is a payment, not waiting for a reset.

Do not use it when the plan does not include the feature at all. No amount of waiting fixes that, so it is `forbidden` (403). Do not use it when the account itself is suspended; that is `account-frozen`.

Do not move an existing API from 403 to 429 without warning. Clients that branch on 403 will start retrying, or stop recognizing the condition. Treat the change as a breaking one.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/quota-exceeded",
  "title": "Quota Exceeded",
  "status": 429,
  "detail": "This account has used all 100000 requests included in its plan for the period ending 2026-10-31. The allowance resets on 2026-11-01, or you can upgrade now.",
  "instance": "/v1/leads",
  "violatedPolicies": ["monthly"],
  "resetsAt": "2026-11-01T00:00:00Z",
  "upgradeUrl": "https://billing.example.com/plans"
}
```

Send the reset time and the policy in headers, not only in the body:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/problem+json
Retry-After: Sun, 01 Nov 2026 00:00:00 GMT
RateLimit-Policy: "burst";q=100;w=60, "monthly";q=100000;w=2592000
RateLimit: "monthly";r=0;t=1468800
```

Here `t` is the 17 days from 2026-10-15T00:00:00Z to the reset. The draft says that when a response carries both fields, `Retry-After` takes precedence. RFC 6585 says a 429 MUST NOT be stored by a cache. The `violatedPolicies` member mirrors the draft's `violated-policies` extension; if you adopt the draft's own type later, switch to its member name at the same time.
