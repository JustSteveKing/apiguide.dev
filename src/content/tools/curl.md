---
name: "curl"
description: "The ubiquitous command-line tool and library for transferring data with URLs using HTTP, HTTPS, and dozens of protocols."
category: "clients-debugging"
lifecycleStages: ["development", "testing"]
url: "https://curl.se"
pricing: "open-source"
---

## What is curl?

curl is a command-line tool and library for transferring data with URLs. It is used in command lines or scripts for data transfer and also as libcurl, an Internet transfer engine integrated into numerous devices and software applications.

## Why use it in the API Lifecycle?

* **Protocol Support**: Supports a wide range of protocols including DICT, FILE, FTP, FTPS, GOPHER, GOPHERS, HTTP, HTTPS, IMAP, IMAPS, LDAP, LDAPS, MQTT, MQTTS, POP3, POP3S, RTSP, SCP, SFTP, SMB, SMBS, SMTP, SMTPS, TELNET, TFTP, WS, WSS.
* **Proxy Capabilities**: Functions with various proxy types such as SOCKS4, SOCKS5, HTTP, HTTPS (HTTP/1 and HTTP/2), tunneling, via Unix domain sockets, HAProxy, and SOCKS+HTTP proxy chains.
* **HTTP Feature Set**: Provides extensive HTTP functionality including GET, POST, PUT, HEAD, multipart formpost, support for HTTP/0.9 to HTTP/3, HSTS, Alt-Svc, cookies, ETags, transfer compression, ranges, custom headers, custom methods, and redirect following.
* **Authentication Mechanisms**: Offers support for authentication methods including Basic, Plain, Digest, CRAM-MD5, SCRAM-SHA, NTLM, Negotiate, Kerberos, Bearer tokens, AWS Sigv4, SASL, and .netrc.
* **TLS and Security Features**: Supports TLS versions 1.0-1.3, mutual authentication, STARTTLS, OCSP stapling, ECH, False Start, key pinning, PQC readiness, session resumption, early data, and export/import of sessions.
* **Connection Management**: Includes features such as connection reuse, interface binding, Happy Eyeballs, IPv4/IPv6-only modes, Unix domain sockets, TCP keepalive, TCP Fast Open, TCP Nodelay, MPTCP, VLAN priority, and IP Type Of Service.

## Best Practices

* Utilize the 'Everything curl' e-book for comprehensive understanding of curl and libcurl functionalities.
* Refer to the official documentation and man page for detailed usage instructions and parameters.
* Engage with the curl-users or curl-library mailing lists for community support and discussions.
* Report bugs and security issues through the designated channels to contribute to project improvement.
