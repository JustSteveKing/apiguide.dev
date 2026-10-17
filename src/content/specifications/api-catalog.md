---
title: "api-catalog (RFC 9727)"
description: "A reference for RFC 9727, which defines the /.well-known/api-catalog URI and the api-catalog link relation so clients can discover a publisher's APIs, their descriptions and their documentation from a known location."
currentVersion: "RFC 9727"
officialUrl: "https://www.rfc-editor.org/rfc/rfc9727.html"
updatedDate: 2026-10-17
---

## What is api-catalog?

Finding an organization's APIs has always meant a human reading a developer portal. There was no standard place an automated client could look to learn which APIs a host publishes, where their [OpenAPI](/specifications/openapi) descriptions are, or where the documentation lives. Every portal had its own layout, and crawlers, API gateways, governance tools and AI agents each scraped them differently.

RFC 9727, published as a Proposed Standard in June 2025, fixes a location and a format. A publisher serves an **API catalog** at `/.well-known/api-catalog`: a [Linkset](/specifications/linkset) (RFC 9264) document listing its APIs, each with links to its machine-readable description, its human documentation and any other metadata. It also registers the `api-catalog` link relation, so any resource can point to the catalog.

If you publish APIs for others to consume, serve one. It costs a static JSON file, and it is the one discovery mechanism that is an IETF standard rather than a vendor convention. For an agent or crawler arriving at a host cold, it is the obvious first request; see the [agent-ready checklist](/guides/agent-ready-checklist) for what else such a client needs.

---

## 1. The well-known URI

| Request | Required behavior |
| :--- | :--- |
| `GET /.well-known/api-catalog` | Returns the API catalog document |
| `HEAD /.well-known/api-catalog` | Returns a [`Link`](/headers/link) header with `rel="api-catalog"` pointing at the catalog |

The publisher decides where the catalog actually lives; the well-known URI is the fixed entry point to it. The `HEAD` behavior lets a client find the real location without downloading the document, and it means the catalog can sit wherever is convenient to deploy, such as a developer portal or an object store.

```http
HEAD /.well-known/api-catalog HTTP/1.1
Host: www.example.com

HTTP/1.1 200 OK
Link: </my_api_catalog.json>; rel="api-catalog"
```

The same `Link` can go on any other response, typically the home page, so a client that lands on your site rather than on the well-known path can still find the catalog.

---

## 2. The catalog document

The catalog MUST be available as `application/linkset+json`, and SHOULD carry the profile parameter that identifies it as an API catalog:

```http
Content-Type: application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"
```

Other formats may be offered through content negotiation, but if another format is your primary one you still have to provide the Linkset form. At the well-known location, the Linkset form is mandatory.

The minimal catalog, from RFC 9727 Appendix A.2, lists APIs with the `item` relation (RFC 6573):

```json
{ "linkset":
 [
   { "anchor": "https://www.example.com/.well-known/api-catalog",
     "item": [
       {"href": "https://developer.example.com/apis/foo_api"},
       {"href": "https://developer.example.com/apis/bar_api"},
       {"href": "https://developer.example.com/apis/cantona_api"}
     ]
   }
 ]
}
```

That form works if each API endpoint describes itself. The richer form, and the one worth publishing, gives each API its own context object with the RFC 8631 service relations:

```json
{
  "linkset": [
    {
      "anchor": "https://api.example.com/orders/v2",
      "service-desc": [
        { "href": "https://api.example.com/orders/v2/openapi.json",
          "type": "application/vnd.oai.openapi+json" }
      ],
      "service-doc": [
        { "href": "https://developer.example.com/orders", "type": "text/html" }
      ],
      "status": [
        { "href": "https://api.example.com/orders/v2/health" }
      ]
    }
  ]
}
```

---

## 3. Link relations

| Relation | Defined in | Points to |
| :--- | :--- | :--- |
| `api-catalog` | RFC 9727 | An API catalog. Used in a `Link` header to find the catalog, and inside a catalog to nest another one |
| `item` | RFC 6573 | An API that is a member of the catalog |
| `service-desc` | RFC 8631 | A machine-readable description of the API, such as an OpenAPI document |
| `service-doc` | RFC 8631 | Human-readable documentation |
| `service-meta` | RFC 8631 | Other metadata about the API, such as policies or terms |
| `status` | RFC 8631 | The API's status or health resource |

RFC 9727 requires the catalog to include links to the API endpoints and says metadata not carried in the catalog SHOULD be available at the endpoints themselves. In practice, put `service-desc` in the catalog: it is the link every tool wants, and making a client fetch each endpoint to find it defeats the point.

---

## 4. Nesting and multiple domains

A catalog can link to other catalogs with `api-catalog`, which is how a large publisher splits its APIs by business unit or product without one enormous document. A catalog may also link to a catalog on a third party's domain.

If your APIs span several domains, publish the well-known URI on each, and have every one return the same catalog. Pick one instance as canonical; the others SHOULD redirect to it.

---

## Best Practices

* Put `service-desc` links to your OpenAPI documents in the catalog, with an accurate `type`. That is what makes the catalog useful to tooling.
* Use absolute URIs throughout. The catalog is often fetched through a redirect from a different host.
* Audit it before publishing. The RFC calls out internal-only APIs listed by mistake as a real risk; a catalog is a map for attackers as well as integrators.
* Serve it over TLS, cache it, and rate-limit it like any other public endpoint, as RFC 9727 recommends.
* Do not invent a parallel `/apis.json` or `/.well-known/openapi` for discovery. Use the registered well-known URI.
