---
title: Resource Locked
statusCode: 423
statusText: Locked
category: client-error
relatedCodes: ['resource-conflict', 'stale-resource-version', 'precondition-failed', 'account-frozen']
publishedDate: 2026-10-17
---

## When to use it

Use [`423 Locked`](/status-codes/423) when the client tries to change a resource that is locked, and the lock is an explicit state of that resource rather than a permission rule. RFC 4918, the WebDAV specification that defines the code, says it "means the source or destination resource of a method is locked".

In an API this covers a few common designs:

- **Edit locks.** A user has checked out a document for editing and holds a lock on it, and another caller tries to write.
- **Processing locks.** A long-running job is working on the resource, such as an invoice being finalized or a dataset being reindexed, and writes are refused until it finishes.
- **Holds.** A record is under a legal hold or an audit freeze and cannot be modified or deleted until the hold is released.

Say who or what holds the lock and, if you know, when it will be released. The client can then wait, ask the holder to release it, or tell the user why their edit was refused. If the lock is short-lived, send [`Retry-After`](/headers/retry-after).

## When not to use it

Do not use it when two writes collided and one lost because the resource changed underneath it. That is optimistic concurrency, not a lock: `precondition-failed` (412) when the client sent [`If-Match`](/headers/if-match), or `stale-resource-version` (409) when it sent a version in the body.

Do not use it when the request conflicts with the resource's state in some other way, such as canceling an order that has already shipped. That is `resource-conflict` (409). 423 is specifically about a lock that someone holds and could release.

Do not use it when the whole account is suspended. That is `account-frozen` (403). A lock applies to one resource; a frozen account blocks everything.

Do not use it for reads unless the lock really does block reads. Most locks only block writes, and refusing a [`GET`](/methods/get) on a document someone else is editing is rarely what anyone wants.

RFC 4918 says a 423 response SHOULD carry a precondition code such as `lock-token-submitted` or `no-conflicting-lock`. Those are WebDAV XML elements tied to its [`LOCK`](/methods/lock) method. Outside WebDAV, carry the equivalent information as extension members instead.

## Example response

```json
{
  "type": "https://apiguide.dev/errors/resource-locked",
  "title": "Resource Locked",
  "status": 423,
  "detail": "Invoice inv_2041 is being finalized and cannot be edited until finalization completes.",
  "instance": "/v1/invoices/inv_2041",
  "lockedBy": "finalization",
  "lockedAt": "2026-10-17T09:30:12Z",
  "expectedReleaseAt": "2026-10-17T09:31:00Z"
}
```

If clients can take locks themselves, return the lock's owner and expiry here, and make sure every lock expires. A lock with no timeout outlives the client that took it, and someone eventually has to clear it by hand.
