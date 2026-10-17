---
name: "Trailer"
description: "Announces in the header section which fields the sender expects to send as trailers, after the body."
category: "both"
standard: true
---

## What is the Trailer header?

The `Trailer` header, defined in Section 6.6.2 of [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#name-trailer), lists the field names the sender expects to send in the trailer section of the message, after the content. It goes in the header section, so the recipient knows before reading the body what metadata is coming at the end.

```http
Trailer: Content-Digest
```

Trailers exist for values that can only be computed once the content has been generated: a checksum or digital signature over a streamed body, delivery metrics, or a final status. A sender that intends to send trailer fields SHOULD send `Trailer` naming them. It is a hint, not a guarantee: the sender may not follow through, and if an intermediary drops the trailers, `Trailer` at least shows what was lost.

A trailer section needs framing that allows one. In HTTP/1.1 that means the [`chunked`](/headers/transfer-encoding) transfer coding; HTTP/2 and HTTP/3 support trailers natively.

## API Usage & Best Practices

* **Only put a field in trailers if its definition allows it.** RFC 9110 says a sender MUST NOT generate a trailer field unless that field's definition permits it. Framing, routing, authentication, request modifiers, response controls and content format fields cannot work after the body. [`Content-Digest`](/headers/content-digest) and [`Repr-Digest`](/headers/repr-digest) are defined to allow trailers; most headers are not.
* **Do not rely on trailers arriving.** Intermediaries that translate between HTTP versions often discard them, and RFC 9110 says a server SHOULD NOT generate trailers it believes the user agent must receive. A streamed body whose integrity depends on a trailer needs a fallback, such as a digest the client can fetch separately.
* **Check that the client asked for them.** A client sends [`TE`](/headers/te)`: trailers` to say it will not discard trailers. Without it, assume they may be lost.
* **Keep trailers separate from headers.** Recipients ought to process and store trailer fields separately, and MUST NOT merge one into the header section unless its definition explicitly says how. Decisions already made from the headers cannot be unmade by a trailer.
* **Know what your platform exposes.** Server and client libraries differ in whether they let you write or read trailers at all, and browser APIs give page scripts limited or no access to them. Confirm support end to end before designing around trailers. [gRPC](/specifications/grpc) depends on them for its status.
* **List every trailer you might send.** A field that can appear more than once in trailers must be defined as a list-based field, and each name you might send should be in `Trailer` so the recipient can prepare, for example by hashing the body as it streams.

## Examples

A chunked HTTP/1.1 response announcing, then sending, a content digest after the body. The single chunk is the 26 bytes `id,status` and `ord_123,shipped`, each followed by a line feed, and the digest is SHA-256 over those bytes:

```http
HTTP/1.1 200 OK
Content-Type: text/csv
Transfer-Encoding: chunked
Trailer: Content-Digest

1a
id,status
ord_123,shipped

0
Content-Digest: sha-256=:CB8KACHeNNHl6yB5oS/C38qIQH5xKxdPNSumyup2rk0=:

```

The client's request that made trailers safe to send:

```http
GET /v1/exports/orders.csv HTTP/1.1
Host: api.example.com
TE: trailers
Connection: TE
```
