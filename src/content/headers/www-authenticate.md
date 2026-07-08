---
name: "WWW-Authenticate"
description: "Defines the authentication method that should be used to gain access to the resource."
category: "response"
standard: true
relatedCodes: [401]
---

## What is the WWW-Authenticate header?

The `WWW-Authenticate` response header defines the authentication schema needed to access the requested resource. The server must return this header in a `401 Unauthorized` response.

## API Usage & Best Practices

* **Always send on 401**: Failure to return a WWW-Authenticate header on a 401 is a violation of HTTP specifications.
* **Specify realms or schemes**: E.g. `WWW-Authenticate: Bearer realm="api"` or `WWW-Authenticate: Basic realm="admin"`.

## Examples

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api"
```
