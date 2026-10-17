---
name: "OData-Version"
description: "States which OData protocol version, 4.0 or 4.01, a request or response payload was written in. Services must send it on every response."
category: "both"
standard: true
relatedCodes: [400]
---

## What is the OData-Version header?

The `OData-Version` header is defined in Section 8.1.5 of OData Version 4.01 Part 1: Protocol, an OASIS standard. It states the version of the [OData](/specifications/odata) protocol used to generate the payload of the message it is on. OData 4.01 defines two values, `4.0` and `4.01`.

```http
OData-Version: 4.01
```

The rules differ by direction:

* **On a request**, clients SHOULD send it. If present, the service MUST interpret the payload under that version or fail the request with a 4xx. If absent, the service MUST assume the lesser of the client's `OData-MaxVersion` (if sent) and the highest version it understands.
* **On a response**, services MUST send it, and the client MUST interpret the payload under that version.

Request and response versions are independent. A client asks for the highest response version it can handle with the companion request header `OData-MaxVersion`, and the service MUST respond with the greatest version it supports that is less than or equal to it, using decimal comparison. Inside a `$batch`, individual requests and responses can carry their own `OData-Version`, and those without one inherit the batch's.

Both `OData-Version` and `OData-MaxVersion` are registered as permanent in the IANA HTTP Field Name registry.

## API Usage & Best Practices

* **Always send it from a service.** It is a MUST on every OData response, and generic clients rely on it to choose a parser. Missing it is a conformance bug, not a style choice.
* **Send `OData-MaxVersion` from clients.** The spec says clients SHOULD. Without it, the service SHOULD keep returning the same version over time, interpreting the request as if `OData-MaxVersion` were the highest version it supported when it was first published. If you want 4.01 features, ask for them.
* **Pin the request version when payload rules matter.** A few behaviors depend on it; for example, the protocol says ETag values in request bodies MUST be ignored for requests with `OData-Version: 4.0`. Sending the version you actually wrote removes the guesswork.
* **Reject versions you cannot honor with a 4xx.** If a client declares a request version you do not implement, fail with [`400 Bad Request`](/status-codes/400) and say which versions you support, rather than guessing.
* **Do not confuse it with your API version.** It versions the OData protocol, not your data model. Breaking changes to entities and properties need a new service version, which the protocol says to expose at a different service root URL or by versioning the metadata with the `Core.SchemaVersion` annotation.
* **It replaced the OData v2 and v3 headers.** Earlier versions used `DataServiceVersion` and `MaxDataServiceVersion`.

## Examples

A client asking for at most OData 4.01:

```http
GET /service/Products?$filter=Price%20gt%2020&$select=Name,Price HTTP/1.1
Host: api.example.com
Accept: application/json
OData-MaxVersion: 4.01
```

The service answering in 4.01, which drops the `odata.` prefix from control information and format parameters:

```http
HTTP/1.1 200 OK
Content-Type: application/json;metadata=minimal
OData-Version: 4.01

{
  "@context": "https://api.example.com/service/$metadata#Products(Name,Price)",
  "value": [
    { "Name": "Trail Runner", "Price": 79.0 }
  ]
}
```

A client declaring that its request payload follows 4.0 rules:

```http
PATCH /service/Products(8812) HTTP/1.1
Host: api.example.com
Content-Type: application/json
OData-Version: 4.0
OData-MaxVersion: 4.01

{ "Price": 69.0 }
```
