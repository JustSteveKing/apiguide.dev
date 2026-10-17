---
title: "JSON Lines and NDJSON"
description: "A reference for newline-delimited JSON: the JSON Lines and NDJSON conventions, their rules for encoding and line endings, the unregistered media type situation, and RFC 7464 JSON Text Sequences as the IETF alternative."
currentVersion: "JSON Lines / NDJSON 1.0.0"
officialUrl: "https://jsonlines.org/"
---

## What are JSON Lines and NDJSON?

A JSON array is a poor container for a large or open-ended collection. The parser cannot hand you the first element until it has seen the closing bracket, a truncated file is invalid as a whole, and appending a record means rewriting the end of the document. Exports, logs, bulk imports and streamed results all hit this.

Newline-delimited JSON fixes it by dropping the outer array: one JSON value per line, each line independently parseable. A reader processes records as they arrive, a writer appends without touching what is already there, and a damaged line costs one record rather than the whole file.

Two community specifications describe the same idea:

| | JSON Lines | NDJSON |
| :--- | :--- | :--- |
| Home | jsonlines.org | github.com/ndjson/ndjson-spec |
| Version | Unversioned | 1.0.0 |
| File extension | `.jsonl` | `.ndjson` |
| Suggested media type | `application/jsonl` ("not yet standardized") | `application/x-ndjson` |

On the wire they are compatible. A file that follows the stricter of the two rules below is valid under both. Neither is an IETF or IANA standard.

---

## 1. The rules

| Rule | JSON Lines | NDJSON |
| :--- | :--- | :--- |
| Encoding | UTF-8, no byte order mark | UTF-8 |
| Each line | One valid JSON value; any value is permitted | One JSON text per RFC 8259 |
| Separator | `\n` | `\n` |
| `\r\n` | Works, since whitespace around a JSON value is ignored | Writers MAY emit it; parsers MUST accept it |
| Newlines inside a value | Not possible: a value must fit on its line | MUST NOT appear |
| Blank lines | Not valid | Parsers MAY skip them, and must document it |
| Final newline | Strongly recommended, not required | Every text is terminated by `\n` |

The rule that bites in practice is the newline one: your JSON encoder must not pretty-print. Literal newlines inside strings are already escaped as `\n` by any conforming encoder, so the only way to break the format is to emit indentation.

```text
{"id":"ord_1","status":"paid","total":"42.00"}
{"id":"ord_2","status":"refunded","total":"9.50"}
{"id":"ord_3","status":"paid","total":"120.00"}
```

Use objects on every line, even though both specifications permit any JSON value. A top-level number cannot be told apart from a truncated one (`1234` cut to `123` is still a valid number), and objects leave room to add fields later.

---

## 2. The media type problem

None of these is in the IANA media types registry: not `application/jsonl`, not `application/ndjson`, and not `application/x-ndjson`. The `x-` prefix in particular marks a type that was never registered. In practice:

* `application/x-ndjson` is the most widely used in HTTP APIs, including by Elasticsearch's bulk API, which accepts it alongside `application/json`.
* `application/jsonl` is what jsonlines.org suggests, while saying itself that it is not standardized.

Pick one, document it, and accept both on input. For responses, send `application/x-ndjson` in [`Content-Type`](/headers/content-type) unless your ecosystem has already settled on `application/jsonl`. Never serve newline-delimited JSON as `application/json`: a client that trusts the header will try to parse the whole body as one document and fail on the second line.

---

## 3. JSON Text Sequences (RFC 7464)

The IETF's answer to the same problem is RFC 7464, published on the Standards Track in February 2015, with the registered media type `application/json-seq`. Each JSON text is preceded by an ASCII Record Separator (`0x1E`) and followed by a line feed:

```text
<RS>{"id":"ord_1","status":"paid"}<LF>
<RS>{"id":"ord_2","status":"refunded"}<LF>
```

The leading RS lets a parser resynchronize after a corrupt element: it skips to the next RS and carries on. The trailing LF lets it detect truncation of top-level numbers, `true`, `false` and `null`, which have no closing delimiter. RFC 8091 adds a `+json-seq` structured syntax suffix for media types built on it.

It is the better-specified format and the only registered one. It is also the less used, because the RS byte is invisible in most editors and breaks the "inspect it with `head` and `grep`" property that makes newline-delimited JSON attractive. Use `application/json-seq` where a standard references it (GeoJSON Text Sequences, RFC 8142, does) or where you need resynchronization; otherwise newline-delimited JSON is what consumers expect.

---

## 4. Streaming over HTTP

Newline-delimited JSON is a good fit for a long response whose records are generated progressively: an export, a search over a large index, a log tail. The server flushes each line as it is produced; the client reads the body incrementally and parses on each newline.

```http
GET /v1/orders/export?since=2026-01-01 HTTP/1.1
Host: api.example.com
Accept: application/x-ndjson

HTTP/1.1 200 OK
Content-Type: application/x-ndjson

{"id":"ord_1","status":"paid","total":"42.00"}
{"id":"ord_2","status":"refunded","total":"9.50"}
```

Once the status line is sent you cannot change it, so an error halfway through has to be written as a record. Define an error line shape up front, and make the last line a summary record so a client can tell a complete stream from a dropped connection.

Choose [Server-Sent Events](/specifications/server-sent-events) instead when the stream is open-ended and pushed to a browser, since SSE gives you event types, reconnection and `Last-Event-ID` resumption that newline-delimited JSON leaves to you. See [streaming APIs](/guides/streaming-apis) for the trade-offs, and [bulk operations](/guides/bulk-operations) for newline-delimited JSON as a request format.

---

## Best Practices

* One compact JSON object per line, UTF-8, no BOM, terminated by `\n`, including after the last record.
* Accept `\r\n` on input.
* Report parse errors with the line number, and decide up front whether a bad line aborts the whole batch or is reported and skipped.
* Do not mix a header line or a footer with a different shape into the stream unless every record carries a `type` field that says which is which.
