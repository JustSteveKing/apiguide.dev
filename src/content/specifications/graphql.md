---
title: GraphQL
description: A query and schema definition language specification for APIs, providing a client-specified runtime to request exact data shapes.
currentVersion: Oct 2021
officialUrl: https://spec.graphql.org/
---

GraphQL is an open-source data query and manipulation language for APIs, and a runtime for fulfilling queries with existing data. It was developed internally by Facebook in 2012 before being publicly released in 2015, and is now hosted by the GraphQL Foundation.

By providing a complete and understandable description of the data in your API, GraphQL gives clients the power to ask for exactly what they need and nothing more. This mitigates common REST issues like **over-fetching** (retrieving unnecessary fields) and **under-fetching** (needing to make multiple round-trips to nested endpoints).

## Architecture & Resolver Engine

In a GraphQL architecture, client applications send query payloads detailing the exact fields they require. The GraphQL execution engine processes this request against a strongly typed Schema, resolving fields through dedicated execution handlers.

### The GraphQL Execution Pipeline

When a client requests data from a GraphQL API, the engine processes the operation through a series of structured steps:
1. **Request POST**: The client sends a single HTTP `POST` request to the `/graphql` endpoint containing the query string (selection set) and variable parameters.
2. **Parsing & Validation**: The GraphQL Engine parses the query and validates it against the strongly typed Schema to check for syntax errors, unknown fields, or security depth violations.
3. **Resolver Invocation**: The execution engine invokes dedicated **Field Resolvers** for each requested node in the query selection tree.
4. **Data Fetching**: Resolvers run concurrently to fetch information from underlying systems—performing SQL database reads, hitting key-value caches like Redis, or routing requests to external REST microservices.
5. **Payload Serialization**: The engine packages the resolved values into a single JSON object matching the exact shape of the client's original query, returning it to the application.

---

## Schema Definition Language (SDL)

At the heart of any GraphQL service is a schema, which defines the types, fields, and operations available. The schema is written using the standard **Schema Definition Language (SDL)**.

### Core Types

```graphql
# Object Type representing a catalog resource
type User {
  id: ID!
  name: String!
  email: String!
  role: UserRole!
  posts(limit: Int): [Post!]!
}

# Enum Type restricting role values
enum UserRole {
  ADMIN
  EDITOR
  MEMBER
}

# Nested Object Type
type Post {
  id: ID!
  title: String!
  content: String
  author: User!
}
```

### Operation Root Types

Every schema defines root operation types: **Query** (read), **Mutation** (write), and **Subscription** (real-time stream).

```graphql
type Query {
  me: User
  userById(id: ID!): User
  searchPosts(query: String!): [Post!]!
}

type Mutation {
  createPost(title: String!, content: String): Post!
  deletePost(id: ID!): Boolean!
}
```

---

## Operation Types

Clients execute operations by sending payloads specifying the operation type, name, variables, and selection set.

### 1. Queries (Read)

Unlike REST endpoints where the payload structure is determined by the server, GraphQL queries let the client select specific properties.

```graphql
# Request
query GetMyProfile {
  me {
    name
    role
    posts(limit: 2) {
      title
    }
  }
}
```

```json
// Response
{
  "data": {
    "me": {
      "name": "Steve McDougall",
      "role": "ADMIN",
      "posts": [
        { "title": "Understanding HTTP Caching" },
        { "title": "Getting Started with OpenAPI 3.1" }
      ]
    }
  }
}
```

### 2. Mutations (Write)

Mutations are used to create, update, or delete data on the server. Like queries, mutations return resolved objects, allowing immediate client UI updates.

```graphql
# Request
mutation CreateNewArticle($title: String!, $body: String!) {
  createPost(title: $title, content: $body) {
    id
    title
    author {
      name
    }
  }
}
```

---

## Comparison: OpenAPI (REST) vs. GraphQL

| Feature | OpenAPI / REST | GraphQL |
| :--- | :--- | :--- |
| **Data Fetching** | Multi-endpoint; server defines response shape. | Single endpoint (`/graphql`); client defines shape. |
| **Typing & Validation** | JSON Schema (external validation). | Strongly typed Schema (built-in parser validation). |
| **Versioning** | URI paths (`/v1/`), header versioning, or media type. | Versionless; deprecated fields are marked (`@deprecated`). |
| **Real-time** | Webhooks, WebSockets, or Server-Sent Events (SSE). | Native Subscriptions via WebSockets or SSE. |
| **Caching** | Native HTTP Caching (ETag, Cache-Control). | Client-side/Application layer caching (Apollo/Relay). |

---

## Best Practices in GraphQL Design

1. **Use HTTP POST**: All operations (including queries) should be sent as HTTP `POST` requests with a `Content-Type: application/json` header, containing the query string and variable objects.
2. **Handle Errors with Partial Data**: GraphQL returns a HTTP `200 OK` status even if fields fail to resolve. Errors are returned inside an `errors` array in the JSON response, alongside a partial `data` object.
3. **Prevent Resolver N+1 Inefficiency**: Use batching utilities like **DataLoader** to collapse nested database queries into bulk reads, preventing execution query overload.
4. **Enforce Query Depth Limits**: Restrict maximum query nested depth and complexity analysis to protect the GraphQL engine against denial-of-service recursion attacks.
