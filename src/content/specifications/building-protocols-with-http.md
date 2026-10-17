---
title: "Building Protocols with HTTP (RFC 9205, BCP 56)"
description: "A reference for RFC 9205, the IETF's Best Current Practice for designing applications on top of HTTP: generic semantics, links over fixed paths, registered methods and status codes, header fields, caching, and how to version and evolve an HTTP API."
currentVersion: "RFC 9205 (BCP 56)"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9205.html"
---

## What is Building Protocols with HTTP?

RFC 9205, published in June 2022 as BCP 56, is the IETF's guidance on how to define an application that uses HTTP as its substrate. Written by Mark Nottingham, it obsoletes RFC 3205 from 2002, which mostly told people not to use HTTP for things that were not web browsing. Twenty years later almost every API is built on HTTP, so the question is no longer whether but how, and RFC 9205 answers it.

It is written for IETF working groups, but it says itself that it "might be applicable in other situations", and in practice it is the closest thing HTTP API design has to an official style guide. Its core argument is short: most of HTTP's value is in its **generic semantics**, the meaning of methods, status codes, header fields and caching that every client, proxy, CDN and library already understands. An API that respects those semantics gets that whole ecosystem for free. An API that overloads or redefines them breaks it, often in ways that only surface when a cache or a gateway sits in the middle.

If you read one RFC before designing a public HTTP API, read this one. It is shorter than [HTTP Semantics](/specifications/http-semantics) and tells you which parts of it matter most.

---

## 1. When the Advice Applies

RFC 9205 applies to any application that uses HTTP's identifying features: ports 80 or 443, the `http` or `https` URI schemes, an HTTP ALPN protocol ID, or the HTTP IANA registries. A protocol that only borrows HTTP's look, a request line and some headers over its own port, is told not to use any of those things and to establish its own instead.

The document is aimed at applications with multiple implementations, deployments that are not coordinated with each other, and clients that the server operator does not control. A single private service with one client that ships alongside it can bend some of these rules. A specification, a platform API, or anything a third party will implement cannot.

---

## 2. Generic Semantics Come First

Section 3.1 is the heart of the document: "Much of the value of HTTP is in its generic semantics." Applications MUST NOT redefine, refine or overlay the meaning of generic protocol elements. Application-specific meaning goes in message content, in header fields and in the resources themselves.

In practice this rules out a family of common mistakes:

| Mistake | Why it breaks |
| :--- | :--- |
| Returning `200` with an error in the body | Caches store it, monitoring counts it as success, retries never fire |
| Using [`GET`](/methods/get) for something that changes state | Crawlers, prefetchers and caches will issue it without asking |
| Inventing a status code, say `499`, for an application error | Intermediaries and libraries treat unknown codes as the class's `x00` |
| Giving a standard header a private meaning | Proxies act on the standard meaning, not yours |

Section 3.3 lists what you keep by playing along: message framing, multiplexing, TLS integration, intermediaries, caching, content negotiation, and more. None of it requires work in your application. All of it can be lost by a design that fights HTTP rather than using it.

---

## 3. Links, Not Fixed Paths

Section 4.4.1 states it plainly: "An application cannot define a fixed prefix for its URL paths." Its example is a specification declaring that every resource lives under `/app/v1`. That is fine for a single deployment's own API, and inappropriate in a specification, because URL paths belong to the server's owner (the subject of RFC 8820, BCP 190, URI Design and Ownership).

Instead, an application should let clients discover URLs. RFC 9205 offers three mechanisms:

| Mechanism | How the client finds resources |
| :--- | :--- |
| A registered well-known URI | A fixed entry point under `/.well-known/`, which then links onward. See [API Catalog](/specifications/api-catalog). |
| A [URI Template](/specifications/uri-template) | Supplied by the server authority, so the deployment chooses the shape |
| A discovery document | A resource whose location is configured, listing links to everything else |

Section 3.2 makes the general point: applications are RECOMMENDED to use links rather than statically defined paths. Links, typed with relation types from [Web Linking](/specifications/web-linking) and carried in content or the [`Link`](/headers/link) header, let a deployment put resources on different hosts, mix applications on one origin, add features without a spec change, and invalidate caches correctly. This is the same idea [HATEOAS](/guides/hateoas) describes, argued from operational benefit rather than from REST theory.

For a private API where you control both ends, a fixed `/v1/` prefix is still a reasonable choice. For anything that must be deployable by people other than you, publish an entry point and link from it.

The default URI scheme is `https`. Section 4.4.2 lists what a new scheme costs: browsers will not handle it, generic software will not recognize it, and cookies, caching and HSTS may stop working.

---

## 4. Methods

Applications MUST confine themselves to registered HTTP methods. Application-specific methods were once common, and HTTP now forbids them. A new method is rare, needs IETF Review to be registered (the policy RFC 9110 sets for the method registry), and should be generic, useful beyond one application.

On [`GET`](/methods/get), Section 4.5.1 is direct: content in a GET request "is not recommended, has no meaning, and will be either ignored or rejected." For queries too large or too sensitive for the URI, it allows [`POST`](/methods/post) and suggests supporting both, since POST gives up GET's caching and linkability. That gap is what the [QUERY method](/specifications/query-method) now fills: a safe, idempotent method with a request body.

Section 4.5.2 discourages [`OPTIONS`](/methods/options) for metadata discovery: the response is not cacheable, it costs an extra round trip, it cannot be linked to, and server support is inconsistent. Use a well-known URI or a separate metadata resource advertised with a `Link` header, which a client can find with [`HEAD`](/methods/head).

---

## 5. Status Codes

Status codes are generated by more than your application. Proxies, gateways, load balancers and server frameworks all produce them. So Section 4.6 says applications should not give them application-specific meaning, and "should not specify a one-to-one relationship between status codes and application errors."

| Rule | Level |
| :--- | :--- |
| Use only registered status codes | MUST |
| Do not re-specify the semantics of an existing code | MUST NOT |
| Use the most applicable generic code, put detail in content or headers | Recommended |
| Do not require particular reason phrases | Recommended |
| Clients treat an unrecognized code as the generic `n00` of its class | Expected client behavior |

The finer detail belongs in the body, and RFC 9205 points to [Problem Details](/specifications/problem-details) as one way to carry it. Its reference is to RFC 7807, which RFC 9457 has since replaced with the same wire format.

```http
HTTP/1.1 403 Forbidden
Content-Type: application/problem+json

{
  "type": "https://example.com/probs/out-of-credit",
  "title": "You do not have enough credit.",
  "status": 403
}
```

Redirects get their own rules in Section 4.6.1. [`301`](/status-codes/301) and [`302`](/status-codes/302) allow a client to change POST to GET, [`307`](/status-codes/307) and [`308`](/status-codes/308) preserve the method, and [`303`](/status-codes/303) points at a result to fetch with GET. An application has to say whether clients follow redirects automatically, and when.

---

## 6. Header Fields

Use a header field when intermediaries or generic software need the information, or when it cannot go in the content. Otherwise put it in the body. Section 4.7 sets the rules for defining new ones:

* New header fields MUST be registered with IANA.
* [Structured Fields](/specifications/structured-fields) are RECOMMENDED for new fields, so parsing is defined rather than improvised.
* Existing header field semantics MUST NOT be redefined.
* An application-specific field may carry an application identifier as a prefix, but the point is to avoid taking generic names, not to reserve a namespace. Do not reach for `X-`, which RFC 6648 deprecated as a convention.

Section 4.8 asks for a registered media type per distinct format, following RFC 6838. A specific media type is also one of the browser mitigations below, and one of the versioning levers.

---

## 7. Caching

Section 4.9 assumes caches exist and tells applications to work with them rather than around them:

| Situation | What to send |
| :--- | :--- |
| Safe to reuse, even briefly | An explicit freshness lifetime, preferably `max-age` |
| Must never be stored | `no-store` |
| May be stored, must be revalidated before use | `no-cache` |
| Must not be served stale | `must-revalidate`, plus validators such as [`ETag`](/headers/etag) |
| Varies by a request header | [`Vary`](/headers/vary) on every response, or make it uncacheable |

The recommendation to assign "even a short freshness lifetime" is worth taking seriously for read-heavy APIs: a few seconds of [`Cache-Control: max-age`](/headers/cache-control) on a popular resource lets every shared cache absorb load. An application's own notion of lifetime, say a token's validity, is a separate thing from HTTP freshness and should be conveyed separately. See [HTTP Caching](/specifications/http-caching).

---

## 8. State, Authentication and Browsers

Cookies are allowed for state, with their scoping specified carefully. The bigger concern is ambient authority: a credential the client sends automatically, like a cookie or a TLS client certificate, will also be sent on a request an attacker induced. Section 4.12 recommends request-specific tokens, such as an [`Authorization`](/headers/authorization) header, to mitigate it. Basic authentication is unsuitable without a secure channel.

Section 4.13 reminds API designers that their resources are reachable from a browser whether they intended it or not, so cross-site request forgery and cross-site scripting apply. Its suggested mitigations: an application-specific media type, [`X-Content-Type-Options: nosniff`](/headers/x-content-type-options), Content-Security-Policy, Referrer-Policy, `HttpOnly` cookies, and not compressing sensitive information such as tokens and passwords, because a browser lets an attacker probe what compresses well. Cross-origin browser access is [CORS](/guides/cors)'s job.

Section 4.14 asks applications to coexist on one origin: do not mandate particular cookie names or authentication realm names, so a deployment can configure them.

---

## 9. Server Push and Multiple Requests

Section 4.15 advises against designing around HTTP/2 server push. It is hop-by-hop, absent from HTTP/1.1, has no browser API, and is not part of HTTP's core semantics, so future versions may drop it. For most of what push was meant for, [`103 Early Hints`](/status-codes/103) is the suggested alternative. For server-to-client messages, use [Server-Sent Events](/specifications/server-sent-events) or [webhooks](/guides/webhooks).

Section 4.11 adds a rule that catches people who tune for one HTTP version: applications MUST NOT assume any relationship between separate requests that share a transport connection. Requests are independent. A proxy may split them across connections or merge them with other clients' traffic.

---

## 10. Versioning and Evolution

Section 4.16 lists three ways to make a backwards-incompatible change:

| Mechanism | Example |
| :--- | :--- |
| A distinct link relation type | A new relation pointing at the resource that implements the new behavior |
| A distinct media type | `application/vnd.example.order-v2+json`, chosen through [`Accept`](/headers/accept) |
| A distinct header field | A new field carrying the new functionality outside the content |

Two things follow. First, it does not list a version segment in the URL path, which is consistent with Section 4.4.1: in a specification, the path is not yours to version. Second, it does not mention a version header carrying a number. Each mechanism names the new capability rather than a version. That is a design choice worth copying even when you do use `/v1/` for a private API: add new things under new names, and you will need a new version far less often. See [versioning](/guides/versioning) and [breaking changes](/guides/breaking-changes).

Section 4.1 adds the protocol-level version rule: it is NOT RECOMMENDED to require a minimum HTTP version, and an application MUST NOT specify a maximum one. Write examples in HTTP/1.1 syntax, which is the most readable, and let HTTP/2 and [HTTP/3](/specifications/http3) carry the same semantics.

---

## Best Practices

* Treat RFC 9205 as the review checklist for any API that third parties will implement or deploy.
* Return the most specific registered status code that is true, and put the application error in a [Problem Details](/specifications/problem-details) body.
* Publish an entry point and link from it instead of documenting a fixed URL layout, when other people will run your API.
* Register new header fields and media types, and use Structured Fields for new headers.
* Send freshness information on every cacheable response, and `no-store` on the ones that must not be stored.
* Do not build on server push, `OPTIONS` discovery, or a body on `GET`. Each one has a better-supported alternative named above.
