---
name: "Location"
description: "Indicates the URL to redirect the client to, or the URL of a newly created resource."
category: "response"
standard: true
relatedCodes: [201, 301, 302, 303, 307, 308]
---

## What is the Location header?

The `Location` response header serves two main functions: redirecting the client to a new URL, or pointing to the URI of a newly created resource.

## API Usage & Best Practices

* **Use on 201 Created**: When a resource is successfully created via POST, always include the Location header pointing to the GET path of the new resource.
* **Ensure absolute URLs**: While relative paths are supported in modern specs, using absolute URLs is safer for diverse API clients.

## Examples

```http
HTTP/1.1 201 Created
Location: https://api.apiguide.dev/v1/leads/lead_123
```
