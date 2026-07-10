---
name: "Prefer"
description: "Lets the client request optional, non-critical handling behaviors from the server."
category: "request"
standard: true
relatedCodes: [200, 202]
---

## What is the Prefer header?

The `Prefer` request header, defined in RFC 7240, lets a client indicate preferences for how a request is processed. Preferences are optional hints: the server may honor or ignore them without changing the outcome's validity.

## API Usage & Best Practices

* **Control the response body**: `return=minimal` asks the server to return little or no body, while `return=representation` asks for the full resource state.
* **Request asynchronous processing**: `respond-async` asks the server to process the request asynchronously, often answered with `202 Accepted`; `wait=` bounds how long the client will wait.
* **Confirm what was applied**: When the server acts on a preference, it echoes it back in the `Preference-Applied` response header.

## Examples

```http
POST /v1/orders HTTP/1.1
Host: api.example.com
Prefer: return=minimal, respond-async, wait=10
```
