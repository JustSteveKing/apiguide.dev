---
title: "Smithy"
description: "A reference for Smithy, the protocol-agnostic interface definition language from AWS: IDL 2.0 shapes, services, resources and operations, traits, the restJson1 and rpcv2Cbor protocols, code generation, and how it relates to OpenAPI."
currentVersion: "Smithy 2.0 (IDL version 2)"
officialUrl: "https://smithy.io/2.0/index.html"
updatedDate: 2026-10-17
---

## What is Smithy?

Smithy is an interface definition language for describing services and generating clients, servers and documentation from that description. It comes from Amazon Web Services, where the IDL it is based on has been used internally for over a decade, and AWS uses it to model its services and generate SDKs. The language, the build tooling and several code generators are open source under the `smithy-lang` organization.

The design decision that separates it from [OpenAPI](/specifications/openapi) is that Smithy is **protocol agnostic**. A Smithy model describes the shapes of data and the operations of a service; how those operations appear on the wire is a separate choice, expressed by applying a protocol trait. The same model can be served as a REST API with JSON bodies, as an RPC API with CBOR bodies, or both. OpenAPI starts from the HTTP request and works inward; Smithy starts from the service and treats HTTP as one binding of it.

If you are building a single HTTP API whose consumers want an OpenAPI document, write OpenAPI. Reach for Smithy when you generate SDKs in several languages and care about their quality, when one service is exposed over more than one protocol, or when you want resource lifecycle rules checked at build time rather than in review.

---

## 1. The IDL

A model file declares its IDL version, a namespace, and then shapes. The version control statement for the current IDL is `$version: "2"`; a minor version such as `"2.1"` can be stated when a model depends on a feature from that release.

```text
$version: "2"
namespace example.weather

service Weather {
    version: "2006-03-01"
    resources: [City]
}

resource City {
    identifiers: { cityId: CityId }
    read: GetCity
    list: ListCities
}

@readonly
operation GetCity {
    input := {
        @required
        cityId: CityId
    }
    output := {
        @required
        name: String
    }
    errors: [NoSuchResource]
}

@pattern("^[A-Za-z0-9 ]+$")
string CityId
```

Every shape has a shape ID such as `example.weather#City`. Traits are the `@`-prefixed annotations, and they are where almost all of the meaning lives: constraints, documentation, protocol bindings, pagination and more.

---

## 2. Shapes

| Kind | Shapes |
| :--- | :--- |
| Simple | `blob`, `boolean`, `document`, `string`, `byte`, `short`, `integer`, `long`, `float`, `double`, `bigInteger`, `bigDecimal`, `timestamp` |
| Aggregate | `list`, `map`, `structure`, `union` |
| Service | `service`, `operation`, `resource` |

`timestamp` is a point in time with no wire format of its own; the protocol, or a `@timestampFormat` trait, decides whether it serializes as an RFC 3339 string, epoch seconds or an HTTP date. `document` is an untyped value for the rare field that genuinely has no schema; using it is opting out of everything Smithy is for, so keep it out of the core of a model.

Mixins (`@mixin` on a shape, `with [...]` where it is used) share members between structures, and the `apply` statement attaches traits to a shape defined elsewhere, which is how you add documentation or protocol bindings to a model you do not own.

---

## 3. Services, resources and operations

An **operation** has an `input` structure, an `output` structure (both default to `smithy.api#Unit`) and a list of `errors`, each of which must carry the `@error` trait set to `client` or `server`.

A **resource** groups operations around an entity with `identifiers`, and assigns them lifecycle roles. Smithy validates those roles, which is the feature OpenAPI has no equivalent for:

| Lifecycle | Meaning | Rule |
| :--- | :--- | :--- |
| `create` | Create with a server-generated identifier | Collection operation |
| `put` | Create or replace with a client-supplied identifier | Must be `@idempotent`, not `@readonly` |
| `read` | Retrieve current state | Must be `@readonly` |
| `update` | Modify | Must not be `@readonly` |
| `delete` | Remove | Must be `@idempotent`, not `@readonly` |
| `list` | List instances | Collection operation, must be `@readonly` |

A `put` that is not idempotent, or a `read` with side effects, fails the build rather than reaching production. Model resources even if you only ever ship one protocol: the validation is worth it on its own.

---

## 4. Protocols

A protocol is a trait on the service. The ones in common use:

| Trait | Shape on the wire |
| :--- | :--- |
| `aws.protocols#restJson1` | REST: HTTP binding traits place members in the path, query, headers or JSON body |
| `aws.protocols#restXml` | As `restJson1`, with XML bodies |
| `aws.protocols#awsJson1_0`, `awsJson1_1` | RPC: every operation is a `POST` with a JSON body |
| `aws.protocols#awsQuery`, `ec2Query` | Legacy form-encoded requests with XML responses |
| `smithy.protocols#rpcv2Cbor` | RPC with CBOR bodies, not tied to AWS |
| `smithy.protocols#rpcv2Json` | The same RPC shape with JSON bodies |

For a REST protocol, every operation needs the `@http` trait and its members are bound with `@httpLabel`, `@httpQuery`, `@httpHeader` and `@httpPayload`:

```text
@readonly
@http(method: "GET", uri: "/cities/{cityId}")
operation GetCity {
    input := {
        @required
        @httpLabel
        cityId: CityId
    }
}
```

`rpcv2Cbor` ignores HTTP binding traits entirely. Every request is a `POST` to `{prefix?}/service/{serviceName}/operation/{operationName}`, carries `Smithy-Protocol: rpc-v2-cbor`, and uses `application/cbor` for bodies:

```http
POST /service/Weather/operation/GetCity HTTP/1.1
Host: api.example.com
Smithy-Protocol: rpc-v2-cbor
Content-Type: application/cbor
Accept: application/cbor
```

Successful responses are always `200`. Errors are `400`, or `500` for an error marked `server`, unless the error shape sets `@httpError`. Under `restJson1`, the error type travels in the `X-Amzn-Errortype` header.

For a new service-to-service API with generated clients on both ends, `rpcv2Cbor` is the better default: smaller payloads, no URI design to argue over, and no ambiguity about where a member goes. For a public API that people will call with curl, use `restJson1` and design the URIs properly.

---

## 5. Code generation and OpenAPI

`smithy build`, driven by a `smithy-build.json` file, validates the model and runs projections and plugins over it. Code generators exist for Java, TypeScript, Rust, Python, Kotlin, Go and Scala, at varying levels of maturity; check the generator's own status before committing a production SDK to it. See [SDK generation](/guides/sdk-generation) for what to expect from generated clients in general.

The `smithy-openapi` plugin converts a model to OpenAPI 3.0.2 by default, or 3.1.0. Conversion only works for HTTP protocols with RESTful routing, and it is lossy: resource metadata, custom traits (without an extension), endpoint and host-label traits and prefix headers do not survive. Treat the Smithy model as the source of truth and the OpenAPI document as a generated artifact, never the reverse.

---

## Best Practices

* Model resources and their lifecycles, not just operations. It is the part of Smithy that catches design mistakes.
* Keep one model per service and apply protocols to it, rather than forking models per protocol.
* Do not hand-edit OpenAPI generated from Smithy. The next build overwrites it, and the edit was a change to the contract that never went through the model.
* Version and lint the model like code. Smithy's validators and the [design-first governance](/guides/design-first-governance) practices that apply to OpenAPI apply here too.
