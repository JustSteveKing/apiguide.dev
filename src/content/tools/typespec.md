---
name: "TypeSpec"
description: "Microsoft's MIT-licensed language for describing APIs, compiled to OpenAPI 3, JSON Schema and Protocol Buffers through emitters."
category: "design-documentation"
lifecycleStages: ["design"]
url: "https://typespec.io"
pricing: "open-source"
---

## What is TypeSpec?

TypeSpec is a small language, with syntax inspired by TypeScript, for describing API shapes. You write models, operations and decorators in `.tsp` files and the compiler runs emitters that produce other artifacts: [OpenAPI](/specifications/openapi) 3 (`@typespec/openapi3`), [JSON Schema](/specifications/json-schema) 2020-12 (`@typespec/json-schema`) and [Protocol Buffers](/specifications/protocol-buffers) (`@typespec/protobuf`). It is built by Microsoft, used internally for Azure APIs, and published under the MIT license in `microsoft/typespec`.

A project is `main.tsp`, a `tspconfig.yaml` that selects emitters and their options, and a `package.json`. The CLI comes from `@typespec/compiler`: `tsp init` scaffolds a project, `tsp install` installs its libraries, and `tsp compile .` writes output to `tsp-output/`.

```typespec
import "@typespec/http";
using Http;

@service(#{ title: "Pet Store" })
@server("https://api.example.com", "Production")
namespace PetStore;

model Pet {
  id: int32;
  @minLength(1) name: string;
  kind: "dog" | "cat" | "fish";
}

@error
model NotFound {
  @statusCode _: 404;
  message: string;
}

@route("/pets")
interface Pets {
  @get list(): Pet[];
  @get read(@path petId: int32): Pet | NotFound;
}
```

The compiler and the HTTP, OpenAPI, OpenAPI 3 and JSON Schema packages are stable and versioned together at 1.x. Other libraries, including versioning, REST, streams and server-sent events, are still 0.x and marked preview on the docs site.

## Why use it in the API Lifecycle?

* **Design reviews read like code reviews.** A TypeSpec diff is a few lines where the equivalent OpenAPI diff is dozens of lines of YAML, so reviewers can see the actual design change.
* **Reuse that OpenAPI makes awkward.** Templates, spread and interfaces let you define pagination envelopes, error models or standard operations once and apply them everywhere, which enforces consistency by construction.
* **One source, several formats.** The same definition emits OpenAPI for HTTP tooling, JSON Schema for validation and Protobuf for [gRPC](/specifications/grpc).
* **Compiler errors at design time.** References to undefined types and invalid decorator use fail compilation, before any documentation or code is generated.

## Best Practices

* **Treat the emitted OpenAPI as a build artifact, and commit it.** Downstream tools (linters, docs, SDK generators, contract tests) consume OpenAPI. Commit the generated file so reviewers see the effect of a TypeSpec change on the contract, and fail CI if it is stale.
* **Still lint the OpenAPI output.** TypeSpec guarantees a well-formed document, not a well-designed API. Run [Spectral](/tools/design-documentation/spectral-stoplight) or [vacuum](/tools/design-documentation/vacuum) on the emitted file. See [Design-First Governance](/guides/design-first-governance).
* **Build a shared library of models.** Put your error shape, pagination and common headers in an internal TypeSpec package and import it in every service. This is where TypeSpec pays for itself.
* **Upgrade compiler and libraries together.** The packages are released together; keep every `@typespec/*` dependency in `package.json` on the same release so an upgrade is one reviewed change, not a mix of versions.
* **Be cautious with preview libraries.** Anything marked preview can change between releases. Isolate its use, and check the release notes before upgrading.
* **Do not adopt it for one small API.** The payoff comes from reuse across many operations or services. For a single small API, writing OpenAPI directly is less tooling for the same result.
