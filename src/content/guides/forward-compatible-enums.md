---
title: "Forward-Compatible Enums"
description: "How to add enum values without breaking clients: open versus closed enums, the tolerant reader, documented unknown handling, OpenAPI and JSON Schema patterns, protobuf's UNSPECIFIED zero value and GraphQL's enum caveats."
category: "evolution"
updatedDate: 2026-10-14
---

## The Enum You Will Need to Widen

Every enum in a response is a list you will want to extend. A `status` gains `refunded`, a `payment_method` gains a new wallet, an `event_type` gains a new event. [What counts as a breaking change](/guides/breaking-changes) explains why each of those additions breaks a consumer who handled the field exhaustively, and why that consumer was not wrong to do so.

This guide is the practical half: how to design enums so that widening them is a routine release instead of a new [version](/guides/versioning). The work has to be done before the first consumer integrates. After that, every consumer's handling of your enum is already written, and you cannot change it by editing your documentation.

---

## 1. Requests Are Closed, Responses Are Open

The direction of the data decides how strict an enum can be.

| Direction | Who validates | Rule |
| :--- | :--- | :--- |
| Request (client to server) | You | Closed. Reject an unknown value with a [`422`](/status-codes/422) or [`400`](/status-codes/400) naming the field and listing the accepted values |
| Response (server to client) | The consumer | Open. The consumer must accept values that did not exist when they integrated |
| Webhook or event payload | The consumer | Open, and more so: consumers update less often than they call you |

On input, strictness costs nothing. Adding a newly accepted value to a request enum is safe, because old clients never send it. On output, the consumer is the parser, and a closed enum in their generated code is a crash waiting for your next release.

---

## 2. The Tolerant Reader, Written Down

The [Tolerant Reader](https://martinfowler.com/bliki/TolerantReader.html) pattern says a consumer should read only what it needs and ignore what it does not recognize. For enums, "ignore" is not enough on its own: the consumer still has to do something with an order whose status it has never seen. So your documentation has to say what.

State three things for every response enum:

- **The set is open.** New values may be added in any release without notice or a version change.
- **What an unknown value means.** Usually the safest defined interpretation: an unknown order status is "in progress, not actionable", an unknown event type is "skip and acknowledge".
- **What not to do.** Do not fail the whole response, do not drop the record, do not retry.

Then make it easy to comply. A consumer written against that contract looks like this:

```typescript
type OrderStatus = "pending" | "shipped" | "cancelled" | (string & {});

function label(status: OrderStatus): string {
  switch (status) {
    case "pending":   return "Awaiting payment";
    case "shipped":   return "On its way";
    case "cancelled": return "Cancelled";
    default:          return "Processing"; // documented fallback for unknown values
  }
}
```

If you publish SDKs, build the fallback into them: deserialize unknown values into an explicit `unknown` case that preserves the raw string, rather than throwing. Consumers using your SDK then get forward compatibility without having read this paragraph.

For webhooks, a new event type is the same problem one level up. Document that consumers should acknowledge with a `2xx` status and ignore event types they do not handle; otherwise your new event triggers retries against every endpoint that has not upgraded. See [webhooks](/guides/webhooks).

---

## 3. OpenAPI and JSON Schema

JSON Schema's `enum` keyword is a closed set by definition: a value not in the list fails validation. Every code generator reads it that way, so an `enum` in a response schema tells consumers to write exactly the exhaustive code that breaks.

Use `enum` for request bodies and parameters. For response fields that may grow, describe the known values without closing the set. In OpenAPI 3.1, which uses JSON Schema 2020-12 and so supports the plural `examples` keyword, the pattern the Zalando guidelines recommend is:

```yaml
delivery_method:
  type: string
  examples:
    - PARCEL
    - LETTER
    - EMAIL
  description: >
    Extensible enum. The values listed are those currently returned;
    others may be added without notice. Treat unknown values as PARCEL.
```

Zalando previously recommended a vendor extension, `x-extensible-enum`, with the same meaning, and still documents it for OpenAPI versions before 3.1 that lack `examples`. It is not part of any specification, so tools that do not know it will ignore it, which for a response is the correct failure.

If you need validators to know the documented values, `anyOf` lets you list them and still admit unknown strings:

```yaml
status:
  anyOf:
    - enum: [pending, shipped, cancelled]
    - type: string
```

Whichever form you use, keep request and response schemas separate when they disagree. The same `status` can be closed on input and open on output, and one shared schema cannot say both.

---

## 4. Protocol Buffers: UNSPECIFIED Is Zero

[Protocol Buffers](/specifications/protocol-buffers) builds the unknown case into the format. Its own best-practice guidance is that every enum's first value should be a `_UNSPECIFIED` value at tag 0, with no business meaning:

```protobuf
enum OrderStatus {
  ORDER_STATUS_UNSPECIFIED = 0;
  ORDER_STATUS_PENDING = 1;
  ORDER_STATUS_SHIPPED = 2;
  ORDER_STATUS_CANCELLED = 3;
  reserved 4;
  reserved "ORDER_STATUS_ON_HOLD";
}
```

The zero value is what a reader sees when the field was never set, so giving it a real meaning ("pending") makes "not set" and "pending" indistinguishable forever.

Enums in proto3 and editions are **open**: a reader with an older schema keeps the unknown integer in the field rather than discarding it. What the application code sees depends on the language; Java, for instance, returns `UNRECOGNIZED` from the typed getter and the raw number from the matching `get<Field>Value()` getter. Proto2 enums are closed and move unknown values into the unknown-field set, so the field reads as unset.

Two rules for evolving them:

- **Reserve removed numbers and names**, as above, so nobody reuses a tag with a different meaning.
- **Watch the JSON mapping.** ProtoJSON serializes enums by name by default, and a reader on an older schema cannot parse a name it has never seen. The protobuf documentation treats adding enum values as safe for ProtoJSON only if every relevant client emits enums as integers. If you expose protobuf messages as JSON, check this before you widen anything.

---

## 5. GraphQL

[GraphQL](/specifications/graphql) enums are closed on both sides, and the specification enforces it. A server must return one of the enum's defined values, and raise a field error if it cannot. A field error on a non-null field propagates to the nearest nullable parent, so one unexpected enum value can null out a whole object in the response.

Because a GraphQL API is usually a single evolving schema, adding a value makes it immediately visible to every client, including those whose generated types were built from the previous schema. What breaks is the client's deserializer, not the server.

What works:

- **Turn on unknown-value handling in client code generation.** Many GraphQL client generators can emit a fallback case for unrecognized enum values. For first-party clients, make it mandatory.
- **Document enums as open** in their schema descriptions, the same as for REST.
- **Mark retiring values with `@deprecated`**, which the specification allows on enum values as well as fields, and keep returning them until usage reaches zero.

---

## 6. Removing and Renaming

Forward compatibility covers additions only. Removing a value from a response enum is breaking for anyone who reacts to it, and removing one from a request enum is breaking for anyone who sends it. Renaming is a removal plus an addition, with both costs.

Do it the slow way: add the new value, document the old one as deprecated, keep accepting the old value on input, and follow the [deprecation and sunset](/guides/deprecation-sunsetting) process before you stop emitting it. If a value's meaning has changed, it is a new value. Reusing the old name for different semantics breaks every consumer silently, which is worse than breaking them loudly.
