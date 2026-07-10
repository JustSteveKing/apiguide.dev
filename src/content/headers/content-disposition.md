---
name: "Content-Disposition"
description: "Indicates whether the body should be displayed inline or treated as a downloadable attachment."
category: "response"
standard: true
relatedCodes: [200]
---

## What is the Content-Disposition header?

The `Content-Disposition` response header tells the client how to present the body: rendered `inline` within the browser, or as an `attachment` that prompts a download. When set to `attachment`, it can also suggest a filename.

## API Usage & Best Practices

* **Trigger downloads**: Use `attachment; filename="report.csv"` when an API endpoint returns a file the user should save rather than view.
* **Display inline**: Use `inline` for previewable content such as PDFs or images meant to render directly.
* **Encode non-ASCII names**: Use the `filename*` parameter with UTF-8 encoding (RFC 5987) for filenames containing non-ASCII characters.

## Examples

```http
HTTP/1.1 200 OK
Content-Type: text/csv
Content-Disposition: attachment; filename="export.csv"
```
