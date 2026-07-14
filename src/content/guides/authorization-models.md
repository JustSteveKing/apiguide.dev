---
title: "Authorization Models: RBAC & ABAC"
description: "How to choose and combine RBAC, ABAC, and ReBAC, apply least privilege, and prevent object-level authorization failures like BOLA."
category: "security"
---

## Introduction to Authorization Models

Authentication proves who a caller is; authorization decides what that caller may do. Getting authorization wrong is the most common way APIs get breached, and broken object-level checks sit at the very top of the OWASP API Security Top 10. This guide compares the three dominant access-control models — RBAC, ABAC, and ReBAC — and covers the standards and patterns that make them safe to deploy: OAuth scopes, least privilege, externalized policy engines, and object-level authorization.

If you have not yet nailed down authentication, start with the [authentication guide](/guides/authentication) and [OAuth & API keys](/guides/oauth-api-keys). For the broader security picture, see [API security](/guides/api-security).

---

## 1. Role-Based Access Control (RBAC)

RBAC assigns permissions to roles and then assigns roles to users. A `viewer` role might have read-only access while an `editor` role can read and write.

* **Strengths**: Simple to reason about and implement when user functions are stable and access needs are coarse-grained.
* **Weakness**: *Role explosion*. As you need finer control, roles multiply combinatorially (one role per region, per team, per resource type), producing management overhead and losing context awareness.

RBAC is a solid baseline, but on its own it cannot express conditions like "only during business hours" or "only for records the user created."

---

## 2. Attribute-Based Access Control (ABAC)

ABAC makes decisions from a dynamic set of attributes describing the **subject**, **resource**, **action**, and **environment**. For example: users in the `finance` department may read financial documents during business hours.

```json
{
  "subject": { "department": "finance", "clearance": "L2" },
  "resource": { "type": "invoice", "region": "eu" },
  "action": "read",
  "environment": { "time": "2026-07-10T14:00:00Z" }
}
```

ABAC gives fine-grained, context-aware control, which suits cloud-native and multi-tenant systems.

### Where attributes come from

Trust matters more than flexibility. Signed OAuth access tokens and their claims are an excellent attribute source because their integrity is protected — even when delivered in the `Authorization` request header, the signature makes their claims safe to rely on *after* you verify it. You may supplement them with data from your own database or another trusted store. **Never** trust *unsigned or unverified* attributes taken from request headers, query strings, or the body — those are trivially spoofed. See [`Authorization`](/headers/authorization) and [JWT](/specifications/jwt).

---

## 3. Relationship-Based Access Control (ReBAC)

ReBAC bases access on relationships between entities, typically modeled as a graph. A user can view a document because they are a `member` of a folder that `contains` it. This is the model behind Google's Zanzibar and its open-source implementation OpenFGA.

* Excellent for inheritance and sharing scenarios (nested folders, org hierarchies, collaboration).
* Considered a superset of RBAC, and it can cover many ABAC cases by expressing attributes as relationships.
* Stores access as object-relation-user tuples and answers both permission checks and reverse "who can access X" queries.

---

## 4. Choosing and Combining Models

Most production systems use a **hybrid** approach rather than a single model.

| Model | Decision basis | Best fit |
| --- | --- | --- |
| RBAC | Assigned role | Stable, coarse-grained access |
| ABAC | Subject/resource/action/environment attributes | Dynamic, context-dependent rules |
| ReBAC | Relationships between entities | Sharing, inheritance, collaboration |

A common composition: RBAC sets coarse access (a user is an `admin`), ABAC adds dynamic conditions (an admin may only approve requests from their own region), and ReBAC layers on sharing and inheritance. Externalized policy engines are often used to unify these.

---

## 5. OAuth Scopes and Least Privilege

**OAuth scopes** are permission strings defining what a client may do on a user's behalf, such as `read:documents`. Scopes define the *blast radius* if a client is compromised.

* Request only the **minimal scopes** needed; avoid over-scoping "just in case."
* Watch for **toxic combinations** — individually harmless scopes that together enable lateral movement.
* Treat long-lived grants (for example refresh tokens via `offline_access`) as persistent risk and review them.

The **principle of least privilege** applies across every model: grant the minimum access needed, for the minimum time. Overprivileged clients carry two kinds of excess permission:

* **Unused permissions** — granted but never exercised (horizontal escalation risk).
* **Reducible permissions** — a lower-privileged alternative would suffice, such as `User.Read.All` where read-only would do (vertical escalation risk).

Default to deny, prefer short-lived scoped tokens, and audit granted permissions against what clients actually use.

---

## 6. Externalized Policy Engines (PEP/PDP)

A durable pattern separates authorization logic from application code using a **Policy Enforcement Point (PEP)** and a **Policy Decision Point (PDP)**.

* The **PEP** sits at every entry point — API gateway, microservice, backend-for-frontend — intercepts the request and asks the PDP for a decision.
* The **PDP** (for example Open Policy Agent evaluating Rego policies) returns permit or deny.

```http
POST /v1/data/authz/allow HTTP/1.1
Host: api.apiguide.dev
Content-Type: application/json

{ "input": { "user": "alice", "action": "read", "resource": "doc-42" } }
```

```json
{ "result": { "allow": true } }
```

Externalizing decisions gives consistent enforcement, auditability, and policy updates without redeploying services. Make a PEP a prerequisite for access to every API.

---

## 7. Object-Level Authorization and BOLA

**Broken Object Level Authorization (BOLA)** is the number one API security risk and accounts for a large share of real attacks. It occurs when an API authorizes the *function* but fails to verify the caller may access the *specific object* referenced.

```http
GET /accounts/123/orders HTTP/1.1
Host: api.apiguide.dev
Authorization: Bearer <token for user 456>
```

If changing `123` to another account number returns someone else's data, that is BOLA — horizontal privilege escalation. By design the user is allowed to call the endpoint; the violation happens at the object level.

### Preventing BOLA

* Enforce an **object-level check on every action**, validating the authenticated identity's permission against the requested object — not just that the user is logged in.
* Comparing the session user ID to the ID in the URL is **not** sufficient on its own; check the actual ownership or relationship.
* Prefer random, unpredictable identifiers (GUIDs) over sequential integers to reduce enumeration, but treat this as defense in depth, not a fix.
* Use scopes for coarse client permissions and layer object-level checks on top.
* Add multi-user authorization tests to CI so a request from user A can never read user B's objects.

A closely related flaw, Broken Function Level Authorization (BFLA), is when a caller reaches an endpoint they should not have access to at all. Guard both: verify the function *and* the object. See [`401 Unauthorized`](/status-codes/401) and [`403 Forbidden`](/status-codes/403) for the correct responses when checks fail.

---

## Summary

Robust API authorization blends models to fit the problem: RBAC for coarse roles, ABAC for dynamic conditions, ReBAC for relationships and sharing. Anchor decisions on trusted, signed attributes, keep scopes and tokens minimal under least privilege, and externalize policy through PEP/PDP so enforcement stays consistent and auditable. Above all, check authorization at the object level on every request — the failure to do so is the most exploited weakness in modern APIs.
