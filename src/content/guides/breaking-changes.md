---
title: "What Counts as a Breaking Change"
description: "Why the contract is what consumers observe rather than what you documented, which additive changes still break clients, and why fixing a bug can be a breaking change."
category: "evolution"
---

## The Contract Is What They Observe

Most teams have a working definition of a breaking change that goes something like: removing a field, renaming a field, or changing a type. It is a useful list and it is not a definition, because it describes a handful of changes rather than the property they share.

The property is this. A change is breaking if a consumer who is working today stops working afterward. That is decided by what consumers actually depend on, and consumers depend on what they can see, not on what you wrote down.

This is [Hyrum's Law](https://www.hyrumslaw.com/), named for Hyrum Wright:

> With a sufficient number of users of an API, it does not matter what you promise in the contract: all observable behaviors of your system will be depended on by somebody.

The practical consequence is uncomfortable. Your documentation does not define your contract. It defines the part of your contract you meant to offer. The rest of it was published anyway, the first time you returned a response.

---

## 1. What "Observable" Actually Covers

The list is longer than the one in most versioning policies, and every item on it is something a team has changed while calling it an implementation detail.

| Observable | How a consumer comes to depend on it |
| :--- | :--- |
| Ordering of a collection | The results happen to arrive sorted by primary key, so nobody adds a sort |
| The exact wording of an error | A client matches on the message string because the code was too coarse |
| Response timing | A client's timeout is tuned to how fast you are today |
| Number formatting | `1.0` against `1`, or trailing zeros on a decimal, parsed by something strict |
| Null versus absent | A key that is omitted when empty, rather than present and `null` |
| Whitespace and key order in the body | A signature computed over the raw bytes. See [webhook signature verification](/guides/webhook-signatures) |
| Which status code a failure uses | Retry logic branches on `5xx` but not `4xx`. See [retries and backoff](/guides/retries-backoff) |
| Pagination page size when unspecified | A client that never sends a limit and sizes its buffer for twenty |
| Case of an enum value | `"ACTIVE"` against `"active"` in a `match` |
| Presence of an unrequested field | A strict schema validator that rejects unknown keys |

None of these is usually in a specification. All of them are in the responses.

---

## 2. Requests and Responses Break in Opposite Directions

This asymmetry is the single most useful thing to internalize, and it explains most of the confusing cases.

For a **request**, you are the reader. Accepting more is safe; accepting less is breaking.

For a **response**, you are the writer. Returning less is breaking; returning more is *risky*, which is the surprising half.

| Change | Request | Response |
| :--- | :--- | :--- |
| Add a field | Safe, if optional with a compatible default | Risky: breaks strict validators and exhaustive deserializers |
| Remove a field | Breaking for anyone still sending it | Breaking |
| Add an enum value | Safe | Breaking for exhaustive handling |
| Relax validation | Safe | Not applicable |
| Tighten validation | Breaking | Not applicable |
| Make optional field required | Breaking | Not applicable |
| Make required field optional | Safe | Breaking: consumers assumed it was always there |

The "add a field to a response is risky" row is the one people argue with. It is safe only if every consumer ignores unknown fields, and that is a property of their code, not of your intention. You can ask for it in your documentation. You cannot rely on it unless you can see their parsers.

---

## 3. Adding an Enum Value Is a Breaking Change

It deserves its own section because it is the most commonly missed, and because it usually ships in a release labeled "minor".

A consumer handling your `status` field exhaustively looks like this:

```php
$label = match ($order->status) {
    'pending'   => 'Awaiting payment',
    'shipped'   => 'On its way',
    'cancelled' => 'Cancelled',
};
```

Ship a `refunded` status and that `match` throws `\UnhandledMatchError` in production. The consumer did nothing wrong. Exhaustive handling is the correct way to write that code, and static analysis will have encouraged it.

You have three honest options:

- **Treat new enum values as breaking**, and ship them with a version. Correct and expensive.
- **Document the enum as open from day one**, state that consumers must handle unknown values, and give them a defined fallback. Cheap, but only if you do it before the first consumer arrives.
- **Never widen an enum**, and model the new case as a separate field. Safe and it distorts your domain model to protect your release process.

The second option is the one to take, and the time to take it is before you have users. Say in the documentation that the set is open, return a documented `unknown` bucket for older versions where you can, and the widening stops being a break.

---

## 4. Fixing a Bug Can Be a Breaking Change

This follows directly from the definition and it still surprises people, because "bug fix" feels like the opposite of "breaking change". Semantic versioning encourages that feeling: a patch release is for bug fixes, and patch releases are meant to be safe.

But consumers do not build against your intent. They build against your behavior. If your behavior was wrong and they worked around it, the workaround is now part of how their code functions, and correcting the behavior is what breaks them.

Four shapes this takes:

**The workaround becomes the dependency.** An endpoint has an off-by-one in its pagination and returns twenty-one items for `limit=20`. A consumer noticed and slices to twenty. You fix the off-by-one, and now they silently drop a record on every page.

**The wrong value was being parsed correctly.** A timestamp is documented as [RFC 3339](/guides/timestamps-and-formats) but emits a month without zero-padding. Consumers wrote a custom parser to cope. You fix the padding and the custom parser fails on the correct value.

**The wrong status code was load-bearing.** A validation failure returns `500` where it should return [`422`](/status-codes/422). A consumer's retry policy retries `5xx`, so their integration recovers from transient cases by accident. You fix it to `422`, retries stop, and a class of failure that used to self-heal now surfaces to their users.

**Accidental tolerance was being used.** Validation was looser than documented and accepted a value it should have rejected. A consumer sends that value in production. Tightening the check is correct and it is an outage for them.

In each case the fix is right and you should still ship it. The point is not that bugs are permanent. It is that **"is this breaking?" and "is this correct?" are independent questions**, and answering the second does not answer the first.

Practically: a bug fix that changes observable behavior gets the same treatment as any other breaking change. Version it, announce it, and give people a window. See [deprecation and sunsetting](/guides/deprecation-sunsetting). The exception is a security fix, where the risk of leaving it in place outweighs the cost of the break, and even then the break is worth announcing rather than pretending it did not happen.

---

## 5. What Is Genuinely Safe

Shorter than the list of hazards, which is the honest shape of this subject.

- **Adding a new endpoint.** Nothing observes an endpoint that does not exist.
- **Adding a new optional request parameter** whose absence produces exactly today's behavior.
- **Adding a new response field**, if and only if you established a tolerant-reader expectation before you had consumers, and preferably if you can observe that they honor it.
- **Relaxing request validation**, accepting input you previously rejected.
- **Adding a new error [`type`](/guides/error-handling)** for a condition that previously had no specific type, provided the status code does not change.
- **Performance improvements**, unless something depended on the timing, which for anything with a timeout or a race is a real possibility rather than a joke.

Notice how many entries carry a condition. That is the subject being honest about itself.

---

## 6. The Test to Apply

One question, asked before the change ships:

> Could a reasonable consumer have written code that works against the current behavior and stops working against the new one?

Not "does the specification permit this". Not "should they have relied on that". **Could they, reasonably, and would it break.** If the answer is yes, it is a breaking change, and what you do about it is a separate decision from what you call it.

Two habits make the question answerable rather than theoretical:

- **Know who is calling what.** Per-version and per-endpoint usage metrics turn "some consumer might depend on this" into a list of accounts you can email. See [API versioning strategies](/guides/versioning).
- **Diff your specification in CI.** A machine comparing this release's OpenAPI document against the last one catches removed fields, widened enums and tightened validation without anyone having to remember. It will not catch ordering or timing, which is why the table in section 1 exists.

---

## 7. When You Have to Break Something

You will. The goal was never to avoid breaking changes, which would mean never improving anything. The goal is that no consumer finds out by being broken.

1. **Version it.** Whichever strategy you use, this is what versions are for. See [API versioning strategies](/guides/versioning).
2. **Announce it in-band.** Send [`Deprecation`](/headers/deprecation) and [`Sunset`](/headers/sunset) on the affected responses, with real dates. A changelog nobody subscribes to is not an announcement.
3. **Find out who is still calling.** Usage metrics per version, then contact them directly. The number of affected consumers is almost always small enough to email.
4. **Brownout before you remove.** Short, scheduled outages of the old behavior, announced in advance, so integrations fail while someone is watching rather than on the day you delete it. Covered in [deprecation and sunsetting](/guides/deprecation-sunsetting).
5. **Remove it.** By this point removal day should be uneventful, which is the entire objective.

The failure mode this avoids is the common one: the change ships, nothing appears to happen because the affected consumer runs a monthly batch, and the outage arrives five weeks later with no obvious cause.
