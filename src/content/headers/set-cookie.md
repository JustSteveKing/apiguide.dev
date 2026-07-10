---
name: "Set-Cookie"
description: "Instructs the client to store a cookie and return it on subsequent requests."
category: "response"
standard: true
---

## What is the Set-Cookie header?

The `Set-Cookie` response header, defined in RFC 6265, tells the client to store a cookie and send it back via the `Cookie` header on future requests. Each cookie carries a name/value pair plus optional attributes controlling its scope and lifetime.

## API Usage & Best Practices

* **Lock down access**: `HttpOnly` hides the cookie from JavaScript, and `Secure` restricts it to HTTPS connections, reducing theft and interception risks.
* **Defend against CSRF**: `SameSite` (`Strict`, `Lax`, or `None`) controls whether the cookie is sent on cross-site requests; `None` requires `Secure`.
* **Scope and expiry**: `Domain` and `Path` limit where the cookie is sent, while `Max-Age` (or `Expires`) sets how long it persists.

## Examples

```http
HTTP/1.1 200 OK
Set-Cookie: session_id=abc123; Path=/; Domain=example.com; Max-Age=3600; HttpOnly; Secure; SameSite=Lax
```
