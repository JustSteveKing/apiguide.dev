---
name: "Client-Cert"
description: "Lets a TLS-terminating reverse proxy pass the client's mTLS certificate to the origin, as a base64 DER byte sequence."
category: "request"
standard: true
relatedCodes: [400, 403, 431]
---

## What is the Client-Cert header?

The `Client-Cert` request header, defined in Section 2.2 of [RFC 9440](https://www.rfc-editor.org/rfc/rfc9440.html), carries the end-entity certificate a client presented in a [mutual TLS](/guides/mutual-tls) handshake, from the TLS-terminating reverse proxy that validated it to the backend origin server. RFC 9440 was published in July 2023 as an Informational RFC, not on the Standards Track; it documents a common deployment pattern and gives it one interoperable header in place of the many vendor-specific ones.

The value is a [Structured Field](/specifications/structured-fields) Byte Sequence: the certificate's DER encoding, base64 without line breaks, between colons. A PEM certificate converts by replacing the `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----` lines with `:` and removing the line breaks.

It is only for requests and MUST NOT be used in responses. It is a singleton: one certificate, one header line. The rest of the chain, if the proxy is configured to send it, goes in [`Client-Cert-Chain`](/headers/client-cert-chain).

## API Usage & Best Practices

* **Strip it at the edge, every time.** The proxy MUST remove or overwrite any `Client-Cert` the client sent, and MUST remove it entirely on connections where no client certificate was negotiated. RFC 9440 points out that forgetting this does not fail safe: everything still works, and any client can now claim any certificate.
* **Only trust it from your proxy.** The backend MUST accept it only from a trusted proxy, over a connection that is authenticated or on a network the client cannot reach. If clients can connect to the origin directly, the header is worthless. Firewall the origin first.
* **Let the proxy validate; let the app decide.** The proxy checks the certificate against its trust store during the handshake. The application reads `Client-Cert` to identify the caller and authorizes with [`403 Forbidden`](/status-codes/403) when the certificate is not acceptable for the request. Clients that expect a TLS alert for a rejected certificate will not get one this way.
* **Vary or do not cache.** A response selected by the certificate MUST be uncacheable, for example `Cache-Control: no-store`, or carry [`Vary`](/headers/vary)`: Client-Cert`. The client never sees `Client-Cert`, so a proxy that finds it in `Vary` SHOULD rewrite `Vary` to `*` before passing the response on, which stops the user agent caching it.
* **Raise header size limits.** Certificates are large. Origins may need a bigger maximum header size, and RFC 9440 mentions [`431 Request Header Fields Too Large`](/status-codes/431) as what an origin sends when it is exceeded.
* **Make it opt-in on both sides.** Producing and consuming the header SHOULD be configuration options that are off by default.
* **Prefer it to ad hoc headers.** Proxies have long used their own names for this, and some pass only the subject or a hash. Those are not interoperable, and a subject string is not the certificate. `Client-Cert` gives the backend the whole certificate in a defined encoding.
* **Clients never send it.** RFC 9440 says clients MUST NOT use it, and forward proxies MUST NOT add or modify it. A request arriving at your edge with `Client-Cert` already set MAY be rejected with [`400 Bad Request`](/status-codes/400).

## Examples

The request the proxy forwards to the origin, from RFC 9440 Appendix A (on one line here; the RFC folds it for display):

```http
GET /v1/accounts/acc_17 HTTP/1.1
Host: backend.internal.example
Client-Cert: :MIIBqDCCAU6gAwIBAgIBBzAKBggqhkjOPQQDAjA6MRswGQYDVQQKDBJMZXQncyBBdXRoZW50aWNhdGUxGzAZBgNVBAMMEkxBIEludGVybWVkaWF0ZSBDQTAeFw0yMDAxMTQyMjU1MzNaFw0yMTAxMjMyMjU1MzNaMA0xCzAJBgNVBAMMAkJDMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE8YnXXfaUgmnMtOXU/IncWalRhebrXmckC8vdgJ1p5Be5F/3YC8OthxM4+k1M6aEAEFcGzkJiNy6J84y7uzo9M6NyMHAwCQYDVR0TBAIwADAfBgNVHSMEGDAWgBRm3WjLa38lbEYCuiCPct0ZaSED2DAOBgNVHQ8BAf8EBAMCBsAwEwYDVR0lBAwwCgYIKwYBBQUHAwIwHQYDVR0RAQH/BBMwEYEPYmRjQGV4YW1wbGUuY29tMAoGCCqGSM49BAMCA0gAMEUCIBHda/r1vaL6G3VliL4/Di6YK0Q6bMjeSkC3dFCOOB8TAiEAx/kHSB4urmiZ0NX5r5XarmPk0wmuydBVoU4hBVZ1yhk=:
```

A response whose content depends on the certificate:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, max-age=60
Vary: Client-Cert
```
