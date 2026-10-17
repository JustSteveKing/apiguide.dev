---
name: "Artillery"
description: "A load testing toolkit with YAML scenarios and JavaScript hooks, HTTP, WebSocket, Socket.IO and gRPC support, Playwright browser tests, and distributed runs on AWS Lambda or Fargate. Core is MPL-2.0."
category: "testing-mocking"
lifecycleStages: ["testing", "monitoring"]
url: "https://www.artillery.io"
pricing: "open-source"
updatedDate: 2026-10-17
---

## What is Artillery?

Artillery is a load testing and synthetic monitoring toolkit. Tests are YAML files: a `config` section with the target, load phases and plugins, and `scenarios` describing what each virtual user does, with JavaScript functions for anything YAML cannot express. It covers HTTP, WebSocket, Socket.IO, gRPC and more, and can drive real headless browsers through Playwright.

```yaml
config:
  target: https://staging.example.com
  phases:
    - duration: 300
      arrivalRate: 20
  plugins:
    ensure:
      thresholds:
        - 'http.response_time.p99': 250
scenarios:
  - flow:
      - get:
          url: /orders
```

Most of the code is licensed MPL-2.0. Some Azure-specific modules are under the Business Source License, which allows evaluation on Azure but requires a commercial license for production use there. The CLI can run distributed tests on AWS Lambda or AWS Fargate from your own account. Artillery Cloud, the hosted dashboard for reports, has a free tier and paid plans.

## Why use it in the API Lifecycle?

* **Low barrier to a first test.** A YAML scenario is readable by anyone on the team, and JavaScript hooks are there when a flow needs computed values.
* **Arrival-rate phases by default.** Phases are defined by how many virtual users arrive per second, an open model, which is the right default for measuring how an API behaves at a target load.
* **Thresholds that fail the run.** The `ensure` plugin checks aggregate metrics such as `http.response_time.p99` and exits non-zero when a strict check fails, so the run can gate a pipeline.
* **Scale without a fleet.** Distributed runs on Lambda or Fargate generate load from many workers without managing load-generator machines.

## Best Practices

* **Gate on percentiles.** Use `ensure` thresholds on `p95` or `p99` response time rather than the mean, and keep the checks strict in CI so a regression fails the build.
* **Ramp before you hold.** Start each test with a warm-up phase so caches, connection pools and autoscaling settle before the phase you actually measure.
* **Capture and reuse IDs.** Extract values from responses (an order ID from a `POST`) and use them in later requests, so the scenario exercises real flows rather than hammering one cached URL.
* **Watch for the limiter.** If the test trips [rate limiting](/guides/rate-limiting) and gets [`429 Too Many Requests`](/status-codes/429), either use an exempt credential or treat the limiter's behavior, including [`Retry-After`](/headers/retry-after), as the subject of the test.
* **Check the license before running at scale on Azure.** The Azure-specific modules are not MPL-2.0. On AWS or locally, the core license applies.
* **Never load test an API you do not own.** Point it at an environment shaped like production, and correlate with server-side telemetry; see [Observability and Tracing](/guides/observability-tracing).
