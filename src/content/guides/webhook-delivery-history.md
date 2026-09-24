---
title: "Webhook Delivery History"
description: "Why recording the current state of a webhook delivery is not the same as recording its history, what each attempt should store, and how to make the record useful to the customer rather than only to you."
category: "core"
---

## State Is Not History

Most webhook implementations record delivery state. The subscription row, or the event row, carries something like `delivered_at`, an attempt counter, and the last error. It is the obvious design, it answers "did this arrive", and it is close to useless the first time someone asks you why an integration is behaving strangely.

The reason is that state is overwritten and history is not. Consider a delivery that failed five times and then succeeded on the sixth. The error field is cleared on success, `delivered_at` is set, and the attempt counter reads 6. Read that row a week later and it says the delivery worked. **The information you need in order to fix anything is precisely the information that got overwritten.** You cannot see that the receiver was down for two hours, that it returned 502 four times and then a timeout, or that the delivery only landed because the schedule happened to stretch far enough.

The fix is unglamorous and permanent: **one record per attempt, not per delivery.** Current state stops being stored at all, because it is derivable from the attempt history, and a derived value cannot drift from the thing it derives from.

This guide covers what those records should hold. For the delivery mechanics themselves, see [webhooks](/guides/webhooks); for the retry schedule, see [retries, backoff and resilience](/guides/retries-backoff).

---

## 1. What Each Attempt Records

An attempt record should be enough to diagnose a problem without reproducing it.

| Field | Why |
| --- | --- |
| Event identifier | Ties the attempt to what was being delivered, and to the receiver's own dedupe key |
| Endpoint | Which subscription, since one event can fan out to several |
| Attempt number and total | "3 of 6" is a different message to the reader than "3" |
| Request timestamp | When it was sent, not when the row was written |
| Response status | The code, or null. See section 2 |
| Duration | A 200 that took 29 seconds is a problem the status code hides |
| Error | The transport-level failure, where there was one |
| Next attempt due | See section 3 |

Two fields that look useful and are not: a boolean `success`, which the status code already answers and which goes stale if your definition of success changes, and a mutable `state` on the attempt itself. An attempt is an event that happened. It does not have a state, it has an outcome.

---

## 2. Null Is Not Zero

When no response arrives, store a null status. Do not store `0`.

This looks like a triviality and is not. "We never heard back" and "it returned 500" call for different investigations. If a timeout renders as `0`, or worse as `500`, you send someone hunting through an access log for a request that was never completed, or blaming a receiver that never saw the request at all. A null status with a populated error field says "this did not reach the point of having a response", which is the actual finding.

The same discipline applies to the distinction between failure kinds. A DNS failure, a TLS handshake failure, a connect timeout, a read timeout and a 500 are five different problems with five different owners. Keep the transport error verbatim rather than flattening it into a generic "delivery failed".

---

## 3. Say What Happens Next

A record of what happened is half the job. The reader almost always wants to know what happens next, and the two need different responses from them.

An attempt marked `retrying`, with a predicted time for the next one, tells the reader to wait. An attempt marked `failed`, with no further attempts coming, tells them to act. Rendering both as "failed" makes every transient blip look like an outage and trains people to ignore the log.

Predicting the next attempt honestly means **matching your queue's backoff exactly**, which is more subtle than it sounds. Most job runners take a list of delays, and most of them repeat the final value once the list is exhausted rather than stopping. If your schedule is `[60, 300, 1800]` and the runner allows eight attempts, attempts four through eight are all 1800 seconds apart, not undefined. A prediction derived from the list alone will be wrong for most of the retries you actually make.

Publish the same schedule you implement. See [deprecation and sunsetting](/guides/deprecation-sunsetting) for the general principle: a consumer cannot plan against a behavior you did not tell them about.

---

## 4. One Path That Sends and Records

The most common way for this to go wrong is not bad schema design. It is having more than one piece of code that sends webhooks.

A system typically grows its notification surface in pieces. Event delivery gets a proper job, with retries and a delivery log. Then something smaller needs to notify a URL, an export finishing or a job completing, and it gets a direct HTTP call with a `Log::warning` on failure. That second path has no record. A customer can configure a notification URL that has never once worked, and there is no way for either of you to discover it, because nothing failed loudly enough to be noticed.

**Sending and recording belong to one service.** If a second call site can make an outbound request without writing an attempt record, the log is no longer a description of what your system sent; it is a description of what one part of it sent. Two jobs each doing their own HTTP call and their own bookkeeping is exactly how one webhook ends up well instrumented and the other invisible.

See [observability and tracing](/guides/observability-tracing).

---

## 5. What Not to Store

**Response bodies.** A receiver's error page can contain anything: their stack traces, their customer data, an HTML page megabytes long. The status code answers the question you actually have, and storing the body turns your delivery log into an uncontrolled copy of someone else's internals. If you need more than the status, store a bounded prefix of the body and say in your documentation that you do.

**Anything you cannot prune.** Delivery history is operational data about your own behavior, not a record of the customer's. It is noisy, it is high volume, and it ages badly. Give it its own retention window, shorter than the domain data it describes, and keep it out of any store whose contents are meant to be permanent or independently verifiable. Whether an event occurred is a fact about the customer. Whether you managed to post it six times is a fact about you.

---

## 6. Show It to the Customer

A delivery log that only you can read solves an internal problem and leaves the external one untouched.

The customer is the person who notices first that something is wrong, and without visibility their only available action is to open a support ticket that begins "are your webhooks working?". Give them the attempt history for their own endpoints, with the status, the timing and the next scheduled attempt, and most of those tickets never get written. It also surfaces the failure mode from section 4 in the one place it will actually be seen: someone looking at their own endpoint and finding that it has never received anything.

Two things worth exposing alongside it:

- **A replay control.** Receivers have outages. Without replay, the alternative to a support ticket is nothing.
- **The endpoint's recent health**, not just individual attempts. "This endpoint has failed every delivery for three days" is a different message from a list of failures, and it is the one that prompts action.

For where this sits in a wider review, see section 9 of the [agent-ready API checklist](/guides/agent-ready-checklist).
