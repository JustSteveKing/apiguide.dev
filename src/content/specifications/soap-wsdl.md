---
title: "SOAP and WSDL"
description: "A reference for integrators meeting legacy SOAP services: SOAP 1.1 and 1.2 envelopes, the SOAPAction header and the action parameter, faults and their HTTP status codes, WSDL 1.1 and 2.0, document/literal style, and WS-Security."
currentVersion: "SOAP 1.2 (Second Edition, 2007); WSDL 1.1 / 2.0"
officialUrl: "https://www.w3.org/TR/soap12-part1/"
updatedDate: 2026-10-17
---

## What are SOAP and WSDL?

SOAP is an XML messaging protocol: every message is an XML envelope with an optional header and a mandatory body, usually sent as an HTTP `POST`. WSDL is the XML language that describes a SOAP service: its operations, the XML schemas of their messages, and the address and binding to call them on. Together they were the dominant way to build web services in the 2000s, and they are still what you meet in banking, insurance, government, telecoms, payment networks and enterprise software.

Nobody should design a new public API on SOAP today; for the alternatives see [choosing an API style](/guides/choosing-api-style). This page is for the other case, which is common: you have to integrate with a service that already speaks it. The practical advice is to let tooling do the work. Get the WSDL, generate a client from it, find out which SOAP version and security profile the service actually uses, and spend your effort on the faults and the edge cases rather than on hand-building XML.

---

## 1. Versions

| Specification | Status | Date |
| :--- | :--- | :--- |
| SOAP 1.1 | W3C Note (a submission, never a standard) | 8 May 2000 |
| SOAP 1.2 | W3C Recommendation, Second Edition | 27 April 2007 (first edition 2003) |
| WSDL 1.1 | W3C Note | 15 March 2001 |
| WSDL 2.0 | W3C Recommendation | 26 June 2007 |
| WS-I Basic Profile 1.1 | Final interoperability profile | 10 April 2006 |

The formal status is misleading. SOAP 1.1 and WSDL 1.1, the two that were never standards, are by far the most widely deployed. WSDL 2.0 saw little adoption. In practice you will meet SOAP 1.1 or 1.2 described by WSDL 1.1, and the WS-I Basic Profile is what made the 1.1 pair interoperable.

You can tell the version from the envelope namespace:

| Version | Envelope namespace |
| :--- | :--- |
| SOAP 1.1 | `http://schemas.xmlsoap.org/soap/envelope/` |
| SOAP 1.2 | `http://www.w3.org/2003/05/soap-envelope` |

A message in the wrong namespace earns a `VersionMismatch` fault.

---

## 2. The envelope over HTTP

The two versions differ most visibly in their HTTP headers.

**SOAP 1.1** uses `text/xml` and a separate `SOAPAction` header, which the client must send. WS-I Basic Profile requires its value to be a quoted string; an empty string `""` means the request URI identifies the intent.

```http
POST /StockService HTTP/1.1
Host: legacy.example.com
Content-Type: text/xml; charset=utf-8
SOAPAction: "urn:example:GetQuote"

<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header/>
  <soap:Body>
    <m:GetQuote xmlns:m="urn:example:stock">
      <m:symbol>ACME</m:symbol>
    </m:GetQuote>
  </soap:Body>
</soap:Envelope>
```

**SOAP 1.2** uses `application/soap+xml` (registered by RFC 3902), and the action moves into an optional `action` parameter of the [`Content-Type`](/headers/content-type):

```http
POST /StockService HTTP/1.1
Host: legacy.example.com
Content-Type: application/soap+xml; charset=utf-8; action="urn:example:GetQuote"

<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">
  <env:Body>
    <m:GetQuote xmlns:m="urn:example:stock">
      <m:symbol>ACME</m:symbol>
    </m:GetQuote>
  </env:Body>
</env:Envelope>
```

Getting the action wrong is the commonest first failure. Many servers route on it, and a missing or unquoted `SOAPAction` produces a fault that says nothing about the real cause. Copy the value from the `soapAction` attribute in the WSDL binding exactly.

Header blocks marked `mustUnderstand="true"` (or `"1"` in SOAP 1.1) must be processed by the receiver or rejected with a `MustUnderstand` fault, never silently ignored.

---

## 3. Faults

Errors come back as a `Fault` element in the body. The structure changed between versions:

| SOAP 1.1 | SOAP 1.2 | Meaning |
| :--- | :--- | :--- |
| `faultcode` | `Code/Value` (with optional nested `Subcode`) | Machine-readable code |
| `faultstring` | `Reason/Text` (one per `xml:lang`) | Human-readable explanation |
| `faultactor` | `Node`, `Role` | Which node failed |
| `detail` | `Detail` | Application-specific error data |

| SOAP 1.1 code | SOAP 1.2 code | HTTP status (1.1) | HTTP status (1.2) |
| :--- | :--- | :--- | :--- |
| `Client` | `Sender` | [`500`](/status-codes/500) | [`400`](/status-codes/400) |
| `Server` | `Receiver` | `500` | `500` |
| `VersionMismatch` | `VersionMismatch` | `500` | `500` |
| `MustUnderstand` | `MustUnderstand` | `500` | `500` |
| | `DataEncodingUnknown` | | `500` |

SOAP 1.1 requires every fault to be a `500 Internal Server Error`, including the ones that are the client's fault. This has a practical consequence: **do not treat a `500` from a SOAP service as an outage until you have parsed the body.** Most HTTP clients and retry middleware assume `500` means "retry later"; with SOAP 1.1 it often means "your request is wrong and retrying will never help". `Client` / `Sender` faults should not be resent unchanged. `Server` / `Receiver` faults may succeed later.

The application-level error you care about is almost always in `detail`, as a typed element declared in the WSDL. Generated clients usually raise it as a typed exception; catch those, not the generic fault.

---

## 4. WSDL

A WSDL 1.1 document has these parts:

| Element | Describes |
| :--- | :--- |
| `types` | XML Schema for the messages |
| `message` | The parts of each input, output and fault message |
| `portType` | The abstract operations and their messages |
| `binding` | How a `portType` maps to SOAP: style, use, `soapAction` |
| `service` / `port` | The endpoint address for a binding |

WSDL 2.0 renames `portType` to `interface` and `port` to `endpoint`, drops `message` in favor of schema elements directly, and can also describe plain HTTP bindings. If you are handed a 2.0 document, check your toolkit supports it before anything else; many do not.

### Style and use

A binding's `style` is `rpc` or `document` (the default), and each body's `use` is `literal` or `encoded`. The combination that won is **document/literal**, usually in the "wrapped" convention, where the body holds a single element named after the operation. WS-I Basic Profile requires `literal` and prohibits SOAP encoding. If you meet `rpc/encoded`, expect your modern toolkit to refuse it or need a legacy mode.

---

## 5. Security

Transport security is TLS, often with client certificates; see [mutual TLS](/guides/mutual-tls). Message-level security is **WS-Security** (OASIS, current version 1.1.1, 2012), which adds a `wsse:Security` header block carrying tokens, XML signatures and encrypted elements. The UsernameToken and X.509 token profiles are the forms you are most likely to meet.

WS-Security is where hand-rolled integrations go wrong: XML signatures depend on canonicalization, and a signature over an element that your library reformats will not verify. Use a toolkit with real WS-Security support, and get a known-good signed sample request from the provider to test against.

---

## Best Practices

* Generate the client from the WSDL rather than templating XML strings. Keep the WSDL in your repository so a provider-side change shows up as a diff.
* Explore a new service with a dedicated tool such as [SoapUI](/tools/testing-mocking/soapui) before writing code; it builds sample requests from the WSDL.
* Parse every `500` for a fault before deciding whether to retry.
* Log the raw request and response envelopes, with secrets redacted, during integration. A fault with an empty `faultstring` is only diagnosable from the wire.
* Do not wrap a SOAP service by passing its XML straight through a new REST API. Translate it into your own resources and errors at the boundary, so the legacy shape stays in one place.
