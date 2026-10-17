---
title: Unavailable For Legal Reasons
statusCode: 451
statusText: Unavailable For Legal Reasons
category: client-error
relatedCodes: ['forbidden', 'gone', 'resource-not-found']
publishedDate: 2026-10-17
updatedDate: 2026-10-17
---

## When to use it

Use [`451 Unavailable For Legal Reasons`](/status-codes/451) when you are denying access to a resource because of a legal demand: a court order, a takedown notice, a sanctions rule, or a regulator's instruction that this data may not be served to this caller or in this jurisdiction. RFC 7725 defines the code as a server "denying access to the resource as a consequence of a legal demand".

RFC 7725 says the response SHOULD explain the demand in the body: the party making it, the legislation or regulation it rests on, and which classes of person and resource it applies to. In a problem response that explanation goes in `detail`, with the structured parts as extension members so a client can show them without parsing prose.

The RFC also says the blocking entity SHOULD send a [`Link`](/headers/link) header with `rel="blocked-by"` identifying itself. That is you, or whoever operates the server that refused the request, not the court or government that ordered the block.

## When not to use it

Do not use it for restrictions that are your own policy rather than a legal demand. A feature you have not launched in a country, a licensing deal that does not cover a region, or a terms-of-service decision is `forbidden` (403). 451 makes a specific claim about why access is denied, and claiming a legal demand you never received misleads the people trying to understand the block.

Do not use it when you are not permitted to disclose that a demand exists. Some orders forbid that, and RFC 7725 acknowledges that clients cannot rely on receiving 451 for this reason. Use `resource-not-found` or `forbidden` instead, as your counsel directs.

Do not use it for content you have removed permanently for everyone. That is `gone` (410). 451 says the resource is withheld from this request, and RFC 7725 notes that it implies neither that the resource exists nor that it does not.

RFC 7725 makes a 451 response cacheable by default. If the block applies per jurisdiction or per caller, send `Cache-Control: private` or a short lifetime, so a shared cache does not serve one region's block to everyone.

## Example response

```http
HTTP/1.1 451 Unavailable For Legal Reasons
Content-Type: application/problem+json
Link: <https://example.com/legal/transparency>; rel="blocked-by"
Cache-Control: private, max-age=3600

{
  "type": "https://apiguide.dev/errors/unavailable-for-legal-reasons",
  "title": "Unavailable For Legal Reasons",
  "status": 451,
  "detail": "This listing cannot be served to requests from Germany because of a court order. See the transparency page for the order and its scope.",
  "instance": "/v1/listings/88231",
  "jurisdiction": "DE",
  "demandedBy": "Example District Court",
  "blockedBy": "https://example.com/legal/transparency"
}
```

Keep the block scoped to what the demand actually covers. If an order applies to one listing in one country, the rest of the catalog, and the same listing everywhere else, should keep working.
