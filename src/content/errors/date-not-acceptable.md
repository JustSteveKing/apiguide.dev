---
title: Date Not Acceptable
statusCode: 400
statusText: Bad Request
category: client-error
relatedCodes: ['ohttp-key-not-acceptable', 'malformed-request-body']
publishedDate: 2026-10-17
registeredType: https://iana.org/assignments/http-problem-types#date
---

## When to use it

Use 400 with Date Not Acceptable when you reject a request because the value of its [`Date`](/headers/date) header falls outside the window of time you accept requests in. The usual reason to have such a window is replay protection: if you only accept requests dated within the last few minutes, you only have to remember the requests you have seen within those few minutes.

The type is defined in Section 6.5.2 of RFC 9458, Oblivious HTTP, for an Oblivious Gateway Resource that uses `Date` for anti-replay. It is registered in the IANA HTTP Problem Types registry as `https://iana.org/assignments/http-problem-types#date`, so send that URI as the `type`. The registry entry is not restricted to Oblivious HTTP, and the meaning, "the date in your request is not acceptable", fits any server that rejects requests on a replay window.

Send your own `Date` in the response. RFC 9458 has the client correct for clock skew by retrying once with your `Date` value, adjusted by [`Age`](/headers/age) if the response came from a cache, and it forbids retrying with an adjusted date more than once. Because the response depends on the request's `Date`, either send [`Cache-Control: no-store`](/headers/cache-control) or include `date` in [`Vary`](/headers/vary), as the RFC recommends.

## When not to use it

Do not use it when `Date` is missing or does not parse. That is a malformed request, and a plain 400 or `malformed-request-body` says so; this type claims the value was read and judged out of range.

Do not use it for an expired token or a stale signature `created` parameter. Those are different clocks with different fixes: an expired token is `expired-authentication-token`, and the client renews it rather than adjusting its clock.

Do not keep the window secret, and do not use this type to hide it. RFC 9458 notes that a client can find the window by probing, so a vague error buys nothing.

## Example response

```http
HTTP/1.1 400 Bad Request
Date: Fri, 17 Oct 2026 09:30:00 GMT
Content-Type: application/problem+json
Cache-Control: no-store
```

```json
{
  "type": "https://iana.org/assignments/http-problem-types#date",
  "title": "Date Not Acceptable",
  "status": 400,
  "detail": "The request was dated 09:14:02 GMT, outside the 5 minute window this server accepts.",
  "instance": "/v1/transfers"
}
```
