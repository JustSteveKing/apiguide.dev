---
title: Insufficient Funds
statusCode: 402
statusText: Payment Required
category: client-error
relatedCodes: ['account-frozen', 'resource-conflict']
publishedDate: 2026-09-04
---

## When to use it

Use 402 with an Insufficient Funds error when the client is authenticated and authorised to perform the action, but the account backing the request cannot cover its cost. This covers a declined card, an exhausted prepaid balance, a spent credit allocation, or a wallet that would go negative if the operation completed.

The request is well formed and would succeed if the account were funded, so the client's correct next step is to add funds or update a payment method and retry the same request.

## When not to use it

Do not use this when the account is suspended, closed, or under review. The client cannot fix those by paying, so use `account-frozen` instead. Do not use this for plan or quota limits that are not monetary, such as rate limits (use `rate-limit-exceeded`) or a feature missing from the caller's token scopes (use `insufficient-scope`).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/insufficient-funds",
  "title": "Insufficient Funds",
  "status": 402,
  "detail": "The account balance of 4.20 USD is short of the 25.00 USD required for this charge.",
  "instance": "/v1/charges",
  "balance": "4.20",
  "required": "25.00",
  "currency": "USD",
  "topUpUrl": "https://billing.example.com/top-up"
}
```

Report the shortfall in the same currency the client was charged in, and link to the page where they can resolve it. Never echo card numbers or payment credentials back in the error body.
