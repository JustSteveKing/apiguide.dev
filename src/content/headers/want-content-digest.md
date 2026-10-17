---
name: "Want-Content-Digest"
description: "Asks the other side to send a Content-Digest, and says which hash algorithms it would prefer, from 1 to 10."
category: "both"
standard: true
relatedCodes: [400]
---

## What is the Want-Content-Digest header?

The `Want-Content-Digest` field, defined in RFC 9530 Section 4, is an integrity preference field. It says that the sender would like to receive a [`Content-Digest`](/headers/content-digest), a hash of the message content as actually sent, and which hash algorithms it prefers. It can be sent on requests and responses.

In a request, it asks the server to put a `Content-Digest` on responses for that URI and representation. In a response, it asks the client to include `Content-Digest` on its future requests.

The value is a [Structured Field](/specifications/structured-fields) Dictionary. Each key is an algorithm from the IANA "Hash Algorithms for HTTP Digest Fields" registry, and each value is an Integer from 0 to 10: 1 is the least preferred, 10 the most preferred, and 0 means "not acceptable".

```http
Want-Content-Digest: sha-512=3, sha-256=10, unixsum=0
```

Its sibling [`Want-Repr-Digest`](/headers/want-repr-digest) asks for a [`Repr-Digest`](/headers/repr-digest) instead. Both replace the `Want-Digest` field of RFC 3230, which RFC 9530 obsoletes. See [Digest Fields](/specifications/digest-fields).

## API Usage & Best Practices

* **It is a hint, never a contract.** RFC 9530 says the receiver can ignore it, send a digest with any algorithm, or send none at all, and that ignoring it is not a protocol error. If your API requires a digest on writes, say so in your documentation and enforce it on the request, not by hoping a `Want-Content-Digest` gets honored.
* **Advertise on the response that rejects a missing digest.** When you refuse a request because it carried no usable `Content-Digest`, include `Want-Content-Digest` on that error so the client knows what to retry with. [Digest Unsupported Algorithms](/errors/digest-unsupported-algorithms) has a worked example.
* **Only list `sha-256` and `sha-512` with a non-zero weight.** They are the registry's "Active" algorithms. The rest are "Deprecated" and exist for migrating stored RFC 3230 checksums. Use 0 to say outright that a deprecated algorithm such as `unixsum` will not be accepted.
* **Prefer it to `Want-Repr-Digest` for request bodies.** On a write, what you usually want to verify is the bytes that arrived, which is what `Content-Digest` covers. Ask for a representation digest when you care about the full representation regardless of ranges or framing.
* **Do not emit `Want-Digest`.** Clients written against RFC 9530 will not look for it.
* **Equal weights are fine.** `sha-256=10, sha-512=10` says either is equally welcome, which is the simplest policy for a server that verifies both.

## Examples

A client asking for a content digest on a download, preferring SHA-256 and refusing the Unix `sum` checksum:

```http
GET /v1/exports/exp_9f2/download HTTP/1.1
Host: api.example.com
Want-Content-Digest: sha-512=3, sha-256=10, unixsum=0
```

A server rejecting a write that carried no digest, and saying what it wants on the retry:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json
Want-Content-Digest: sha-256=10, sha-512=10

{
  "type": "https://api.example.com/problems/digest-required",
  "title": "Content-Digest required",
  "status": 400,
  "detail": "Send a Content-Digest using sha-256 or sha-512."
}
```
