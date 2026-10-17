---
title: "GraphQL over HTTP"
description: "A reference for the GraphQL Foundation's GraphQL-over-HTTP specification: request parameters, GET and POST rules, the application/graphql-response+json media type, Accept negotiation for legacy clients, and the status code rules, including 294 for partial success."
currentVersion: "Stage 2 (Draft), working draft"
officialUrl: "https://http-spec.graphql.org/draft/"
updatedDate: 2026-10-17
---

## Why GraphQL needed an HTTP specification

The [GraphQL](/specifications/graphql) specification deliberately says nothing about transport. For years every server picked its own answers to the questions that matter at the HTTP layer: whether `GET` is allowed, what the request body looks like, which media type the response has, and above all which status code a failed query gets. The commonest answer to the last one was "always `200`", which left gateways, logs and monitoring unable to tell a broken query from a working one without parsing every body.

GraphQL over HTTP, maintained by the GraphQL Foundation's working group, standardizes those answers. It is at **Stage 2 (Draft)** in the GraphQL Foundation's process, which means it can still change before reaching the Accepted stage. It does not override the GraphQL specification; where they disagree, GraphQL wins.

The headline change is a new response media type, `application/graphql-response+json`. Because a response with that type is known to come from a GraphQL server, the server is free to use meaningful status codes without confusing clients, which read the outcome from the body. If you run a GraphQL server, adopt it: the rules are cheap to follow and fix real operational blind spots.

---

## 1. Request parameters

Every GraphQL-over-HTTP request carries the same four parameters, whatever the method:

| Parameter | Required | Type | Meaning |
| :--- | :--- | :--- | :--- |
| `query` | Yes | string | The GraphQL document source text |
| `operationName` | No | string | Which operation in the document to run |
| `variables` | No | map | Values for the operation's variables |
| `extensions` | No | map | Reserved for implementers, for example persisted query hashes |

`query` is a misleading name: the document can contain mutations. A request with the right names but wrong types, or missing `query`, is not well-formed. A `query` that does not parse is still well-formed at this layer; it fails later, at parsing.

---

## 2. POST and GET

A server **must** accept [`POST`](/methods/post) with a UTF-8 JSON body using `Content-Type: application/json`, and **may** accept other methods, such as [`GET`](/methods/get).

```http
POST /graphql HTTP/1.1
Host: api.example.com
Content-Type: application/json
Accept: application/graphql-response+json, application/json;q=0.9

{"query": "query($id: ID!) { user(id: $id) { name } }", "variables": {"id": "QVBJcy5ndXJ1"}}
```

Clients must send `Content-Type`, and a server should reject a `POST` without one with a `4xx`.

For `GET`, the parameters go in the query string, URL-encoded, with `variables` and `extensions` serialized as JSON strings:

```http
GET /graphql?query=query(%24id%3A%20ID!)%7Buser(id%3A%24id)%7Bname%7D%7D&variables=%7B%22id%22%3A%22QVBJcy5ndXJ1%22%7D HTTP/1.1
Host: api.example.com
Accept: application/graphql-response+json
```

**`GET` must never execute a mutation.** If the document and `operationName` select a mutation, the server must halt with a `4xx`; [`405 Method Not Allowed`](/status-codes/405) is recommended, and RFC 9110 then requires an [`Allow`](/headers/allow) header. This is what keeps `GET` safe, and so what makes it cacheable.

Support `GET` if you want CDN or browser caching of queries, ideally with persisted queries so the URL stays short. Otherwise `POST`-only is fully conformant and simpler.

---

## 3. Media types and Accept

| Media type | Used for |
| :--- | :--- |
| `application/json` | Request bodies, and responses to legacy clients |
| `application/graphql-response+json` | Responses; every conforming server must support it |

A client must list `application/graphql-response+json` in [`Accept`](/headers/accept). When it does not know whether the server supports it, it should send:

```http
Accept: application/graphql-response+json, application/json;q=0.9
```

If a client accepts only `application/json`, which is how a legacy client looks, the server processes the request exactly as if it had asked for the new type, but labels any `2xx` response `Content-Type: application/json`. Error responses keep the meaningful status code either way. If `Accept` names nothing the server supports and not `application/json` either, the server should respond [`406 Not Acceptable`](/status-codes/406), though it may ignore `Accept` and pick a type. See [content negotiation](/guides/content-negotiation) for the general mechanics.

A server that does not support `application/graphql-response+json` at all is a *legacy server* and does not conform.

---

## 4. Status codes

With `application/graphql-response+json`, clients must treat the response as a well-formed GraphQL response regardless of status, and read success or failure from the body. The status code is for everything else on the path: gateways, logs, metrics and anomaly detection.

| GraphQL result | Status |
| :--- | :--- |
| `data` present and not null, no `errors` | `200` (must be `2xx`) |
| `data` present (even null) and `errors` present | `294` recommended |
| No `data` entry: a request error | An appropriate `4xx` or `5xx` |

For request errors the specification recommends specific codes:

| Failure | Status |
| :--- | :--- |
| Request body is not valid JSON | [`400`](/status-codes/400) |
| GraphQL document does not parse | `400` |
| Not a well-formed GraphQL-over-HTTP request | [`422`](/status-codes/422) |
| Document fails validation | `422` |
| Operation cannot be determined unambiguously | `422` |
| Variables cannot be coerced | `422` |
| Mutation via `GET`, or unsupported method | `405` |
| Unsupported request `Content-Type` | [`415`](/status-codes/415) |
| Request body too large | [`413`](/status-codes/413) |
| URI too long | [`414`](/status-codes/414), and the client should switch to `POST` |
| Not permitted | [`401`](/status-codes/401) or [`403`](/status-codes/403) |
| Server unavailable, maintenance, load shedding | [`503`](/status-codes/503) |

### 294 Partial Success

`294` is a status code the specification defines itself, not one registered with IANA. A result with both data and errors is neither a success nor a request failure, and none of `203`, `206` or `207` fits. RFC 9110 requires clients that do not recognize a code to treat it as the `x00` of its class, so an unaware client sees `200`. Use `294` only with `application/graphql-response+json`, and check that your CDN, gateway and caches handle it the way you intend; `294` is not on the list of heuristically cacheable codes and fixed lists in infrastructure will not know it.

If an error prevents producing a GraphQL response at all, the server uses an ordinary `4xx` or `5xx` and must not label the body `application/graphql-response+json`.

---

## 5. Security notes

The specification calls out one cross-site risk specifically. A `POST` with `application/json` triggers a CORS preflight when sent cross-origin; `multipart/form-data` or `application/x-www-form-urlencoded` do not, which opens the endpoint to cross-site request forgery. If you accept those media types (for file uploads, typically), require a custom header that forces a preflight. See [CORS](/guides/cors).

---

## Best Practices

* Return `application/graphql-response+json` and real status codes. "Always `200`" hides failures from every tool that is not a GraphQL client.
* Keep `POST` with `application/json` as the baseline, and add `GET` only for queries you want cached.
* Reject mutations over `GET` with `405` and an `Allow: POST` header.
* Do not turn partial results into `4xx` or `5xx`. Some data came back; that is `294`.
