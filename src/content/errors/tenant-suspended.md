---
title: Tenant Suspended
statusCode: 403
statusText: Forbidden
category: client-error
relatedCodes: ['account-frozen', 'forbidden', 'resource-not-found']
publishedDate: 2026-10-17
updatedDate: 2026-10-17
---

## When to use it

Use [`403 Forbidden`](/status-codes/403) with a Tenant Suspended error when the caller's own credentials and account are fine, but the tenant the request targets, such as an organization, workspace or team, has been suspended. Typical causes are an unpaid subscription on the organization, a terms-of-service violation by the tenant, or a contract that has ended while its data is retained for a grace period.

The distinction from `account-frozen` is scope. In a [multi-tenant](/guides/multi-tenancy) product, one user often belongs to several tenants. Freezing the user's account blocks every request that user makes; suspending a tenant blocks every request into that tenant, from every user, while the same user can keep working in their other tenants. The client needs to know which it hit: a frozen account is the user's problem to resolve, a suspended tenant is for the tenant's owner or billing contact.

Say who can lift the suspension. The developer seeing this error is usually not the person who can fix it, so point them at the tenant's admin or billing contact rather than at a generic support page.

## When not to use it

Do not use it when the suspension applies to the caller's own account across all tenants. That is `account-frozen`.

Do not use it when the caller is not a member of the tenant at all. They should not learn whether that tenant exists or what state it is in, so return `resource-not-found` (404), as you would for any other tenant's resources. Only members, or callers already entitled to see the tenant, should receive this type.

Do not use it when the tenant is active and only one feature is unavailable on its plan. That is `feature-disabled`.

Do not use it when the tenant has been deleted, not suspended. If the data is gone for good and you keep a tombstone, that is `gone` (410).

## Example response

```json
{
  "type": "https://apiguide.dev/errors/tenant-suspended",
  "title": "Tenant Suspended",
  "status": 403,
  "detail": "The organization 'acme' is suspended because its subscription is past due. An organization owner can restore access by updating the payment method.",
  "instance": "/v1/orgs/acme/projects",
  "tenant": "acme",
  "reason": "billing_past_due",
  "suspendedAt": "2026-10-10T00:00:00Z"
}
```

Decide whether reads stay open during a suspension. Letting members read and export their data while blocking writes is often the kinder policy, and your contracts may require it. If you do that, return this type only for the operations that are blocked.
