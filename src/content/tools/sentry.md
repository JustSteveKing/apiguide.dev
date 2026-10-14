---
name: "Sentry"
description: "A source-available error tracking and performance monitoring platform that groups exceptions and traces so developers can debug failures in production."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://sentry.io"
pricing: "freemium"
---

## What is Sentry?

Sentry is an application monitoring platform built around error tracking. SDKs for most languages and frameworks capture unhandled exceptions with stack traces, request context and breadcrumbs, group repeated occurrences into issues, and link each issue to the release and commit that introduced it. The same SDKs record performance traces, and Sentry also offers logs, uptime and cron monitoring, and Seer, an AI agent for root-cause analysis and code review. It is available as a hosted service with a free Developer plan, or self-hosted. The server code is released under the Functional Source License (FSL-1.1-Apache-2.0), which Sentry describes as eventually open source: it is source-available, not OSI open source, and each release converts to Apache 2.0 after two years.

## Why use it in the API Lifecycle?

* **Exception grouping**: Thousands of identical failures collapse into one issue with a count, first and last seen, affected releases and a full stack trace, instead of a wall of log lines.
* **Release health**: Issues are tied to releases and commits, so you can see which deploy introduced a regression and whether a fix actually stopped it.
* **Distributed tracing**: SDKs propagate `sentry-trace` and `baggage` headers between services (and, in recent JavaScript SDKs, W3C [`traceparent`](/headers/traceparent) when enabled), linking a front-end error to the API request and database span behind it.
* **Framework integrations**: Middleware for common web frameworks captures the request method, route and status alongside the exception, and by default reports server errors rather than every client error.
* **Workflow integrations**: Issues can be assigned and linked to GitHub, GitLab, Jira, Linear and Slack, and suspect commits are attributed from source control.

## Best Practices

* Report 5xx, not 4xx. A [`400 Bad Request`](/status-codes/400) or [`404 Not Found`](/status-codes/404) is a correct response to a bad request, and sending every one to Sentry buries real faults. Keep the framework default of capturing server errors, and track client-error rates as metrics instead. See [Error Handling](/guides/error-handling).
* Set the `release` and `environment` on every SDK and upload source maps or debug symbols in the deploy pipeline. Without them, issues cannot be tied to a deploy and minified stack traces are unreadable.
* Scrub before sending. Do not enable default PII collection unless you have decided you need it, strip [`Authorization`](/headers/authorization), [`Cookie`](/headers/cookie) and request bodies in `beforeSend`, and keep server-side data scrubbing on as a second layer. [Logging and PII](/guides/logging-pii) lists what to remove.
* Restrict trace header injection with `tracePropagationTargets` to your own APIs. Sending `sentry-trace` and `baggage` to third-party hosts leaks trace data and can trip a strict CORS preflight on [`Access-Control-Allow-Headers`](/headers/access-control-allow-headers).
* Sample traces deliberately. Set `tracesSampleRate`, or use `tracesSampler` to keep more of the routes you care about and drop health checks entirely, rather than tracing 100% in production and paying for it.
* Attach the request ID or trace ID to every error response body and log line, so a customer's support ticket can be matched to the exact Sentry event.
