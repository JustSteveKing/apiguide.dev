---
title: "Arazzo Specification"
description: "A comprehensive, multi-section breakdown of the Arazzo specification, explaining workflows orchestration, input-output expressions, and state assertions."
currentVersion: "1.0.1"
officialUrl: "https://spec.openapis.org/arazzo/v1.0.1.html"
---

## Introduction to Arazzo

The Arazzo Specification describes workflows and state transitions across multiple API operations. While the OpenAPI Specification (OAS) defines individual endpoints, it lacks the context of how those endpoints are executed sequentially to achieve business tasks. 

Arazzo connects these dots by acting as a client workflow orchestrator.

### The Workflow Orchestration Flow

An Arazzo workflow follows a clear sequential flow of execution:
1. **Inputs Initialization**: The client starts the workflow by supplying required context parameters (such as credentials, workspace domains, or entity names).
2. **Step 1 (User Creation)**: The client executes the first step (e.g., calling the user creation endpoint) and extracts the new User ID from the response.
3. **Step 2 (License Assignment)**: The client initiates the next step, feeding the extracted User ID into the request body to assign a product license, then extracts the generated workspace token from the response headers.
4. **Step 3 (Workspace Access)**: The client uses the workspace token in the Authorization header to call the workspace access endpoint.
5. **Outputs Resolution**: The workflow concludes, returning resolved final variables (like access URLs or organization details) to the client application.

---

## 1. Mapping Operations to Steps

Each workflow contains a series of **steps**. A step invokes an endpoint defined in the linked OpenAPI specification (`sourceDescription`).

For each step, Arazzo maps:
* **`parameters`**: HTTP headers, query variables, or cookies required by the endpoint.
* **`requestBody`**: Payloads sent in the request.
* **`outputs`**: Variable mappings extracted from the HTTP response headers or body for reuse in subsequent steps.

```yaml
steps:
  - stepId: generateToken
    operationId: authUser
    requestBody:
      payload:
        client_id: $inputs.clientId
        client_secret: $inputs.clientSecret
    outputs:
      accessToken: $response.body.token
```

---

## 2. Dynamic Expressions Resolver

Arazzo uses a structured runtime expression syntax to dynamically resolve values at execution time.

| Expression Namespace | Source Description | Example |
| :--- | :--- | :--- |
| **`$inputs.*`** | Input parameters declared at workflow start | `$inputs.username` |
| **`$response.body.*`** | JSON body fields returned in the current step | `$response.body.id` |
| **`$response.header.*`** | HTTP response headers returned in the current step | `$response.header.Location` |
| **`$steps.<stepId>.outputs.*`**| Saved outputs from a previously executed step | `$steps.generateToken.outputs.accessToken` |

---

## 3. State Assertions (`successCriteria`)

To ensure that a workflow is progressing successfully, steps can define assertions. If the response does not satisfy the criteria, the workflow aborts.

* **`successCriteria`**: An array of logical checks. Every check must evaluate to true.

```yaml
steps:
  - stepId: checkInventory
    operationId: getInventory
    successCriteria:
      - condition: $response.status == 200
      - condition: $response.body.quantity > 0
```

