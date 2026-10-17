---
title: Oblivious HTTP Key Configuration Not Acceptable
statusCode: 400
statusText: Bad Request
category: client-error
relatedCodes: ['date-not-acceptable']
publishedDate: 2026-10-17
registeredType: https://iana.org/assignments/http-problem-types#ohttp-key
---

## When to use it

Use 400 with this type when you run an Oblivious Gateway Resource under RFC 9458, Oblivious HTTP, and an Encapsulated Request was made with a key configuration you no longer accept or never issued: an unknown key identifier, a rotated-out key, or an unsupported HPKE suite.

The type is defined in Section 5.3 of RFC 9458 and registered in the IANA HTTP Problem Types registry as `https://iana.org/assignments/http-problem-types#ohttp-key`. Send that URI as the `type`. It is the signal for the client to fetch a fresh key configuration, served as `application/ohttp-keys`, and try again.

Keep it short. The response cannot be encapsulated, because the gateway could not decrypt the request and so has no context to encrypt the reply with. It travels back in the clear through the Oblivious Relay Resource, so put nothing in it you would not show the relay.

## When not to use it

Outside Oblivious HTTP, do not use it at all. It is a narrow, registered type with one meaning, and borrowing it for a general "wrong key" error, such as an unknown signing key on a webhook, misleads any client that recognizes it.

Do not use it when the request decrypts but its `Date` falls outside your replay window. That is `date-not-acceptable`.

Do not rely on clients receiving it. RFC 9458 says a client cannot count on a gateway sending this type, and may ignore unencapsulated responses because the relay could have altered them. Clients usually refresh key configurations on a schedule, or after any unencapsulated error, rather than waiting for this signal.

## Example response

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json
```

```json
{
  "type": "https://iana.org/assignments/http-problem-types#ohttp-key",
  "title": "Oblivious HTTP key configuration not acceptable",
  "status": 400
}
```
