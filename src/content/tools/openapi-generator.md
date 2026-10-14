---
name: "OpenAPI Generator"
description: "A community-maintained, Apache-2.0 generator of client SDKs, server stubs and documentation from OpenAPI 2.0 and 3.x, forked from Swagger Codegen in 2018."
category: "design-documentation"
lifecycleStages: ["development"]
url: "https://openapi-generator.tech"
pricing: "open-source"
---

## What is OpenAPI Generator?

OpenAPI Generator produces client libraries, server stubs, documentation and configuration from an [OpenAPI](/specifications/openapi) 2.0 or 3.x document. It lists more than 50 client generators and server stubs for more than 40 languages and frameworks. It is written in Java, licensed Apache-2.0, and maintained by the community in the `OpenAPITools/openapi-generator` repository.

It is a fork of Swagger Codegen. In 2018, after disagreement over the Swagger Codegen 3.0.0 release and the project's direction, more than 40 of its top contributors and template authors forked it as OpenAPI Generator. The two projects are separate today: Swagger Codegen is still maintained by SmartBear under `swagger-api/swagger-codegen`, with its own generators and templates. Configuration, generator names and template variables differ between them, so do not assume a Swagger Codegen option or template works unchanged. The project publishes a migration guide.

It runs as a JAR, through an npm wrapper (`@openapitools/openapi-generator-cli`), Homebrew, the `openapitools/openapi-generator-cli` Docker image, or Maven and Gradle plugins. Templates are Mustache, and any of them can be replaced with your own.

```sh
openapi-generator generate \
  -i openapi.yaml \
  -g typescript-fetch \
  -o ./sdk/typescript \
  -c config.yaml
```

## Why use it in the API Lifecycle?

* **No vendor and no account.** It is a local tool under a permissive license. Generated code is yours, and the generator will still work if every SDK company goes away.
* **The widest target list available.** Niche languages and frameworks that no commercial generator supports usually have a community generator here.
* **Server stubs as well as clients.** Generating interfaces for the server from the same document is one way to keep a design-first implementation honest.
* **Full control of output.** Overriding a single Mustache template with `-t` fixes a style issue without forking the project.
* **Build-tool integration.** The Maven and Gradle plugins regenerate on every build, so generated code need not be committed at all on the JVM.

## Best Practices

* **Pin the generator version.** Output changes between releases. Pin the Docker tag, plugin version or npm wrapper version so regeneration is reproducible and upgrades are deliberate.
* **Evaluate each generator on its own.** Maturity varies widely between targets; some are heavily used and maintained, others are not. Generate against your real spec and read the output before committing to a language target.
* **Fix the spec, not the output.** Missing `operationId`s, inline anonymous schemas and undocumented errors produce names like `InlineObject3` and untyped failures. Clean these up in the document. See [SDK Generation](/guides/sdk-generation).
* **Use `.openapi-generator-ignore` to protect hand-written files.** It works like `.gitignore` for regeneration and is more precise than `--skip-overwrite`.
* **Keep options in a config file.** Pass `-c config.yaml` (or a plugin block) rather than long `--additional-properties` strings in a script, so the settings are reviewable.
* **Do not hand-edit generated code.** Override the template, add a supporting file through configuration, or wrap the generated client. Edits in place disappear on the next run.
* **Validate first.** `openapi-generator validate` exists, but a linter such as [Spectral](/tools/design-documentation/spectral-stoplight) or [vacuum](/tools/design-documentation/vacuum) catches the design problems that make generated code awkward, not just the schema errors.
