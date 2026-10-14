---
title: "Generating SDKs from OpenAPI"
description: "Generated against handwritten client libraries, what an OpenAPI document needs before a generator can produce a good SDK, versioning the SDK separately from the API, and the retry, idempotency, pagination and User-Agent behavior an SDK should own."
category: "evolution"
---

## An SDK Is a Second Contract

For many consumers, the SDK is the API. They never see a status code or a header; they call `client.invoices.create(...)` and handle an exception. Whatever your HTTP contract promises, what they depend on is the method names, the types, the exception classes and the behavior of the library you gave them.

That makes an SDK a second public contract layered on the first, with its own compatibility rules. A change that is perfectly safe at the HTTP level, such as renaming a schema in `components` or adding a value to an enum, can be a breaking change in a typed language once it has passed through a generator. And a change in the SDK, such as altering retry behavior, can change how your API is called without any change to the API at all.

Most of the quality of a generated SDK is decided before the generator runs, by the OpenAPI document it is given. This guide covers what that document needs, how to version what comes out, and the HTTP behavior an SDK should take responsibility for so that every consumer does not have to.

---

## 1. Generated or Handwritten

| | Generated | Handwritten |
| :--- | :--- | :--- |
| Coverage | Every operation, in every language, from day one | Whatever someone had time to write |
| Consistency across languages | High: same names, same shapes | Varies with each maintainer |
| Keeping up with the API | Regenerate on every change | Manual, and lags |
| Idiomatic feel | Depends heavily on the generator and on the document | As good as the author |
| Cost | Low per language, after the document is good | High per language, forever |

**Generate, and spend the effort on the document and on a thin handwritten layer where it matters.** Handwritten SDKs made sense when generators produced code nobody wanted to use. That is no longer true of the better generators, and the economics are lopsided: a handwritten SDK in five languages is five codebases that drift from the API and from each other.

The handwritten layer is for what a document cannot express: a webhook signature verification helper, a convenience method that composes three calls into one intention, a streaming helper for an endpoint that uses [server-sent events](/specifications/server-sent-events). Keep it in files the generator does not overwrite, using whatever extension mechanism your generator provides, so regeneration never erases it.

What not to do: generate once, then edit the generated code by hand. The first regeneration either destroys the edits or is never run again, and in both cases the SDK has stopped tracking the API.

---

## 2. What the Generator Needs From Your Document

A generator is a compiler with a very literal reading of your specification. Every ambiguity in the document becomes either a guess or a lowest-common-denominator type in the output.

| In the document | In the SDK | When it is missing |
| :--- | :--- | :--- |
| `operationId` | The method name | A name derived from the method and path, such as `postV1CustomersCustomerIdSources`, different in each generator |
| Tags | How methods are grouped into namespaces, such as `client.invoices` | Every method on one flat client |
| Named schemas in `components/schemas` | Named types | Inline schemas become generated names such as `CreateInvoiceRequestLinesItem`, or untyped maps |
| `discriminator` on a `oneOf` | A real union type the caller can switch on | A type the caller has to guess, or a generic object |
| `enum` | An enum type | A plain string with no autocomplete |
| `format` (`date-time`, `uuid`, `int64`) | The language's native type | A string, or a number that loses precision |
| `required` and nullability | Non-optional fields | Every field optional, and every access a null check |
| Descriptions | Docstrings in the caller's editor | No documentation at the point of use |
| Error responses with schemas | Typed exceptions carrying the error body | A generic exception with a status code |
| `securitySchemes` | Client configuration for credentials | Hand-set headers |

Three of these are worth singling out.

**Name every operation yourself.** The `operationId` is the most visible identifier in every SDK, and changing it later renames a method in every language. Choose stable, verb-first names that are unique across the document and survive the strictest naming rules among your targets. See [how an API becomes tool definitions](/guides/tool-definitions), which applies the same constraint for a different consumer.

**Name your schemas.** A request body defined inline gets a name invented by the generator, and that name changes if the generator's naming rules change or the schema moves. A schema in `components/schemas` with a deliberate name becomes a type you can document and keep stable.

**Use discriminators for polymorphism.** A `oneOf` without a discriminator forces the generated code to try each alternative in turn, and in some languages it cannot produce a usable type at all. Declare the property that distinguishes the variants:

```yaml
PaymentMethod:
  oneOf:
    - $ref: '#/components/schemas/Card'
    - $ref: '#/components/schemas/BankAccount'
  discriminator:
    propertyName: type
    mapping:
      card: '#/components/schemas/Card'
      bank_account: '#/components/schemas/BankAccount'
```

Lint for all of this in CI rather than discovering it in generated output. See [design-first governance](/guides/design-first-governance).

---

## 3. Version the SDK and the API Separately

The API and its SDKs have different compatibility rules, so they need separate version numbers. Use semantic versioning for each SDK, and decide what a major version means by asking whether code written against the previous release still compiles and behaves the same.

Changes that are safe for the API and breaking for the SDK:

- **Renaming a schema or `operationId`.** Invisible on the wire, a renamed type or method in every SDK.
- **Adding an enum value**, if the SDK generates closed enums. A typed client that deserializes an unknown value into a closed enum throws. Generate enums that tolerate unknown values, and document the enum as open. See [forward-compatible enums](/guides/forward-compatible-enums).
- **Making a response field optional.** On the wire, a field that is sometimes absent. In a typed SDK, a non-nullable property becoming nullable, which breaks every caller that reads it.
- **Upgrading the generator.** A new generator version can change names, types or runtime dependencies with no change to your document at all. Diff the generated output and treat the result like any other change.

And the reverse: a breaking API change does not always require a major SDK release, if the SDK can absorb it, but it usually does.

**Decide how the SDK chooses an API version.** If your API is versioned by header or date, have each SDK release send the API version it was generated against, so upgrading the SDK is the deliberate act that moves a consumer to a new API version. A consumer who never upgrades keeps the behavior they tested against. See [versioning](/guides/versioning).

Deprecations should reach SDK users too. Mark deprecated operations and fields in the document so the generator emits the language's deprecation annotation, and the warning appears in the caller's editor long before the [`Sunset`](/headers/sunset) date. See [deprecation and sunsetting](/guides/deprecation-sunsetting).

---

## 4. Retries and Idempotency Belong in the SDK

Every consumer needs retry logic and most write it badly: no jitter, retrying `400`s, ignoring [`Retry-After`](/headers/retry-after), or, worst, retrying a [`POST`](/methods/post) that charged a card. An SDK is the one place you can get it right once for everyone.

A sound default:

- **Retry** connection failures, timeouts, [`408`](/status-codes/408), [`429`](/status-codes/429), and [`502`](/status-codes/502), [`503`](/status-codes/503) and [`504`](/status-codes/504).
- **Do not retry** other `4xx` responses. They will fail the same way again.
- **Honor `Retry-After`** when present, and otherwise use exponential backoff with jitter and a cap on both the delay and the number of attempts.
- **Make it configurable**, including off, per client and per call.

Retrying a non-idempotent request is only safe with an idempotency key, and this is where an SDK earns its keep. If your API accepts an [`Idempotency-Key`](/headers/idempotency-key), the SDK should generate one for every unsafe request that does not already carry one, and **reuse the same key on every retry of that request.** A key regenerated per attempt is worse than none, because it looks safe. Let the caller supply their own key, so a request retried across process restarts can still be deduplicated.

Two related details:

- Expose the response's request ID, and anything else the caller needs for a support ticket, on both successes and exceptions.
- Map error responses to typed exceptions using the stable error `type`, not the status code alone, so callers can catch `InsufficientFundsError` rather than parsing a message. See [error handling](/guides/error-handling).

See [retries and backoff](/guides/retries-backoff) and [idempotency](/guides/idempotency).

---

## 5. Pagination as Iteration

A consumer who wants every invoice should not have to write a cursor loop. A good SDK exposes list operations as iterators that fetch the next page on demand, while still exposing single pages for callers who need to checkpoint their progress.

The obstacle is that OpenAPI has no way to say that an operation is paginated, or which parameter carries the cursor and which response field carries the next one. Generators fill the gap with their own configuration: Speakeasy reads an `x-speakeasy-pagination` extension on the operation, and Fern reads `x-fern-pagination`. Whichever you use, the configuration is only as easy to write as your pagination is consistent. One cursor parameter name and one response shape across every list endpoint is one rule; a different style per endpoint is a rule per endpoint.

See [pagination](/guides/pagination).

---

## 6. Identify the SDK on Every Request

Send a descriptive [`User-Agent`](/headers/user-agent) from every SDK: the SDK's name and version first, then the runtime, and let integrators prepend their own application's product token. RFC 9110 orders product tokens by decreasing significance:

```http
User-Agent: billing-sync/1.3 acme-python/4.2.0 python/3.12.4
```

This is what lets you answer the question every breaking change and every bug report eventually raises: which versions of which SDKs are still calling, and how much traffic do they carry. Without it, you cannot tell a consumer that their SDK version has a known bug, and you cannot retire an old behavior with any confidence about who it affects.

Do not put personal data in it, and do not use it for authorization. It is a self-reported string.

---

## 7. Choosing a Generator

Evaluate the options against your own document, in the languages you need, by reading the generated code, because output quality varies more by language than by vendor.

| Generator | What it is |
| :--- | :--- |
| [OpenAPI Generator](/tools/design-documentation/openapi-generator) | Open source and community maintained, with generators for over 50 client targets plus server stubs and documentation. Output quality varies by language generator |
| [Speakeasy](/tools/design-documentation/speakeasy) | Generates SDKs in seven languages, plus Terraform providers, CLIs and [MCP](/specifications/model-context-protocol) servers, from OpenAPI. Open-sourced under AGPL-3.0 in September 2026; a commercial license lets you license the generated SDKs however you like |
| [Fern](/tools/design-documentation/fern) | Hosted service, owned by Postman since January 2026, generating SDKs, API documentation and a CLI from OpenAPI, AsyncAPI, Protobuf or its own Fern Definition. Its public repository is no longer maintained, so generation runs through the hosted service |

Stainless, another commercial generator, stopped taking new signups, projects and SDKs in May 2026 when it joined Anthropic, and is winding down its hosted products. Existing customers keep the SDKs already generated; do not start a new project on it.

Questions that separate them in practice:

- **Does the output read like code a person in that language would write?** Naming, error handling, async support and dependency footprint are where generators differ most.
- **How are customizations preserved across regeneration?** If the answer is "edit the output", walk away.
- **Can retries, idempotency keys, pagination and authentication be configured** the way your API actually works, rather than the way the generator assumes?
- **What happens to published packages** if you stop using the vendor? The generated code should be yours, buildable without the service.

Whichever you choose, the document is the input that matters most. A generator cannot name a method you did not name, type a field you did not type, or document an error you did not describe.
