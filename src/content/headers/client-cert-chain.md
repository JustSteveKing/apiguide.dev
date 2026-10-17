---
name: "Client-Cert-Chain"
description: "Carries the intermediate certificates behind a client's mTLS certificate from a TLS-terminating proxy to the origin, as a list of byte sequences."
category: "request"
standard: true
relatedCodes: [400, 431]
---

## What is the Client-Cert-Chain header?

The `Client-Cert-Chain` request header, defined in Section 2.3 of [RFC 9440](https://www.rfc-editor.org/rfc/rfc9440.html) (Informational, July 2023), lets a TLS-terminating reverse proxy pass the certificate chain a client used in a [mutual TLS](/guides/mutual-tls) handshake to the backend origin. It accompanies [`Client-Cert`](/headers/client-cert), which carries the end-entity certificate.

The value is a [Structured Field](/specifications/structured-fields) List of Byte Sequences, each one a base64 DER-encoded X.509 certificate between colons, in the same order as in the TLS handshake. It does not repeat the end-entity certificate already in `Client-Cert`, and it MUST NOT appear unless `Client-Cert` is also present. The root certificate MAY be left out when the origin is known to have that trust anchor.

Sending it is optional for the proxy, and it is only for requests. Unlike `Client-Cert`, it can be split across several header lines, which can help header compression.

## API Usage & Best Practices

* **Send it only if the origin needs it.** Most backends only need the client certificate to identify the caller, because the proxy has already validated the chain. Forward the chain when the application has to inspect an intermediate, for example to tell which issuing CA or tenant a certificate belongs to.
* **Leave out the root.** The origin already trusts it, and every certificate adds a large value to every request.
* **Sanitize it exactly like `Client-Cert`.** The proxy MUST remove or overwrite any copy the client sent, and remove it on connections without a client certificate. The backend MUST only accept it from a trusted proxy. An incoming request that already has it MAY be rejected with [`400 Bad Request`](/status-codes/400).
* **Budget for size.** A chain can be several kilobytes. Raise the origin's header limits, or expect [`431 Request Header Fields Too Large`](/status-codes/431). Over HTTP/2 or HTTP/3 to the origin, varying certificate values from many clients can also hurt HPACK or QPACK compression; RFC 9440 suggests a larger dynamic table or sending the value as a literal.
* **Keep session resumption consistent.** Some TLS stacks do not keep client certificate information across resumption. RFC 9440 says to disable resumption for client-certificate connections, or omit the fields from the start, rather than send them inconsistently.
* **Do not re-validate the chain at the origin as if it came from the client.** It came from your proxy, which already validated it. Re-validating against a different trust store only creates disagreements between the two.

## Examples

The proxy forwarding both the client certificate and its chain (here the intermediate and, as in RFC 9440 Appendix A, the root; many deployments omit the root). The two chain certificates are sent as separate field lines, which is equivalent to one comma-separated list:

```http
GET /v1/accounts/acc_17 HTTP/1.1
Host: backend.internal.example
Client-Cert: :MIIBqDCCAU6gAwIBAgIBBzAKBggqhkjOPQQDAjA6MRswGQYDVQQKDBJMZXQncyBBdXRoZW50aWNhdGUxGzAZBgNVBAMMEkxBIEludGVybWVkaWF0ZSBDQTAeFw0yMDAxMTQyMjU1MzNaFw0yMTAxMjMyMjU1MzNaMA0xCzAJBgNVBAMMAkJDMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE8YnXXfaUgmnMtOXU/IncWalRhebrXmckC8vdgJ1p5Be5F/3YC8OthxM4+k1M6aEAEFcGzkJiNy6J84y7uzo9M6NyMHAwCQYDVR0TBAIwADAfBgNVHSMEGDAWgBRm3WjLa38lbEYCuiCPct0ZaSED2DAOBgNVHQ8BAf8EBAMCBsAwEwYDVR0lBAwwCgYIKwYBBQUHAwIwHQYDVR0RAQH/BBMwEYEPYmRjQGV4YW1wbGUuY29tMAoGCCqGSM49BAMCA0gAMEUCIBHda/r1vaL6G3VliL4/Di6YK0Q6bMjeSkC3dFCOOB8TAiEAx/kHSB4urmiZ0NX5r5XarmPk0wmuydBVoU4hBVZ1yhk=:
Client-Cert-Chain: :MIIB5jCCAYugAwIBAgIBFjAKBggqhkjOPQQDAjBWMQswCQYDVQQGEwJVUzEbMBkGA1UECgwSTGV0J3MgQXV0aGVudGljYXRlMSowKAYDVQQDDCFMZXQncyBBdXRoZW50aWNhdGUgUm9vdCBBdXRob3JpdHkwHhcNMjAwMTE0MjEzMjMwWhcNMzAwMTExMjEzMjMwWjA6MRswGQYDVQQKDBJMZXQncyBBdXRoZW50aWNhdGUxGzAZBgNVBAMMEkxBIEludGVybWVkaWF0ZSBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABJf+aA54RC5pyLAR5yfXVYmNpgd+CGUTDp2KOGhc0gK91zxhHesEYkdXkpS2UN8Kati+yHtWCV3kkhCngGyv7RqjZjBkMB0GA1UdDgQWBBRm3WjLa38lbEYCuiCPct0ZaSED2DAfBgNVHSMEGDAWgBTEA2Q6eecKu9g9yb5glbkhhVINGDASBgNVHRMBAf8ECDAGAQH/AgEAMA4GA1UdDwEB/wQEAwIBhjAKBggqhkjOPQQDAgNJADBGAiEA5pLvaFwRRkxomIAtDIwg9D7gC1xzxBl4r28EzmSO1pcCIQCJUShpSXO9HDIQMUgH69fNDEMHXD3RRX5gP7kuu2KGMg==:
Client-Cert-Chain: :MIICBjCCAaygAwIBAgIJAKS0yiqKtlhoMAoGCCqGSM49BAMCMFYxCzAJBgNVBAYTAlVTMRswGQYDVQQKDBJMZXQncyBBdXRoZW50aWNhdGUxKjAoBgNVBAMMIUxldCdzIEF1dGhlbnRpY2F0ZSBSb290IEF1dGhvcml0eTAeFw0yMDAxMTQyMTI1NDVaFw00MDAxMDkyMTI1NDVaMFYxCzAJBgNVBAYTAlVTMRswGQYDVQQKDBJMZXQncyBBdXRoZW50aWNhdGUxKjAoBgNVBAMMIUxldCdzIEF1dGhlbnRpY2F0ZSBSb290IEF1dGhvcml0eTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABFoaHU+Z5bPKmGzlYXtCf+E6HYj62fORaHDOrt+yyh3H/rTcs7ynFfGn+gyFsrSP3Ez88rajv+U2NfD0o0uZ4PmjYzBhMB0GA1UdDgQWBBTEA2Q6eecKu9g9yb5glbkhhVINGDAfBgNVHSMEGDAWgBTEA2Q6eecKu9g9yb5glbkhhVINGDAPBgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIBhjAKBggqhkjOPQQDAgNIADBFAiEAmAeg1ycKHriqHnaD4M/UDBpQRpkmdcRFYGMg1Qyrkx4CIB4ivz3wQcQkGhcsUZ1SOImd/lq1Q0FLf09rGfLQPWDc:
```
