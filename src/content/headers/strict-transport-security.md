---
name: "Strict-Transport-Security"
description: "Tells browsers to contact this host only over HTTPS for a set period, refusing plaintext connections and certificate errors."
category: "response"
standard: true
---

## What is the Strict-Transport-Security header?

The `Strict-Transport-Security` response header, defined in RFC 6797 (HTTP Strict Transport Security, HSTS), declares that a host must only be contacted over HTTPS. A conforming user agent that receives it over a secure connection notes the host as a Known HSTS Host for `max-age` seconds; during that time it rewrites `http` URLs for the host to `https` before sending anything, and it treats any certificate error as fatal, with no click-through.

The directive `max-age` is required. `includeSubDomains` extends the policy to every subdomain. `max-age=0` tells the user agent to forget the policy. A user agent MUST ignore the header when it arrives over plain HTTP, and if a response carries more than one, it processes only the first.

## API Usage & Best Practices

* **Know who enforces it**: HSTS is enforced by the client, and in practice the clients that enforce it are browsers. It protects an API that browsers call directly, such as one used by a single-page app through `fetch`, because the browser will refuse to send a request, cookie or token to that host in cleartext. Server-to-server clients and most general-purpose HTTP libraries do not implement it; curl applies it only if you opt in with `--hsts`.
* **Send it anyway**: It costs one header on HTTPS responses and closes the downgrade window for every browser that does talk to your API. Send it from every HTTPS response on the hostname, not just the home page, since RFC 6797 makes it a SHOULD on every secure response.
* **Do not rely on it for machine clients**: For SDKs and integrations, enforce HTTPS yourself: ship `https` base URLs, do not fall back to `http`, and on API-only hostnames prefer refusing plaintext over redirecting it. A redirect arrives after the credential has already crossed the network in cleartext, and a `301` may legitimately turn a [`POST`](/methods/post) into a `GET`.
* **Roll out `includeSubDomains` carefully**: Setting it on your apex domain covers `api.example.com` too, which is good, but it also covers every internal or legacy subdomain still serving plain HTTP, which will break in browsers for the full `max-age`. Start with a short `max-age`, confirm nothing breaks, then raise it.
* **Treat preload as permanent**: `preload` is not part of RFC 6797. It signals consent to the browser preload list run at hstspreload.org, which requires `max-age` of at least `31536000`, `includeSubDomains` and `preload`, and warns that inclusion cannot easily be undone. Only submit a domain whose every subdomain will serve HTTPS for the long term.

## Examples

```http
HTTP/1.1 200 OK
Content-Type: application/json
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Clearing the policy before retiring HTTPS on a host:

```http
HTTP/1.1 200 OK
Strict-Transport-Security: max-age=0
```
