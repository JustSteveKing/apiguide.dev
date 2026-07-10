---
name: "curl"
description: "The ubiquitous command-line tool and library for transferring data with URLs using HTTP, HTTPS, and dozens of protocols."
category: "clients-debugging"
lifecycleStages: ["development", "testing"]
url: "https://curl.se"
pricing: "open-source"
---

## What is curl?

curl is a command-line tool and library designed for transferring data using various network protocols with URLs. It is used in scripts for data transfer and is also available as libcurl, which serves as the Internet transfer engine for numerous software applications across many devices. The tool is integrated into over twenty billion installations globally.

## Why use it in the API Lifecycle?

* **Protocol Support**: Supports a wide array of protocols for data transfer, including HTTP, HTTPS, FTP, FTPS, SFTP, SMTP, IMAP, and LDAP.
* **HTTP Capabilities**: Provides comprehensive HTTP functionality, including support for HTTP/0.9 through HTTP/3, cookies, custom headers, and following redirects.
* **Authentication Mechanisms**: Offers various authentication methods such as Basic, Digest, CRAM-MD5, SCRAM-SHA, NTLM, Negotiate, Kerberos, Bearer tokens, and AWS Sigv4.
* **TLS/SSL Features**: Includes support for TLS versions 1.0-1.3, mutual authentication, STARTTLS, OCSP stapling, and key pinning.
* **Name Resolution**: Enables advanced name resolution features including DNS-over-HTTPS, custom address configuration for hosts, and DNS caching.
* **Transfer Control**: Allows for detailed control over transfers, including rate limiting, stall detection, retries, and configurable timeouts.

## Best Practices

* Use the `-i` flag to include response headers in the output, which is crucial when debugging CORS, caching, or rate limits.
