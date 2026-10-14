---
name: "Proxy-Authorization"
description: "Carries the credentials a client presents to a forward proxy that demanded authentication with a 407 response."
category: "request"
standard: true
relatedCodes: [407]
---

## What is the Proxy-Authorization header?

The `Proxy-Authorization` request header, defined in RFC 9110 Section 11.7.2, carries a client's credentials for a proxy, in the same `scheme credentials` format as [`Authorization`](/headers/authorization). A client sends it after a proxy answers with [`407 Proxy Authentication Required`](/status-codes/407) and a [`Proxy-Authenticate`](/headers/proxy-authenticate) challenge, or up front if it already knows the proxy requires it.

Unlike `Authorization`, it applies only to the next inbound proxy that demanded authentication. In a chain of proxies, the first one expecting credentials consumes it; a proxy MAY relay it onward only if that is how the proxies cooperatively authenticate.

## API Usage & Best Practices

* **Do not use it for API authentication**: Your API, and the gateway in front of it, read credentials from `Authorization`. A client that puts its API token in `Proxy-Authorization` will see it consumed by the first proxy that wants credentials, or forwarded to one that does not, and either way it is the wrong place.
* **Send it on the CONNECT for HTTPS**: When an `https` request goes through a forward proxy, the client authenticates on the [`CONNECT`](/methods/connect) request that opens the tunnel. The proxy credentials stay between the client and the proxy and never reach your API.
* **Strip it at your edge**: If one turns up at your origin, an upstream proxy did not consume it. Do not log it, because it contains a credential, and do not forward it to back-end services.
* **Keep proxy credentials out of URLs**: HTTP client libraries often accept `http://user:pass@proxy:3128` style proxy settings. Load them from secret storage or the environment rather than hard-coding them where they end up in logs and stack traces.

## Examples

```http
CONNECT api.example.com:443 HTTP/1.1
Host: api.example.com:443
Proxy-Authorization: Basic aGVsbG86d29ybGQ=
```
