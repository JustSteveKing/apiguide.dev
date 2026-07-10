---
name: "CONNECT"
description: "Establishes a tunnel to the server identified by the target resource, typically through a proxy."
safe: false
idempotent: false
cacheable: false
relatedCodes: [200, 405, 407]
---

## What is the CONNECT method?

The `CONNECT` method is used by clients to ask a proxy to establish a TCP tunnel to a destination server, most commonly to relay end-to-end encrypted HTTPS traffic through the proxy.

## API Usage & Best Practices

* **Proxy tunnelling**: CONNECT targets a proxy so it can open a raw connection to an origin server, after which bytes flow through untouched.
* **Secure by design**: The proxy cannot read the tunnelled payload, which is why CONNECT underpins HTTPS-over-proxy setups.
* **Authenticate first**: Proxies frequently require credentials, returning 407 until valid proxy authentication is supplied.

## Common Response Codes

* **200 OK**: The tunnel was established and the connection is now transparent.
* **407 Proxy Authentication Required**: The proxy needs credentials before opening the tunnel.
* **405 Method Not Allowed**: The server or proxy does not permit CONNECT.
