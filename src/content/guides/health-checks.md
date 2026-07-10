---
title: "Health Checks & Status Endpoints"
description: "Design liveness, readiness, and startup checks with the health+json format, dependency probes, and status pages."
category: "core"
---

## Introduction to Health Checks

Health checks let orchestrators, load balancers, and monitoring systems understand the operational state of an API. By exposing a service's internal state and the health of its dependencies, they enable automated responses such as restarting a stuck process or rerouting traffic away from a degraded instance. A well-designed set of checks is a foundational element of availability and observability.

---

## 1. Liveness vs. Readiness vs. Startup

The three probe types answer different questions and trigger different actions. Conflating them is the most common mistake in health-check design.

### Liveness

A **liveness** check answers "is this process alive?" It should detect only unrecoverable states such as deadlocks, corrupted internal state, or exhausted memory. A failing liveness check triggers a **restart**, so it must be simple and fast, and it must not depend on external services. A brief network glitch to a database should never fail liveness, or the orchestrator will pointlessly restart a healthy process.

### Readiness

A **readiness** check answers "can this instance serve traffic right now?" A failing readiness check **removes the instance from the load balancer pool** but does not restart it, giving the service time to recover. Readiness is more comprehensive than liveness and typically verifies critical downstream dependencies such as databases, caches, and required upstream services.

### Startup

A **startup** check gates liveness and readiness during a slow initialization sequence. Until the startup probe succeeds, the other probes are suppressed so they cannot fail prematurely. Once startup passes, the regular liveness and readiness probes take over.

| Probe | Question | On failure |
| --- | --- | --- |
| Liveness | Is the process alive? | Restart the instance |
| Readiness | Can it serve traffic? | Remove from load balancer pool |
| Startup | Has it finished initializing? | Keep waiting; gate other probes |

---

## 2. Endpoint Layout

Organize checks into a clear URL hierarchy so each consumer queries exactly what it needs.

```http
GET /health            # aggregate status
GET /health/live       # liveness probe
GET /health/ready      # readiness probe
GET /health/startup    # startup probe
GET /health/dependencies  # detailed dependency status
```

A healthy response returns [`200 OK`](/status-codes/200), often with a JSON body. An unhealthy readiness check should return [`503 Service Unavailable`](/status-codes/503) so load balancers stop routing to it. Kubernetes HTTP probes treat any status from 200 to 399 as success.

---

## 3. The application/health+json Format

The IETF draft *Health Check Response Format for HTTP APIs* proposes a standard JSON body under the `application/health+json` media type. It is a draft and has lapsed, but it remains a useful de-facto shape for interoperable responses.

```http
GET /health HTTP/1.1
Host: api.apiguide.dev
```

```json
{
  "status": "pass",
  "version": "1",
  "releaseId": "1.2.2",
  "serviceId": "orders-api",
  "checks": {
    "postgres:responseTime": {
      "componentType": "datastore",
      "observedValue": 12,
      "observedUnit": "ms",
      "status": "pass",
      "time": "2026-07-10T09:00:00Z"
    },
    "cache:connections": {
      "componentType": "component",
      "observedValue": 0,
      "status": "warn",
      "output": "redis unreachable, serving from cold path"
    }
  }
}
```

* **`status`**: the mandatory root field, one of `pass`, `warn`, or `fail`.
  * `pass` or `warn` must use an HTTP status in the 2xx–3xx range.
  * `fail` must use a 4xx–5xx range status.
* **Optional fields**: `version`, `releaseId`, `serviceId`, `description`, `notes`, and `output`.
* **`checks`**: per-dependency detail keyed as `componentName:measurementName`, with values such as `componentType`, `observedValue`, `observedUnit`, `status`, `affectedEndpoints`, `time`, and `links`.

Frameworks such as MicroProfile Health expose a similar model with `/health/live`, `/health/ready`, and `/health/started` endpoints reporting `UP` or `DOWN`.

---

## 4. Dependency Checks

Readiness checks should verify the dependencies a request actually needs. Simulate real usage: run a lightweight query rather than merely opening a TCP connection, so you detect degradation rather than just total outage.

* **Classify criticality**: mark each dependency as critical or non-critical. A failing critical dependency makes the service unhealthy; a failing non-critical one may render it degraded (`warn`) while still serving traffic.
* **Aggregate concurrently**: run dependency probes in parallel and combine results into a single aggregate status.
* **Guard against cascades**: checking every dependency on every probe can turn one slow dependency into a fleet-wide outage. Check selectively based on criticality.

---

## 5. Performance, Timeouts, and Circuit Breakers

Checks must be lightweight so the monitoring itself does not destabilize the system.

* **Timeouts**: set a strict budget per check. Too short causes false positives; too long lets an unhealthy instance keep serving traffic while a probe hangs. A single hanging dependency call should never block the whole health endpoint.
* **Thresholds**: tune failure and success thresholds per probe type to balance detection speed against flapping.
* **Circuit breakers**: wrap dependency checks so that when a downstream service is already failing, the breaker opens and stops hammering it with probe traffic, letting it recover.
* **Cadence**: poll critical services frequently (for example every 30s) and less critical ones less often.

---

## 6. Security

Health endpoints can leak internal topology, versions, and dependency names. Protect them by requiring authentication on detailed endpoints, keeping verbose diagnostics off unauthenticated paths, and rate limiting to prevent abuse. A minimal unauthenticated liveness endpoint paired with an authenticated detailed dependency endpoint is a common split.

---

## 7. Operations: Load Balancers, Orchestrators, and Status Pages

Health checks become powerful when wired into operational tooling.

* **Load balancers** use readiness as a Go/No-Go signal, removing unhealthy instances from rotation. Note that a load balancer will not recover an instance; it only stops sending traffic.
* **Orchestrators** like Kubernetes restart on liveness failure, gate traffic on readiness, and grant slow-starting apps a grace period via startup probes.
* **Degradation signals** beyond binary UP/DOWN let routers make smarter decisions. A `warn` status can steer traffic toward healthier instances instead of removing a partially degraded one entirely.
* **Synthetic monitoring** exercises real workflows from external locations to catch silent failures, where the API returns 200 but delivers incorrect data.
* **Status pages** aggregate monitoring output for transparent incident communication. Note that a status page is a communication tool, not a monitor: an external system detects the problem and pushes updates to the page.

Combine distinct probe types, a standard response shape, criticality-aware dependency checks, and external monitoring, and health checks become a reliable backbone for API resilience. See also [Observability & Distributed Tracing](/guides/observability-tracing) for the signals that explain *why* a check failed.
