---
name: "Kiota"
description: "Microsoft's MIT-licensed command-line generator of strongly typed API clients from OpenAPI, built on shared per-language core libraries, with path filtering to generate only the operations you call."
category: "sdk-generation"
lifecycleStages: ["development"]
url: "https://learn.microsoft.com/en-us/openapi/kiota/overview"
pricing: "open-source"
updatedDate: 2026-10-17
---

## What is Kiota?

Kiota is a command-line tool from Microsoft that generates an API client from any [OpenAPI](/specifications/openapi) description. It is open source under the MIT license in the `microsoft/kiota` repository and builds on the Microsoft.OpenAPI.NET library. Microsoft documents it as the way to generate a trimmed-down Microsoft Graph client, but nothing about it is specific to Microsoft APIs.

Its design differs from most generators. Generated code is deliberately thin: it builds on a small set of shared core libraries per language, the abstractions, serialization, HTTP and authentication packages, rather than emitting a full HTTP stack into every client. The repository lists C#, Go, Java, PHP and Python as stable, and TypeScript, Ruby and Dart as in preview; `kiota info` shows the maturity level and runtime dependencies for each language.

```sh
kiota generate -l typescript -d https://api.example.com/openapi.yaml \
  -c ExampleClient -n Example.Client -o ./src/client \
  --include-path "/orders/**"
```

Every generation writes a `kiota-lock.json` to the output directory, recording the parameters and a hash of the description. `kiota update` regenerates every client it finds from those lock files, and skips generation when neither the description nor the parameters have changed.

## Why use it in the API Lifecycle?

* **Generate only what you call.** `--include-path` and `--exclude-path` take glob patterns, optionally with a `#METHOD` suffix, so a client for three operations of a large third-party API stays small.
* **One client shape across APIs.** Every Kiota client in a language uses the same core libraries and the same fluent request-builder style, so a team calling several APIs learns one pattern instead of one SDK per vendor.
* **Validation before generation.** Kiota warns on description problems that produce bad clients, such as a [`GET`](/methods/get) with a body, a schema on a [`204 No Content`](/status-codes/204), or a `oneOf` without a discriminator.
* **Reproducible regeneration.** The lock file makes regeneration a command with no remembered arguments.

## Best Practices

* **Commit `kiota-lock.json` with the generated code.** That is its documented purpose. Regenerate with `kiota update` in CI and review the diff.
* **Check the language's maturity before committing to it.** Run `kiota info -l <language>`. A preview language may change generated output between releases.
* **Pin the core library versions.** The generated code depends on the abstractions and serialization packages at runtime; upgrade them deliberately, alongside the generator.
* **Fix warnings in the description, not the output.** Kiota's validation rules point at real ambiguity in the contract. Disabling a rule with `--disable-validation-rules` should be a decision, not a reflex. See [SDK Generation](/guides/sdk-generation).
* **Do not hand-edit generated files.** Wrap the client or extend it in separate files; edits in place are lost on the next run.
