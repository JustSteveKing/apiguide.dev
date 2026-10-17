---
name: "AsyncAPI Tooling"
description: "The AsyncAPI Initiative's open-source tools for event-driven API documents: the CLI, Studio, Generator, Modelina and parsers."
category: "design-documentation"
lifecycleStages: ["design", "development"]
url: "https://www.asyncapi.com/tools"
pricing: "open-source"
updatedDate: 2026-10-14
---

## What is AsyncAPI Tooling?

AsyncAPI Tooling is the set of open-source tools the AsyncAPI Initiative maintains for working with AsyncAPI documents, the machine-readable descriptions of message-driven APIs over brokers and protocols such as Kafka, AMQP, MQTT and WebSockets. The format itself (servers, channels, operations, messages and bindings) is covered at [AsyncAPI](/specifications/asyncapi); this page is about the tools. The entry point is the AsyncAPI CLI (`npm install -g @asyncapi/cli`, run as `asyncapi`), which validates documents with the AsyncAPI Parser, compares them, converts them between spec versions, bundles and optimizes them, and drives the other tools. The Generator produces documentation, SDKs or boilerplate from a document and a template. Modelina generates payload models in languages such as TypeScript, Java and Go. Studio is a visual editor for designing documents, which `asyncapi start studio` runs locally. The Parser is available for JavaScript and Go.

## Why use it in the API Lifecycle?

* **Validation in CI**: `asyncapi validate` checks a document against the specification, and `--fail-severity` (`error`, `warn`, `info` or `hint`) sets which diagnostic level fails the build.
* **Change detection**: `asyncapi diff OLD NEW` classifies changes as breaking, non-breaking or unclassified, and errors on breaking changes unless you pass `--no-error`.
* **Generation**: `asyncapi generate fromTemplate` runs the Generator to produce HTML docs or code from a template; `asyncapi generate models` runs Modelina to produce payload types for languages including TypeScript, Java, Go, Python, C# and Rust.
* **Reuse and cleanup**: `asyncapi bundle` resolves split files and `$ref`s into one document, and `asyncapi optimize` moves duplicated definitions into `components`.
* **Migration**: `asyncapi convert` upgrades an older document to a newer spec version, so a 2.x description can move to version 3 without a hand rewrite.

## Best Practices

* Pin the CLI version in CI the same way you pin any other build dependency. With a floating version, a new CLI release can change what a pipeline run reports without any change to your document, and nobody can tell which caused the failure.
* Run `asyncapi validate --fail-severity warn` and `asyncapi diff` against the main branch on every pull request. A renamed field in an event payload breaks consumers just as silently as a renamed JSON field in an HTTP response, and there is no [`400 Bad Request`](/status-codes/400) to tell anyone. See [Breaking Changes](/guides/breaking-changes).
* Do not pass `--no-error` to `asyncapi diff` in the pipeline to get a build through. If a breaking change is intended, version the channel or message and say so in review, rather than teaching the check to stay quiet.
* Treat generated models and docs as build output. Regenerate them from the document in CI rather than editing them by hand, or the next generation run silently discards the edits.
* Keep one document per application, with shared message and schema definitions split into files and referenced with `$ref`, then `asyncapi bundle` them for publishing. Producers and consumers each describe their own side, which is how version 3 `operations` are meant to be read; the [AsyncAPI](/specifications/asyncapi) page covers the model.
* Put an event identifier, type and timestamp in every message, either as message headers or with an envelope such as [CloudEvents](/specifications/cloudevents), so consumers can deduplicate redeliveries. Tooling cannot add that after the fact, and at-least-once delivery is the norm for brokers and for [webhooks](/guides/webhooks). Version payloads additively, as described in [Forward-Compatible Enums](/guides/forward-compatible-enums).
