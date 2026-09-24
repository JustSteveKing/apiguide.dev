---
title: "Agent-Ready API Checklist"
description: "A review checklist for an existing API and its webhooks, covering the contract, errors, idempotency, deprecation, delivery and enforcement. Written for consumers that cannot ask you a question."
category: "core"
---

## Why This Checklist Exists

Every API has two kinds of consumer. One is a person, who reads your documentation, infers what you meant, tries something, gets confused, and eventually asks. The other is an autonomous agent, which receives your specification flattened into a set of tool definitions and then acts on it. The difference that matters is not intelligence. Only one of them can ask a follow-up question.

That makes an agent the strictest consumer your API will ever have, and a useful one to design for. A human reads endpoint one, meets an inconsistency at endpoint fifty, and adapts. An agent reads endpoint one and *generalises*, so an inconsistency is no longer an aesthetic complaint. It produces a confidently wrong call. A description that is vague becomes a wrong parameter. An error returned as `200 OK` becomes a success. A retry with no idempotency guarantee becomes a duplicate charge.

The useful consequence is that almost nothing here is new. These are the same practices that make an API pleasant for people; agents simply remove the tolerance that let you skip them. Work through the checklist against an API you already have. Each row states what to check, why it matters to a caller that cannot ask, and where the full treatment lives.

---

## 1. The Specification Is the Interface

An agent never sees your controllers, your documentation site, or your README. It sees a machine-readable specification, converted into tool definitions. Whatever is missing from that document does not exist.

| Check | Why it matters |
| --- | --- |
| A specification exists and is generated from, or verified against, the running API | A specification that drifts is worse than none. It is confidently wrong, and it is the only thing the caller has |
| Every operation has an `operationId` that is unique, stable and under 64 characters | The `operationId` typically becomes the tool's function name. OpenAI caps names at 64 characters and Anthropic at 128, so 64 is the safe intersection; longer names are rejected outright rather than truncated |
| Every operation has a description that states what it does *and when to use it* | The description is the entire prompt the caller reasons over. "Gets a user" does not distinguish this operation from the three beside it |
| Every parameter and response property is typed and described | An untyped `data` object is an instruction to guess |
| Request and response examples are complete payloads, not fragments | A caller assembling a body from leaf-level examples will omit whatever had none |
| Schema nesting stays shallow, five levels being a practical ceiling | Deeply nested schemas exceed provider limits and are assembled incorrectly long before that |

A quick way to see what you are actually shipping: take one operation, generate the tool definition from it, and read that definition without the specification beside you. If you cannot tell what the operation does or how to call it, neither can the caller.

See [REST principles](/guides/rest-principles) and [OpenAPI](/specifications/openapi).

---

## 2. Resources Are Use-Cases, Not Tables

The fastest way to make an API hard to call is to expose the schema. Table-shaped endpoints push the domain onto the caller: it has to know which three writes constitute "refund an order", in what sequence, and what to do when the second fails.

| Check | Why it matters |
| --- | --- |
| Resources are named for things the product does, not tables it stores | A caller reasons about the domain it was given. Give it the wrong one and it reasons well about the wrong thing |
| One canonical path per resource, with aliases removed or documented as aliases | Two paths with identical descriptions force an arbitrary choice, and half of those choices will be wrong |
| Nesting stops at one level | `/orders/{id}/refunds` is navigable; three levels deep is a guess about hierarchy |
| Identifiers are opaque and stable | An identifier a caller can construct is one it will construct incorrectly |
| Naming, casing and pluralisation are uniform across every endpoint | This is the whole of it: consistency is what lets a caller generalise from the first endpoint to the fiftieth. It is also why a slightly imperfect convention applied everywhere beats a perfect one applied in places |
| A multi-step operation is exposed as one operation where it is really one intention | Otherwise the caller orchestrates a transaction it cannot roll back |

See [resource naming](/guides/resource-naming).

---

## 3. Errors Are Part of the Contract

An error is not the absence of a response. It is a documented outcome, and for a caller with no human to escalate to, it is the only signal available to choose what to do next.

| Check | Why it matters |
| --- | --- |
| Errors use `application/problem+json` per RFC 9457, across the whole API | One shape, learned once. A caller that can parse one error can parse all of them |
| Framework and validation errors go through the same shape | The default error page is the one a caller meets first and the one nobody styles |
| **No error is ever returned with a `200`** | A `200` carrying `"error": true` is not an error to a caller that branches on status. It is a success with strange contents |
| Callers branch on the stable `type` URI, never on the human-readable prose | Prose is for people and gets rewritten. The `type` is the machine-readable part and must not change |
| Every `type` URI resolves to a page that documents that error | This is the only part of your contract that ships with a URL inside it, and therefore the only part a confused caller can look up unaided |
| The response says what to do next, not only what went wrong | "Retry after 30 seconds" and "this will never succeed" are different instructions |
| Internals never leak: no stack traces, no SQL, no internal hostnames | A verified caller is still not a trusted one |

The resolvable `type` is the item most often skipped, and the cheapest to fix. Either point at a published catalogue, where every error in [the error reference](/errors) has a stable URI such as [idempotency key conflict](/errors/idempotency-key-conflict) or [validation failed](/errors/validation-failed), or host your own under a path like `/problems/{type}` and keep a page per type. What matters is that the URI resolves to something that explains the error, rather than being a namespaced string that 404s.

See [error handling](/guides/error-handling) and [input validation](/guides/input-validation).

---

## 4. Writes Survive Being Retried

A caller that does not get a response does not know whether the write happened. It will try again, and an agent will do so immediately, without the pause a human takes to check.

| Check | Why it matters |
| --- | --- |
| Unsafe writes accept an `Idempotency-Key` | Without one, "retry" and "duplicate" are the same request |
| The stored key is fingerprinted against the request body | Otherwise the same key with different contents silently returns the first result, which is a harder bug than a duplicate |
| A reused key with a different body returns a conflict, not a success | See [idempotency key conflict](/errors/idempotency-key-conflict) |
| The retention window for keys is documented | A caller cannot reason about a window it does not know |
| `GET`, `PUT` and `DELETE` are genuinely safe or idempotent as HTTP specifies | Free interoperability, and callers assume it whether or not you honoured it |
| Conditional requests are available for read-modify-write | `ETag` and `If-Match` beat inventing an optimistic-concurrency scheme |

One caveat worth stating, because the rule is often applied mechanically: an endpoint whose `POST` is a pure function (validate this document, convert this payload, look up this identifier) has nothing to make idempotent, because calling it twice already produces the same result and changes no state. Adding a key there is ceremony. The check is not "does every write have a key" but "do you know which of your writes have effects".

See [idempotency](/guides/idempotency) and [conditional requests](/guides/conditional-requests).

---

## 5. Collections Do Not Trap the Caller

| Check | Why it matters |
| --- | --- |
| Large or feed-like collections use cursor pagination | Offsets skip and repeat rows under concurrent writes, and a caller paging an unstable list cannot tell |
| The response states whether more pages exist, unambiguously | An empty final page is a cheaper contract than inferring completion from a short one |
| Filterable and sortable fields are allow-listed and documented | An unlisted filter is a guess, and a guess that silently returns everything is a bad one |
| Default and maximum page sizes are documented and enforced | A caller asked to "fetch all" will ask for all |
| An invalid cursor returns a documented error | See [invalid pagination cursor](/errors/invalid-pagination-cursor) |

See [pagination](/guides/pagination) and [filtering, sorting and searching](/guides/filtering-sorting-searching).

---

## 6. Change Is Announced in the Response

A caller integrated six months ago and is not reading your changelog. The only channel guaranteed to reach it is the response it is already parsing.

| Check | Why it matters |
| --- | --- |
| Most change is additive, so most change needs no new version | Tolerant readers and additive responses are what let an API evolve without a `v2` |
| Deprecated operations send a `Deprecation` header, **RFC 9745** | Two separate RFCs, frequently conflated |
| Retiring operations send a `Sunset` header with a real date, **RFC 8594** | "Soon" is not a date, and a caller cannot schedule against it |
| A `Link` relation points at the migration guide | The header says something is ending; the link says what to do |
| Usage is instrumented per version | You cannot retire what you cannot see, and "who is still calling this" is the only question that matters at the end |
| Nothing is removed without having been announced in a response first | A surprise `404` is indistinguishable from an outage |

See [deprecation and sunsetting](/guides/deprecation-sunsetting) and [versioning](/guides/versioning).

---

## 7. The Webhooks You Send Are an API Too

Everything above applies to the events you push, and this is the half most teams never review. A webhook is an API you published without writing down.

| Check | Why it matters |
| --- | --- |
| The payload is signed, and the signature covers the raw body | Signing a re-serialised payload is the most common implementation bug in the whole subject |
| The signature scheme is documented well enough to implement without asking | Receivers get this wrong in ways that fail intermittently |
| Every delivery carries a unique, stable event identifier | It is the key a receiver dedupes on, and dedupe is the only defence that neutralises retries, replays and at-least-once delivery at once |
| Every payload carries an explicit event `type` | Two payloads that are otherwise just fields over the same object must not be interchangeable, because a caller must never be able to present one as the other |
| A change to a payload is a new event type, not a quiet mutation | Receivers parse these; a silently added meaning is a silently broken receiver |
| The retry schedule is published: how many attempts, what backoff, when you give up | Without it a receiver cannot distinguish "still coming" from "lost", and cannot size its own replay window |
| The tolerance window on a signed timestamp is wider than your last retry | Otherwise your own final retry fails verification |
| **Delivery is dispatched after the transaction commits** | Otherwise the notification can arrive before the row it describes is readable, and the receiver fetches a resource that does not exist yet. The outbox pattern exists for this |
| A replay or re-delivery mechanism exists | Receivers have outages, and the alternative is a support ticket |

Consider whether a shared secret is the right root of trust. HMAC is the common case and is fine, but it gives every receiver a key capable of forging your signatures, and the signature stops meaning anything once the body is copied out of the request. Asymmetric signing, where you hold a private key and publish a public one, keeps verifying after a receiver has stored the payload, which is exactly what a receiver handling anything auditable should do with it.

See [webhooks](/guides/webhooks) and [webhook signature verification](/guides/webhook-signatures).

---

## 8. The Webhooks You Receive Assume Nothing

The same rules, inverted. A webhook endpoint is a public URL that accepts unsolicited requests from the internet.

| Check | Why it matters |
| --- | --- |
| **Verify before anything else touches the database** | Verification is a gate, not a step. Anything before it runs on unauthenticated input |
| The signature is computed over raw bytes captured before body parsing | Re-serialising changes key order, whitespace and escaping |
| Comparison is constant-time | Ordinary string equality leaks how many leading bytes were correct |
| The timestamp is checked against a tolerance window | A valid captured request replays perfectly otherwise |
| The raw payload is stored before it is processed | If processing fails you still have the evidence, and you can reprocess without asking for a replay |
| Processing happens asynchronously; the endpoint acknowledges quickly | A slow receiver looks like a failed one and earns retries you did not need |
| The handler is idempotent, keyed on the sender's event identifier | Assume at-least-once delivery, because that is what you are being given |
| Out-of-order arrival is handled | Retries reorder events by construction |
| Failures land somewhere a person will see them | An endpoint that quietly returns `200` and drops the event is the worst available outcome |

---

## 9. Delivery History, Not Delivery State

This is the item that is almost universally missing, and the one that decides whether an integration problem takes ten minutes or a week.

Recording the *current state* of a delivery is not the same as recording its *history*. A row carrying `delivered_at`, an attempt counter and a last-error field clears the error on success. A delivery that failed five times and then succeeded therefore reads, forever afterwards, as though it had always worked. The information you need to fix anything is the information that got overwritten.

| Check | Why it matters |
| --- | --- |
| One record per attempt, not per delivery | The history is the point; the current state is derivable from it |
| Each attempt records status code, attempt number, total attempts, duration and error | Enough to diagnose without reproducing |
| **A response that never arrived stores a null status, not a `0`** | "We never heard back" and "it returned 500" need different fixes, and rendering the second when you mean the first sends someone hunting an access log for a request that was never made |
| The record says what happens next, not only what happened | `retrying`, with a predicted next attempt, tells the reader to wait. `failed` tells them to act. Predicting it means matching your queue's backoff exactly, including how it behaves once the schedule is exhausted |
| Response bodies are not stored | A receiver's error page can contain anything; the status code answers the question |
| Every outbound notification goes through one path that sends *and* records | Two jobs each doing their own HTTP call and their own bookkeeping is how one webhook ends up well-instrumented and the other invisible |
| The history is visible to the customer, not only to you | Otherwise someone can configure an endpoint that has never once worked and have no way to discover it |
| Delivery history is retained on its own schedule, separately from domain data | Retry noise is your behaviour, not the customer's history |

See [observability and tracing](/guides/observability-tracing).

---

## 10. Enforce It, Because Review Does Not Scale

Every item above is a rule someone can agree with and then not apply. A convention that depends on remembering holds until the next deadline.

| Check | Why it matters |
| --- | --- |
| The specification is linted in CI, and the build fails on regression | The specification is the artefact the caller consumes, so it is the artefact to gate |
| The lint covers descriptions, naming, examples and error shapes, not only schema validity | A document can be valid OpenAPI and still be unusable. Validators already exist; this is a different check |
| Each rule reports why it fired, not only that it did | A report that does not explain itself is noise a team learns to skip |
| New endpoints are checked against this list before they ship | Retrofitting consistency across fifty endpoints costs far more than applying it to one |

Specification linting is a solved problem with several tools available; see [API tooling](/tools). Webhook contracts have no equivalent, so for now section 7 through section 9 remain a review rather than a gate. That is a good reason to do the review deliberately, and to write down what you decided.

---

## Using This

Run it against one API rather than all of them, and in order. Sections 1 to 6 are the request/response contract, 7 to 9 are the event contract, and section 10 is what stops the result decaying. Most teams find the first four sections mostly satisfied and the last three mostly absent, because the outbound event surface is the one that never had a design review.

None of this is specific to agents. It is what an API owes any consumer that has to integrate without being able to ask you a question: a partner team in another timezone, an SDK generated from your specification, a customer's CI job, or a language model. Agents are just the consumer that made the cost visible.
