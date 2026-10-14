---
name: "Accept-Post"
description: "Advertises which media types a resource accepts in POST requests, modeled on Accept-Patch and defined by the W3C Linked Data Platform."
category: "response"
standard: true
relatedCodes: [201, 415]
---

## What is the Accept-Post header?

The `Accept-Post` response header lists the media types a resource will accept as the body of a [`POST`](/methods/post) request. It was defined in Section 7.1 of the W3C Recommendation [Linked Data Platform 1.0](https://www.w3.org/TR/ldp/) (LDP, February 2015), is registered as a permanent field in the IANA HTTP Field Name Registry with that specification as its reference, and is deliberately modeled on [`Accept-Patch`](/headers/accept-patch).

Its value is a comma-separated list of media ranges, with the same syntax as [`Accept`](/headers/accept) minus the `q` weights, which have no meaning here:

```http
Accept-Post: application/json, multipart/form-data
```

LDP gives it the same two meanings `Accept-Patch` has: the header's presence on a response to any method implies that `POST` is allowed on the resource, and each listed type is one the resource accepts. Although it was written for LDP containers, nothing in its definition is specific to RDF, and LDP itself notes it applies beyond LDP.

## API Usage & Best Practices

* **Send it where `POST` creates things.** A collection endpoint that accepts new members is the natural place. Include it on [`OPTIONS`](/methods/options) responses, which LDP says it SHOULD appear on for any resource supporting `POST`, and optionally on `GET` and `HEAD` so a client discovers it without an extra round trip.
* **Send it on `415` responses.** When a client posts a body in a format you do not accept, answer [`415 Unsupported Media Type`](/status-codes/415) and list what you do accept. RFC 9110 suggests [`Accept`](/headers/accept) in a `415` response for this purpose; `Accept-Post` is the more precise of the two because it is scoped to `POST`, and sending both does no harm.
* **List what you validate, not what you parse.** If the endpoint accepts `application/json` only when it matches one schema, the header cannot say so. Keep it truthful at the media type level and document the schema in your [OpenAPI](/specifications/openapi) description.
* **Use media ranges sparingly.** `image/*` is legitimate for an upload endpoint that really accepts any image format. `*/*` tells the client nothing and should not be sent.
* **Do not make it the contract.** Treat it as a hint for discovery and error recovery. A client cannot learn your schemas, size limits or required fields from it, so the contract stays in your API description.

## Examples

A collection advertising the formats it accepts for new members:

```http
OPTIONS /v1/documents HTTP/1.1
Host: api.example.com
```

```http
HTTP/1.1 204 No Content
Allow: GET, POST, OPTIONS, HEAD
Accept-Post: application/json, multipart/form-data
```

An upload endpoint rejecting a format it does not take:

```http
HTTP/1.1 415 Unsupported Media Type
Content-Type: application/problem+json
Accept-Post: image/png, image/jpeg, image/webp

{
  "type": "https://apiguide.dev/errors/unsupported-media-type",
  "title": "Unsupported Media Type",
  "status": 415,
  "detail": "Avatars must be PNG, JPEG or WebP."
}
```
