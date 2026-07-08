---
name: "Sentry"
description: "An open-source error tracking and performance monitoring platform helping developers debug errors in real-time."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://sentry.io"
pricing: "freemium"
---

## What is Sentry?

Sentry is an open-source error monitoring platform. It intercepts unhandled exceptions and errors in both client-side frontend code and backend API applications, capturing rich debugging snapshots.

## Why use it in the API Lifecycle?

* **Real-time Alerting**: Instantly alerts developers when a new code exception is thrown in production.
* **Rich Context**: Captures stack traces, environment states, active request headers, and user scopes, making errors easy to reproduce.
* **Trace Integration**: Links frontend UI crashes to backend API errors, showing the end-to-end stack trace.

## Best Practices

* Configure Sentry to ignore expected business exceptions (like validation failures) to keep alerts focused strictly on unhandled server crashes (HTTP 500).
