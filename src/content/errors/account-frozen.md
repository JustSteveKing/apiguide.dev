---
title: Account Frozen
statusCode: 403
statusText: Forbidden
category: client-error
relatedCodes: ['insufficient-funds', 'insufficient-scope', 'unauthorized']
publishedDate: 2026-09-04
---

## When to use it

Use 403 with an Account Frozen error when credentials are valid but the account itself has been suspended, locked, or placed under review, so no action can proceed regardless of the caller's permissions. Typical triggers are unpaid invoices past a grace period, a fraud or compliance hold, a security lockout after suspicious activity, or an account pending closure.

Unlike a permissions failure, the block applies to the whole account rather than a single endpoint, so retrying against another route will fail the same way. Say what lifted state the client needs to reach and who can lift it.

## When not to use it

Do not use this when the account is active and simply out of money — that is `insufficient-funds` and the client can resolve it themselves. Do not use this when the token is missing, malformed, or expired (use `unauthorized` or `expired-authentication-token`), or when an active account lacks the scope for one specific operation (use `insufficient-scope`).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/account-frozen",
  "title": "Account Frozen",
  "status": 403,
  "detail": "This account is frozen pending a billing review and cannot make API requests.",
  "instance": "/v1/orders",
  "reason": "billing_review",
  "frozenAt": "2026-08-27T09:14:00Z",
  "contact": "https://support.example.com/appeals"
}
```

Keep the `reason` a stable machine-readable value so clients can branch on it, and put the human explanation in `detail`. Do not disclose fraud or compliance specifics that would help an attacker probe your review process — point them at a support channel instead.
