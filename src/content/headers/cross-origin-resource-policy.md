---
name: "Cross-Origin-Resource-Policy"
description: "Tells browsers which sites may load a response through no-cors requests such as img and script tags. Does not affect CORS fetches."
category: "response"
standard: true
reference:
  title: "WHATWG Fetch Standard"
  url: https://fetch.spec.whatwg.org/
updatedDate: 2026-10-17
---

## What is the Cross-Origin-Resource-Policy header?

The `Cross-Origin-Resource-Policy` (CORP) response header lets a server say which origins or sites may load the response when the browser fetches it in `no-cors` mode: through an `<img>`, `<script>`, `<link>`, `<video>` or similar tag, or a `fetch()` with `mode: "no-cors"`. It is defined in the WHATWG Fetch Standard and registered as a permanent field in the IANA HTTP Field Name Registry.

| Value | Who may load the response |
| :--- | :--- |
| `same-origin` | Only the same origin (scheme, host and port). |
| `same-site` | Only the same site: the same registrable domain, ignoring scheme and port, except that an `http` page may not load an `https` response under this rule. |
| `cross-origin` | Anyone. |

Fetch only applies the check when the response would be opaque, that is, to cross-origin `no-cors` requests. A cross-origin `fetch()` in `cors` mode is governed by [CORS](/guides/cors) and [`Access-Control-Allow-Origin`](/headers/access-control-allow-origin), and CORP does not block it. An unrecognized value, or more than one value, is ignored as if the header were absent.

CORP exists because a `no-cors` load pulls the response bytes into the requesting page's process, even though the page cannot read them directly. Side-channel attacks in the Spectre family can then read that memory. CORP lets the browser refuse to load the response at all.

## API Usage & Best Practices

* **Send `same-origin` on authenticated JSON.** An attacker page can point an `<img>` or `<script>` at your API, and the browser may attach the user's cookies, depending on their `SameSite` attribute. CORP `same-origin` makes the browser discard the response before it reaches the attacker's process. Your own front end is unaffected: if it calls the API through CORS, CORP does not apply to those calls.
* **It does not break your cross-origin SPA.** A browser app on `app.example.com` calling `api.example.com` with `fetch()` uses CORS mode, so `Cross-Origin-Resource-Policy: same-origin` on the API does not stop it. Get the CORS headers right and the two coexist.
* **Use `cross-origin` for resources meant to be embedded anywhere.** Public images, avatars, file downloads served from your API and anything other sites load with a tag should say `cross-origin`. Pages that opt into cross-origin isolation with `Cross-Origin-Embedder-Policy: require-corp` refuse cross-origin `no-cors` resources that lack an explicit CORP (or CORS) opt-in, so an explicit `cross-origin` is what keeps them loadable there.
* **Prefer `same-origin` to `same-site`.** `same-site` lets every subdomain under your registrable domain load the response, including user-content and marketing subdomains you may not fully control. Reach for it only when a sibling subdomain genuinely embeds the resource with a tag.
* **Machine clients ignore it.** SDKs, `curl` and server-side callers never apply CORP. It is browser defense in depth, not access control.

## Examples

Authenticated API data that should never be loaded by another site's tags:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cross-Origin-Resource-Policy: same-origin
```

A public image served from the API, meant to be embedded on any site, including cross-origin-isolated pages:

```http
HTTP/1.1 200 OK
Content-Type: image/png
Cross-Origin-Resource-Policy: cross-origin
Cache-Control: public, max-age=86400
```
