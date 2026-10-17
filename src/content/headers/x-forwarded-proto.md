---
name: "X-Forwarded-Proto"
description: "De facto request header in which a proxy records whether the client connected over http or https. The standard form is Forwarded proto."
category: "request"
standard: false
relatedCodes: [301, 308]
---

## What is the X-Forwarded-Proto header?

`X-Forwarded-Proto` (XFP) is set by a reverse proxy or load balancer to record the scheme the client used to reach it, `http` or `https`. A proxy that terminates TLS forwards the request to your application over plain HTTP, so without this header the application cannot tell an HTTPS request from an HTTP one.

```http
X-Forwarded-Proto: https
```

It has never been standardized and is not in the IANA HTTP Field Name Registry. [RFC 7239](https://www.rfc-editor.org/rfc/rfc7239.html) defines the `proto` parameter of [`Forwarded`](/headers/forwarded) as its replacement, but `X-Forwarded-Proto` is what most load balancers, CDNs and frameworks send and read by default, alongside [`X-Forwarded-For`](/headers/x-forwarded-for) and [`X-Forwarded-Host`](/headers/x-forwarded-host). Older, rarer equivalents include `X-Forwarded-Protocol`, `X-Forwarded-Ssl: on`, `X-Url-Scheme` and Microsoft's `Front-End-Https: on`.

## API Usage & Best Practices

* **Use it to build absolute URLs.** [`Location`](/headers/location) on a `201`, pagination links, `self` links and webhook callback URLs all need the external scheme. An application that reads only its own socket generates `http://` links behind a TLS-terminating proxy, and clients following them either fail or get redirected.
* **Trust it only from your own proxy.** A client can send `X-Forwarded-Proto: https` over plain HTTP. If the origin is reachable without going through the proxy, or the proxy appends rather than overwrites, the client controls the value. Configure the edge to overwrite it on every request, and configure your framework to trust it only from your proxy's addresses.
* **Never base a security decision on an untrusted value.** Frameworks that decide whether to mark cookies `Secure`, enforce HTTPS or emit [`Strict-Transport-Security`](/headers/strict-transport-security) from this header can be fooled by a spoofed one. Get the trust configuration right before relying on any of them.
* **Avoid redirect loops.** The classic failure is an application that enforces HTTPS by checking its own socket, sees plain HTTP from the proxy, and redirects to `https://`, which arrives as plain HTTP again. Read the trusted `X-Forwarded-Proto` instead, or enforce HTTPS at the edge and not in the application at all.
* **Expect multiple values through a proxy chain.** A proxy configured to append rather than overwrite can produce a list such as `https, http`, for example when a CDN talks TLS to the client and plain HTTP to a load balancer. The value that describes the client is the one your outermost trusted proxy set, which is not necessarily the first or the last. Configure each hop to overwrite rather than append where you can.
* **Pick one header and own it.** If your stack reads both `Forwarded` and `X-Forwarded-Proto`, strip both at the edge and set only the one you read, or a client can supply whichever one your code does not overwrite.

## Examples

A request that reached the load balancer over HTTPS and was forwarded to the application over plain HTTP:

```http
GET /v1/orders?page=2 HTTP/1.1
Host: api.example.com
X-Forwarded-For: 192.0.2.44
X-Forwarded-Proto: https
```

The application uses it to build an absolute link with the right scheme:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Link: <https://api.example.com/v1/orders?page=3>; rel="next"
```

The standardized equivalent:

```http
GET /v1/orders?page=2 HTTP/1.1
Host: api.example.com
Forwarded: for=192.0.2.44;proto=https
```
