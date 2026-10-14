---
title: "Protocol Buffers"
description: "Google's language-neutral schema language and binary serialization format: proto3 and Editions, the wire format, field numbers, the rules for evolving a schema safely, and the JSON mapping."
currentVersion: "Edition 2024"
officialUrl: "https://protobuf.dev/"
---

## What are Protocol Buffers?

JSON carries its field names in every message and its types in nobody's head. Protocol Buffers (protobuf) moves both into a schema, a `.proto` file that both sides compile, and sends only field numbers and values on the wire. Messages are smaller and faster to parse, and every consumer gets generated, typed code from the same definition.

Protobuf is the interface definition language and serialization format behind [gRPC](/specifications/grpc), and it is also used on its own: as a message format for queues, as a storage format, and as the schema for the [OpenTelemetry](/specifications/opentelemetry) OTLP protocol. The thing to understand about it is that the field **number** is the contract. Names, comments and even the message's own name can change; the numbers cannot.

---

## 1. proto3 and Editions

For years a `.proto` file declared `syntax = "proto2";` or `syntax = "proto3";`, and the two differed in field presence, enum behavior and default encoding. **Editions** replace both designations. Instead of two fixed dialects, an edition is a set of named features with default values, and any feature can be overridden at file, message or field level.

```protobuf
edition = "2024";

package shop.orders.v1;

message Order {
  string id = 1;
  int64 total_minor = 2;
  OrderStatus status = 3;
  repeated LineItem items = 4;
}

enum OrderStatus {
  ORDER_STATUS_UNSPECIFIED = 0;
  ORDER_STATUS_PLACED = 1;
  ORDER_STATUS_SHIPPED = 2;
}
```

| Feature | proto2 | proto3 | Editions 2023 and 2024 |
| :--- | :--- | :--- | :--- |
| `field_presence` | `EXPLICIT` | `IMPLICIT` (`EXPLICIT` with `optional`) | `EXPLICIT` |
| `enum_type` | `CLOSED` | `OPEN` | `OPEN` |
| `repeated_field_encoding` | `EXPANDED` | `PACKED` | `PACKED` |

The latest released edition is 2024. Editions change the language and the generated code, not the wire format, so a message encoded from a proto3 file decodes against an editions file describing the same fields. New files should use an edition; existing proto3 files can stay as they are until you have a reason to migrate.

The presence default is the change that matters most for APIs. Under proto3's implicit presence, a scalar set to its zero value (`0`, `""`, `false`) is indistinguishable from one that was never set, so "set the discount to zero" and "do not touch the discount" are the same message. Under explicit presence you can tell them apart. In proto3, mark such fields `optional`.

---

## 2. The Wire Format

A serialized message is a sequence of records. Each starts with a **tag**, a varint computed as `(field_number << 3) | wire_type`, followed by the value:

| Wire type | Name | Used for |
| :--- | :--- | :--- |
| `0` | VARINT | `int32`, `int64`, `uint32`, `uint64`, `sint32`, `sint64`, `bool`, `enum` |
| `1` | I64 | `fixed64`, `sfixed64`, `double` |
| `2` | LEN | `string`, `bytes`, embedded messages, packed repeated fields |
| `5` | I32 | `fixed32`, `sfixed32`, `float` |

Wire types 3 and 4 are deprecated group delimiters. A varint stores 7 bits per byte, with the high bit as a continuation flag. Setting field 1 to `150` encodes as three bytes:

```text
08 96 01
08    = tag: field 1, wire type 0 (VARINT)
96 01 = varint 150
```

Field names never appear on the wire, which is why a decoder without the schema sees only numbers. Two consequences follow. Field numbers 1 to 15 take one byte to encode, so give them to the fields present in most messages. And negative numbers in an `int32` or `int64` always take ten bytes; use `sint32` or `sint64`, which use ZigZag encoding, for fields that are often negative.

---

## 3. Evolving a Schema

Protobuf is designed for old and new code to exchange messages, and it delivers that as long as you follow its rules. Parsers skip fields they do not know, and proto3 and editions preserve those unknown fields when re-serializing, so a new field passes through an old intermediary intact.

| Change | Safe? |
| :--- | :--- |
| Add a new field with a new number | Yes. Old readers ignore it. |
| Rename a field | On the wire, yes. Breaks the JSON mapping and generated code call sites. |
| Delete a field and `reserved` its number and name | Yes. |
| Delete a field without reserving it | No. Someone will reuse the number. |
| Reuse a field number | Never. Old data decodes as the wrong field. |
| Change between `int32`, `uint32`, `int64`, `uint64` and `bool` | Wire-compatible, but values may be truncated. |
| Change any other type | Almost never safe. |
| Move an existing field into an existing `oneof` | No. |
| Add a required field (proto2, or `LEGACY_REQUIRED`) | Never. |

```protobuf
message Order {
  reserved 5, 8 to 10;
  reserved legacy_coupon;
  string id = 1;
}
```

In editions, reserved names are bare identifiers, as above; proto3 quotes them (`reserved "legacy_coupon";`). Field numbers run from 1 to 536,870,911, excluding 19,000 to 19,999, which are reserved for the implementation.

Give every enum a zero-valued `_UNSPECIFIED` first entry. It is the value a reader sees when the field was not set, and if zero means something real, such as `PLACED`, you cannot distinguish "placed" from "missing". Enums are open in proto3 and editions, so a reader keeps an unknown value rather than discarding it; write handlers that tolerate values they do not recognize.

For the wider discipline, see [breaking changes](/guides/breaking-changes).

---

## 4. The JSON Mapping

Protobuf defines a canonical JSON encoding, which gRPC transcoding, OTLP/HTTP's JSON mode and many gateways use:

```json
{
  "id": "ord_9f8e7d6c",
  "totalMinor": "4999",
  "status": "ORDER_STATUS_PLACED"
}
```

* Field names become lowerCamelCase (`total_minor` becomes `totalMinor`), overridable with `json_name`. Parsers must accept both forms.
* 64-bit integers are **strings**, so that JavaScript and other double-based parsers do not lose precision.
* Enums are their value names; `bytes` are standard base64 with padding.
* `google.protobuf.Timestamp` is an RFC 3339 string; `Duration` is seconds with an `s` suffix, such as `"1.500s"`.
* Fields without presence that hold their default value are omitted from the output.
* Parsers reject unknown fields by default.

That last rule is the opposite of the binary format, and it is why a protobuf API exposed as JSON is less forgiving. In binary, renaming a field is safe and adding one is invisible to old readers; in JSON the name is the key, so a rename breaks every client, and a new field breaks any strict parser that has not been told to ignore unknown fields. Treat field names as permanent if anything consumes your messages as JSON.
