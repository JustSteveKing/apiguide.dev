---
name: "Gatling"
description: "A load testing tool with simulations written as code in Java, Kotlin, Scala, JavaScript or TypeScript. The Community Edition is Apache-2.0; Enterprise Edition adds managed load generation and team features."
category: "testing-mocking"
lifecycleStages: ["testing"]
url: "https://gatling.io"
pricing: "open-source"
updatedDate: 2026-10-17
---

## What is Gatling?

Gatling is a load testing tool. You write test scenarios, called simulations, as code, run them against your services, and get an HTML report of response times, throughput and errors. The Community Edition is open source under Apache-2.0 in the `gatling/gatling` repository and free to use, including commercially. Simulations can be written in Java, Kotlin or Scala, run from Maven, Gradle or sbt, or in JavaScript and TypeScript through the Gatling JavaScript SDK and CLI.

Protocol support covers HTTP, WebSocket, server-sent events, gRPC, JMS and MQTT. Gatling Enterprise Edition is the paid product: managed or private infrastructure for generating load at scale, CI/CD integration, trend analysis and team collaboration, with a free trial.

## Why use it in the API Lifecycle?

* **Tests as code in the team's language.** A JVM team writes simulations in Java or Kotlin, a front-end team in TypeScript, and both review them like any other code.
* **Explicit workload models.** Injection profiles are either open, where users arrive at a rate (`constantUsersPerSec`, `rampUsersPerSec`), or closed, where concurrency is capped (`constantConcurrentUsers`). Choosing between them is the difference between measuring capacity and measuring a fixed number of clients.
* **Assertions as a gate.** Assertions on response-time percentiles and failure rates turn a run into a pass or fail that a pipeline can act on.
* **Reports worth reading.** The generated HTML report breaks results down per request over time, which is where a single slow endpoint shows up.

## Best Practices

* **Use an open model to test capacity.** A closed model slows its own request rate as the API slows down, which hides queueing. Gatling requires all steps in one injection chain to be the same model kind, so decide which question you are asking before you write the profile.
* **Assert on percentiles, not means.** Gate on the 95th or 99th percentile response time and on the failed-request percentage. An average hides the slow tail that clients actually feel.
* **Name requests by endpoint, not URL.** Give requests stable names so that every order ID does not become its own line in the report.
* **Decide what a failure is.** Add explicit status checks for the responses the scenario expects. If the test trips the API's [rate limiting](/guides/rate-limiting) and gets [`429 Too Many Requests`](/status-codes/429), you have measured the limiter, not the service.
* **Test an environment shaped like production, never someone else's API.** Correlate the run with server-side metrics and traces (see [Observability and Tracing](/guides/observability-tracing)) so a latency spike has a cause.
