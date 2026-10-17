---
name: "Proxy-Authentication-Info"
description: "The proxy counterpart of Authentication-Info: scheme-specific data a proxy returns after accepting Proxy-Authorization credentials."
category: "response"
standard: true
relatedCodes: [407]
---

## What is the Proxy-Authentication-Info header?

The `Proxy-Authentication-Info` response header, defined in Section 11.7.3 of [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-proxy-authentication-info), is the proxy version of [`Authentication-Info`](/headers/authentication-info). After a proxy has accepted the credentials a client sent in [`Proxy-Authorization`](/headers/proxy-authorization), it can use this header to send scheme-specific information back, such as the next nonce or a value proving the proxy's own identity.

The value is a comma-separated list of `name=value` authentication parameters. RFC 9110 defines only that generic format; the authentication scheme named in the request's `Proxy-Authorization` defines which parameters exist and what they mean.

The difference from `Authentication-Info` is scope. `Proxy-Authentication-Info` applies only to the next outbound client on the response chain, because only the client that chose a given proxy is likely to hold the credentials for it. In a hierarchy of proxies inside one organization, where the user agent's credentials are passed along until one proxy consumes them, the same value may appear at several hops, which can look as if it was forwarded.

It can be sent as a trailer field when the authentication scheme explicitly allows that.

## API Usage & Best Practices

* **You will almost never see it in API work.** It matters only when a client authenticates to a forward proxy with a scheme that defines response parameters. HTTP Digest (RFC 7616) is the common case, and it defines the same parameters for this header as for `Authentication-Info`: `nextnonce`, `qop`, `rspauth`, `cnonce` and `nc`. `Basic` and `Bearer` define none.
* **Do not confuse proxy and origin authentication.** A proxy challenges with [`407 Proxy Authentication Required`](/status-codes/407) and [`Proxy-Authenticate`](/headers/proxy-authenticate), the client answers with `Proxy-Authorization`, and the proxy may reply with `Proxy-Authentication-Info`. The origin's equivalents are `401`, [`WWW-Authenticate`](/headers/www-authenticate), [`Authorization`](/headers/authorization) and `Authentication-Info`. An API gateway in front of your service is an origin from the client's point of view, so it uses the origin set, not this one.
* **Do not use it to carry tokens or session data.** As with `Authentication-Info`, only the parameters the scheme defines belong here. Anything else is invisible to standard clients and ends up in logs.
* **Some schemes forbid proxy use entirely.** OAuth's `DPoP` scheme, for example, MUST NOT be used with the proxy authentication headers (RFC 9449), so there is no DPoP `Proxy-Authentication-Info`.

## Examples

A forward proxy using Digest authentication rotating the nonce after accepting the client's credentials (illustrative values):

```http
HTTP/1.1 200 OK
Content-Type: application/json
Proxy-Authentication-Info: nextnonce="5ccc069c403ebaf9f0171e9517f40e41", qop=auth, rspauth="6629fae49393a05397450978507c4ef1", cnonce="0a4f113b", nc=00000001
```

The challenge that started the exchange:

```http
HTTP/1.1 407 Proxy Authentication Required
Proxy-Authenticate: Digest realm="corp-proxy@example.com", qop="auth", algorithm=SHA-256, nonce="7ypf/xlj9XXwfDPEoM4URrv/xwf94BcCAzFZH4GiTo0v", opaque="FQhe/qaU925kfnzjCev0ciny7QMkPqMAFRtzCUYo5tdS"
```
