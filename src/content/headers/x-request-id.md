---
name: "X-Request-ID"
description: "De facto header carrying a unique ID for one request, echoed in the response and written to every log line so a failure can be traced."
category: "both"
standard: false
relatedCodes: [500, 502, 504]
updatedDate: 2026-10-17
---

## What is the X-Request-ID header?

`X-Request-ID` carries an opaque identifier for a single HTTP request. The edge (a load balancer, gateway or the first service) assigns it, every service that handles the request writes it to its logs and passes it on to the services it calls, and the API returns it in the response. When a customer reports a failure, the ID from their response finds every log line for that request across every service.

It has never been standardized and is not in the IANA HTTP Field Name Registry. It is a convention that much of the infrastructure supports out of the box: Heroku's router generates one for every request and passes it to the application, nginx has a `$request_id` variable (16 random bytes in hex, since 1.11.0) to set it from, and [Envoy](/tools/gateways-management/envoy) generates and propagates `x-request-id` by default. `X-Correlation-ID` is the same idea under another name, and some teams use the two for different scopes: one ID per hop versus one ID for a whole business transaction.

The standardized relative is [`traceparent`](/headers/traceparent) from W3C Trace Context, which carries a trace ID for the whole distributed trace plus the calling span's ID. The two overlap, but they are not the same thing: `X-Request-ID` is a log correlation key that any client can see and quote, while `traceparent` is a tracing protocol whose IDs and sampling flag are meant for your observability backend.

## API Usage & Best Practices

* **Always return it in the response.** The ID is only useful to a customer if they can see it. Return it on every response, success and error alike, and include it in your RFC 9457 problem details body (for example as a `request_id` extension member) so it survives being copied out of a log or a screenshot. If browsers call the API cross-origin, list it in [`Access-Control-Expose-Headers`](/headers/access-control-expose-headers) or JavaScript cannot read it.
* **Generate it at the edge, once.** The first component you control should assign the ID, and everything behind it should propagate it unchanged. Two layers each generating their own gives you two IDs per request and no way to join them.
* **Decide whether to accept a client's value.** Accepting an incoming `X-Request-ID` lets a caller correlate their logs with yours, which integrators appreciate. It also lets anyone write arbitrary strings into your logs. If you accept it, validate it: Heroku's rule is a good model, allowing only 20 to 200 characters of ASCII letters, digits, `+`, `/`, `=` and `-`, and replacing anything invalid with a generated ID. Never let a client value contain newlines or control characters, which enable log injection.
* **Do not trust it for uniqueness or identity.** A client-supplied ID can be reused on purpose. Never use it as an idempotency key, a cache key or a database key; that is what [`Idempotency-Key`](/headers/idempotency-key) is for.
* **Generate IDs randomly.** A UUID or 128 random bits is enough. Never derive it from anything identifying the user.
* **Align it with your traces.** If you run distributed tracing, the simplest arrangement is to log the trace ID from `traceparent` with every line and return it as `X-Request-ID` (or derive one from the other at the edge). Then the ID a customer quotes opens the trace directly, and you are not maintaining two unrelated identifiers. Internally, `traceparent` does the propagating; `X-Request-ID` is the customer-facing handle. See [observability and tracing](/guides/observability-tracing).
* **Pick one name and document it.** `X-Request-ID`, `X-Request-Id`, `Request-Id` and `X-Correlation-ID` all exist in the wild. Field names are case-insensitive, so capitalization does not matter, but the name does. Choose one, document it in your API reference, and tell customers to quote it in support tickets.

## Examples

A request the gateway assigned an ID to, as seen by a backend service:

```http
GET /v1/orders/ord_9 HTTP/1.1
Host: orders.internal
X-Request-ID: 3f1c9a7e5b2d4c8f9e0a1b2c3d4e5f60
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

The ID returned to the client on an error, in the header and the body:

```http
HTTP/1.1 502 Bad Gateway
Content-Type: application/problem+json
X-Request-ID: 3f1c9a7e5b2d4c8f9e0a1b2c3d4e5f60

{
  "type": "https://apiguide.dev/errors/bad-gateway",
  "title": "Bad Gateway",
  "status": 502,
  "request_id": "3f1c9a7e5b2d4c8f9e0a1b2c3d4e5f60"
}
```

A client supplying its own ID so it can match your logs to its own:

```http
POST /v1/payments HTTP/1.1
Host: api.example.com
Content-Type: application/json
X-Request-ID: acme-batch-7-20261017-000142
```
