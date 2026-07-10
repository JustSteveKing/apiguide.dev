---
name: "Sentry"
description: "An open-source error tracking and performance monitoring platform helping developers debug errors in real-time."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://sentry.io"
pricing: "freemium"
---

## What is Sentry?

Sentry is an application performance monitoring tool that helps developers and software teams identify errors and resolve issues. It assists in observing application behavior and provides debugging capabilities.

## Why use it in the API Lifecycle?

* **Error Monitoring**: Tracks and identifies application errors, providing insights into their causes and impact.
* **Performance Monitoring and Tracing**: Analyzes application performance, including slow queries, N+1 issues, and request timeouts, by connecting data through distributed traces.
* **Session Replay**: Records and replays user sessions to provide visual context for errors and performance problems.
* **AI-Assisted Debugging (Seer)**: Automatically identifies the root cause of issues and generates merge-ready patches using a debugging agent and code reviewer.
* **AI Code Review**: Predicts and prevents errors before deployment by correlating PRs against error and performance history.
* **Contextual Data Correlation**: Connects errors, logs, session replays, performance spans, and profiles through a unified tracing mechanism.

## Best Practices

* Integrate the SDK with minimal code (e.g., five lines) early in your application's lifecycle for comprehensive error and performance data capture.
* Adjust transaction sampling rates for tracing to balance data collection with performance impact, particularly when deploying to production environments.
* Utilize debug mode during initial SDK setup to verify correct data transmission and behavior.
* Leverage integrations with development tools such as GitHub, Slack, Jira, and Linear to embed error and performance context directly into existing team workflows.
