---
title: "Multi-Tenancy Patterns"
description: "Design multi-tenant APIs with silo, pool, and bridge isolation, tenant routing, noisy-neighbor mitigation, and verified tenant claims."
category: "core"
---

## Introduction to Multi-Tenancy

Multi-tenancy lets a single deployment serve many tenants (customers or organizations) while keeping their data and workloads isolated. It underpins most SaaS platforms, trading raw resource sharing for cost efficiency against the complexity of enforcing strong isolation. The core decisions are how to partition tenant data, how to route requests to the right tenant context, and how to prevent one tenant from degrading another. Note that data partitioning describes how data is *stored*; isolation is a separate concern that must be enforced explicitly on top of it.

---

## 1. Isolation Models: Silo, Pool, and Bridge

### Silo (database-per-tenant)

Each tenant gets a dedicated database instance. This creates a hard boundary at the process, memory, and storage levels, making accidental cross-tenant access effectively impossible and neutralizing the noisy-neighbor problem at the data tier. It suits high-security and regulated workloads (HIPAA, PCI-DSS) and premium tiers, at the cost of higher infrastructure spend and the operational burden of managing many instances.

### Pool (shared database and schema)

All tenants share one database and schema, distinguished by a `tenant_id` column, with isolation enforced in the application layer via `WHERE tenant_id = ?` on every query. It is the most cost-efficient and simplest to operate for a single schema, but carries the highest data-leakage risk if a query is ever missed. PostgreSQL Row-Level Security adds database-level enforcement as a safety net:

```sql
CREATE POLICY tenant_isolation ON documents
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id'));
```

### Schema-per-tenant

A middle ground where tenants share a database instance but each has its own schema, isolated at the connection level (for example a PostgreSQL `search_path`) rather than a per-query filter. It allows per-tenant schema customization but complicates migrations across many schemas.

### Bridge (hybrid)

The bridge model mixes silo and pool, mapping different isolation levels to different segments: free-tier tenants share a schema while enterprise tenants get dedicated databases. It optimizes unit economics and satisfies varied compliance needs but is the most complex to provision and operate.

| Model | Isolation | Cost | Operational complexity |
| --- | --- | --- | --- |
| Silo | Highest | Highest | High |
| Schema-per-tenant | Medium-high | Medium | Medium-high |
| Pool | Application-enforced | Lowest | Low |
| Bridge | Per-segment | Mixed | Highest |

---

## 2. Tenant Routing and Identification

Resolve the tenant early in the request lifecycle, in middleware or at the gateway. Three routing styles are common.

### Subdomain / custom domain

```http
GET /v1/orders HTTP/1.1
Host: acme.api.apiguide.dev
```

DNS-level tenancy gives clear visual separation and is cache-friendly. Wildcard DNS keeps configuration simple; custom domains add branding.

### URI path

```http
GET /v1/tenants/acme/orders HTTP/1.1
Host: api.apiguide.dev
```

Explicit and cache-friendly, and necessary when tenants use separate databases so the router knows which to connect to. The trade-off is longer URIs and more routing logic.

### HTTP header

```http
GET /v1/orders HTTP/1.1
Host: api.apiguide.dev
X-Tenant-ID: acme
```

Keeps tenant context out of the URI but requires a Layer 7 gateway to inspect headers, adds processing overhead, and can break caches keyed only on the URI, risking cross-tenant cache leakage.

Whichever routing method you use, the **tenant ID must be a verified claim inside the access token, never a client-supplied value trusted as-is**. Derive the request's tenant context from the route, then reject any request where the routed tenant does not match the token's `tenantId` claim. Tokens should be locally verifiable via a first-party JWKS endpoint, and signing keys rotated regularly.

---

## 3. The Noisy-Neighbor Problem

A noisy neighbor is a tenant whose heavy resource use (CPU, memory, I/O, or bandwidth), often from bulk ingestion or integration calls, degrades performance for others sharing the infrastructure. Mitigate it in layers:

* **Resource quotas and limits**: cap per-tenant CPU and memory at the infrastructure level (for example Kubernetes requests and limits) or in the application.
* **Per-tenant rate limiting**: apply a token bucket per tenant at the edge and return `429 Too Many Requests` with a [`Retry-After`](/headers/retry-after) header when a tenant exceeds its budget.
* **Dynamic scaling**: use autoscaling to absorb spikes.
* **Queue prioritization**: for async work, use per-tenant or priority queues so a backlog from one tenant does not starve others.
* **Isolation choice**: siloed data models remove the problem at the data tier entirely.
* **Monitoring and migration**: track per-tenant consumption and, in extreme cases, migrate a persistently disruptive tenant to dedicated resources.

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
```

---

## 4. Security and Isolation Enforcement

Isolation must hold in every shared component, not just the primary database. Authentication and authorization alone do not achieve isolation; explicit isolation constructs are required.

* **Tenant context**: establish `tenantId` early using non-guessable identifiers (such as UUIDv7), bind it to the authenticated session, and propagate it through every layer.
* **Authorization**: make roles tenant-scoped ("Admin of Tenant A" is distinct from "Admin of Tenant B"). Combine RBAC and ABAC behind centralized authorization middleware and a policy enforcement point, rather than scattering checks through the code.
* **Shared components**: prefix cache keys with the tenant ID and validate the tenant on retrieval; scope message-queue topics with ACLs; prefix file-storage paths and bound them with IAM policies.
* **Encryption**: for regulated tenants, per-tenant encryption keys provide cryptographic separation at rest.
* **Auditing**: log security-sensitive operations with tenant context and alert on any cross-tenant access attempt.

---

## 5. Balancing the Trade-offs

There is no universally correct pattern. Isolation strength, cost, operational complexity, and performance pull against each other, and the right mix depends on tenant scale, data growth, compliance obligations, and your team's operational maturity. The durable practices are consistent: resolve tenant context explicitly and early, validate the tenant identifier server-side from a verified token claim, and enforce isolation in layers across every shared component. Mature platforms increasingly adopt bridge models with tiered isolation and distributed SQL databases that hide sharding complexity, but continuous monitoring and auditing remain essential regardless of the model chosen.
