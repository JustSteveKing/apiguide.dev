---
title: Failed Dependency
statusCode: 424
statusText: Failed Dependency
category: client-error
relatedCodes: ['validation-failed', 'resource-conflict', 'bad-gateway']
publishedDate: 2026-10-17
---

## When to use it

Use [`424 Failed Dependency`](/status-codes/424) for an operation that was not performed because it depended on another operation in the same request, and that other operation failed. RFC 4918 defines it as a method that "could not be performed on the resource because the requested action depended on another action and that action failed".

Its natural home is inside a batch or compound request. When a [bulk operation](/guides/bulk-operations) contains steps that build on each other, such as creating a customer and then a subscription for that customer, and the first step fails, the second was never attempted. Mark it with this type so the client can tell the step that actually failed from the steps that were skipped because of it. RFC 4918's own example has the same shape: if one command in a [`PROPPATCH`](/methods/proppatch) fails, the rest fail with 424.

The same applies to an all-or-nothing batch. If item 3 of 10 fails and the batch rolls back, item 3 carries its own error and the other nine carry this type, so the client knows they were valid and can resubmit them unchanged once item 3 is fixed.

Always point at the operation that failed. A 424 that does not say which dependency broke sends the client searching through the whole batch.

## When not to use it

Do not use it for the operation that actually failed. That one gets its own, specific problem type, such as `validation-failed` or `resource-conflict`. 424 is only for what failed as a consequence.

Do not use it when a downstream service your server calls is down or misbehaving. That is your dependency, not the client's request, and it is a 5xx: `bad-gateway` (502), `gateway-timeout` (504) or `service-unavailable` (503). The name invites this mistake, and it tells the client to fix something it cannot fix.

Do not use it for independent items in a batch. If item 4 does not depend on item 3, item 3 failing is no reason to skip item 4: process it and report its own result.

Do not return it as the top-level status of a single compound operation. Return the failing step's problem at the top level instead. A top-level 424 tells the client something broke without telling it what.

## Example response

Per-item results inside a [`207 Multi-Status`](/status-codes/207) batch response, where operation 1 depended on operation 0:

```json
{
  "results": [
    {
      "status": 422,
      "error": {
        "type": "https://apiguide.dev/errors/validation-failed",
        "title": "Validation Failed",
        "status": 422,
        "detail": "The email must be a valid email address.",
        "operation": 0
      }
    },
    {
      "status": 424,
      "error": {
        "type": "https://apiguide.dev/errors/failed-dependency",
        "title": "Failed Dependency",
        "status": 424,
        "detail": "This operation was not attempted because operation 0, which it depends on, failed.",
        "operation": 1,
        "dependsOn": 0
      }
    }
  ]
}
```
