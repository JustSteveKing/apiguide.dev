---
name: "Server"
description: "Names the software the origin server used to handle the request. Optional, and best kept short or left out of API responses."
category: "response"
standard: true
---

## What is the Server header?

The `Server` response header, defined in Section 10.2.4 of [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-server), describes the software the origin server used to handle the request. It is the response-side counterpart of [`User-Agent`](/headers/user-agent), and has the same syntax: one or more product identifiers, each a name and optional version, optionally followed by comments, in decreasing order of significance.

```http
Server: CERN/3.0 libwww/2.17
```

It is optional. An origin server MAY send it. RFC 9110 says it SHOULD NOT contain needlessly fine-grained detail, and that third parties SHOULD NOT be allowed to keep appending subproducts, because long, detailed values add latency and reveal implementation details that make it slightly easier for attackers to find known holes.

The field describes the origin server. Proxies and gateways identify themselves in [`Via`](/headers/via) instead.

## API Usage & Best Practices

* **Send a product name with no version, or nothing.** `Server: nginx` costs nothing; `Server: nginx/1.25.3 (Ubuntu) OpenSSL/3.0.2` tells an attacker which advisories to try. Most web servers and frameworks have a setting to trim or remove it, and many security baselines ask you to.
* **Hiding it is not security.** Removing the version from `Server` does not patch anything, and fingerprinting does not depend on it. Do it because it is free, then keep patching.
* **Do not put build or deploy details in it.** Commit hashes, hostnames, pod names and internal service names belong in your logs and traces, not in a header every client can read. If you need a response to be traceable, return a request ID instead.
* **Keep client workarounds narrow.** RFC 9110 acknowledges that user agents scan `Server` to work around known bugs, and allows it when the workaround is limited to the implementation at fault. Match an exact product and version, and remove the workaround when that version is gone. Do not use it to switch general behavior; that is what API versioning is for.
* **Expect CDNs to set their own.** A CDN or managed gateway in front of your API often replaces `Server` with its own product name. That is useful when debugging which layer answered, so do not fight it.

## Examples

A minimal value that names the product without a version:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Server: nginx
```

What to avoid: an origin advertising exact versions of every component:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Server: Apache/2.4.41 (Ubuntu) OpenSSL/1.1.1f PHP/7.4.3
```
