---
title: Feature Disabled
statusCode: 403
statusText: Forbidden
category: client-error
relatedCodes: ['forbidden', 'insufficient-scope', 'maintenance-mode', 'resource-not-found']
publishedDate: 2026-10-17
---

## When to use it

Use [`403 Forbidden`](/status-codes/403) with a Feature Disabled error when the caller is authenticated, the request is valid, and the feature it uses is turned off for this account, organization or plan. Common cases are a capability that is not included in the customer's plan, a beta the account has not been enrolled in, or a feature an admin has switched off in the account's settings.

403 is the right code because the server understood the request and refuses it, and no change of credentials will help. RFC 9110 notes that a request "might be forbidden for reasons unrelated to the credentials", which is this case: the caller's identity and permissions are fine, the account's configuration is not. What the client needs is a different plan, an enrollment, or an admin to flip a setting, so say which.

Name the feature with a stable identifier and say how to enable it. A client can then hide the corresponding UI, and a developer reading the log knows whether to talk to sales, support or their own admin.

## When not to use it

Do not use it for a feature switched off for everyone, temporarily, with a kill switch or during an incident. Nothing the client does will enable it, and it is expected to come back, so that is a 503: `maintenance-mode` for planned work, `service-unavailable` otherwise.

Do not use it when the caller's role lacks permission for an action that is enabled on the account. That is your permission model, which is `forbidden`. When the OAuth token lacks the scope, it is `insufficient-scope`. Feature Disabled is about the account, not the person or the token.

Do not use it for an unreleased feature that callers should not know exists. Revealing a feature flag by name in an error leaks your roadmap. RFC 9110 lets a server hide a forbidden resource behind 404, so return `resource-not-found` until the feature is announced.

Do not use [`402 Payment Required`](/status-codes/402) for a feature gated by plan. RFC 9110 reserves 402 for future use, and clients have no agreed way to act on it.

Do not use [`501 Not Implemented`](/status-codes/501) either. 501 means the server does not support the functionality at all, for anyone, and it is a server error. A feature that exists and is merely off for this account is neither.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/feature-disabled",
  "title": "Feature Disabled",
  "status": 403,
  "detail": "Bulk export is not included in the Starter plan. Upgrade to Business or contact sales to enable it.",
  "instance": "/v1/exports",
  "feature": "bulk_export",
  "enableUrl": "https://example.com/settings/billing"
}
```

Keep `feature` a stable machine-readable value, and keep `detail` for the human explanation. Plans and their names change; the identifier a client branches on should not.
