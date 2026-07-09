---
title: "OData (Open Data Protocol)"
description: "An overview of the OData specification, covering standardized query conventions, resource modeling, and where it fits alongside ad-hoc REST APIs."
currentVersion: "4.01"
officialUrl: "https://www.odata.org/"
---

## What is OData?

OData (Open Data Protocol) is an OASIS standard that defines a uniform way to query and manipulate data over HTTP. Rather than leaving pagination, filtering, and field selection to each API team's own conventions, OData specifies a fixed set of query options that any compliant client can rely on: `$filter`, `$select`, `$expand`, `$orderby`, `$top`, and `$skip`, among others. It also standardizes how services describe their own data model through a machine-readable metadata document, so clients can discover entities, relationships, and operations without out-of-band documentation.

OData grew out of Microsoft's work on the Astoria project in the mid-2000s and was later standardized under OASIS, which is why it remains most visible in Microsoft-adjacent tooling today.

---

## 1. The Query Conventions

OData's core value is a shared vocabulary for the kinds of queries almost every list-based API ends up needing:

* **`$filter`**: Restrict results using boolean expressions, e.g. `?$filter=Price gt 20 and Category eq 'Books'`.
* **`$select`**: Return only specific properties, e.g. `?$select=Name,Price` (OData's answer to sparse fieldsets).
* **`$expand`**: Inline related entities in a single response, e.g. `?$expand=Category,Reviews`, avoiding the classic N+1 pattern of separate follow-up requests.
* **`$orderby`**: Sort results, e.g. `?$orderby=Price desc`.
* **`$top` / `$skip`**: Page through result sets, e.g. `?$top=10&$skip=20`.

```http
GET /Products?$filter=Price gt 20&$select=Name,Price&$orderby=Price desc&$top=10
```

Because every OData service exposes these options with identical syntax and semantics, a generic OData client library can query any compliant service without custom integration code — something that isn't true of REST APIs with bespoke filtering schemes.

---

## 2. Metadata and Entity Data Model

Every OData service publishes a metadata document (`$metadata`) describing its Entity Data Model (EDM): entity types, properties, keys, relationships, and available operations. This document is written in the Common Schema Definition Language (CSDL), typically serialized as XML.

```xml
<EntityType Name="Product">
  <Key>
    <PropertyRef Name="ID" />
  </Key>
  <Property Name="ID" Type="Edm.Int32" Nullable="false" />
  <Property Name="Name" Type="Edm.String" />
  <Property Name="Price" Type="Edm.Decimal" />
  <NavigationProperty Name="Category" Type="Sample.Category" />
</EntityType>
```

This is a meaningful difference from typical REST APIs, which usually describe their shape through separate documentation (or an OpenAPI file maintained alongside, but not enforced by, the runtime API itself). In OData, the metadata document *is* the live contract the service is running against.

---

## 3. How OData Differs from Ad-Hoc REST Filtering

Most REST APIs invent their own filtering and pagination conventions — `?status=active&page=2&limit=25` in one API, `?filter[status]=active&page[number]=2` in another. Each variation is reasonable in isolation, but it means every client integration starts from scratch reading documentation to learn that particular API's dialect.

| Concern | Ad-hoc REST | OData |
|---|---|---|
| Filtering syntax | Defined per-API (`?status=active`, `?filter[status]=active`, etc.) | Fixed expression language (`$filter=status eq 'active'`) |
| Field selection | Inconsistent or absent | Standardized (`$select`) |
| Related resource inclusion | Custom `include` params or separate requests | Standardized (`$expand`) |
| Schema discovery | External docs (OpenAPI, README) | Built-in `$metadata` endpoint |
| Client tooling | API-specific SDKs | Generic OData clients work against any compliant service |

The trade-off is flexibility: OData's query language is powerful but verbose, and its metadata model assumes a fairly structured, entity-relationship view of your data — a good fit for CRUD-heavy business data, less natural for APIs built around actions or events rather than resources.

---

## 4. Where OData Shows Up in Practice

OData is not the default choice for public consumer-facing APIs, but it's deeply embedded in specific ecosystems:

* **Microsoft products**: SharePoint, Dynamics 365, Power BI, and Azure Active Directory Graph all expose OData endpoints. Microsoft Graph itself is heavily OData-influenced.
* **SAP**: SAP Gateway and the SAP Business Technology Platform use OData extensively for exposing business data (customers, orders, financial records) to UI5/Fiori front ends.
* **Enterprise data platforms**: Systems that need generic, tool-driven data access (BI tools, reporting dashboards, low-code platforms) favor OData because a single client library can introspect and query any OData-compliant backend.

If you're building a general-purpose public API, plain REST or GraphQL is usually a simpler starting point. But if you're integrating with an existing Microsoft or SAP-centric enterprise stack, you'll likely encounter OData whether you choose it or not.

## Best Practices

* Don't adopt OData purely for its query syntax on a greenfield API — the standard makes the most sense when you also want the discovery and tooling benefits of the shared metadata model, not just `$filter`-style querying.
* If you're consuming an existing OData service, use a generated client from the `$metadata` document rather than hand-rolling query strings; it keeps your code in sync when the service's model changes.
