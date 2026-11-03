---
title: "Making API Documentation Readable by Agents"
description: "Getting a reference site read correctly by agents: an entry point that fits in one fetch, summaries that separate similar pages, Markdown siblings, Accept negotiation that leaves browsers alone, problem responses for misses, and what to test on the real platform."
category: "agents"
updatedDate: 2026-11-03
---

## An Agent Reads Your Documentation One Fetch at a Time

The [agent-ready API checklist](/guides/agent-ready-checklist) and [how an API becomes tool definitions](/guides/tool-definitions) are about the API. This guide is about the documentation around it, which an agent reaches differently from a person. It usually arrives with a question, fetches a URL, and reasons over whatever fits in its context. It cannot scan a sidebar, and it does not get a second look at a page that was truncated.

So the practical question for a documentation site is what one fetch returns. On this site, the HTML for the [`forbidden` problem type](/errors/forbidden) is 41,994 bytes and its Markdown sibling is 3,548, with the same content for a reader that has no use for the navigation, styles and scripts.

The sections below use this site as a worked example, because every behavior described can be checked with `curl`. One caveat applies to all of it: **these changes shipped on 2026-11-03, and their benefit has not been measured.** The byte counts are facts. Whether agents choose better or read more because of them is not yet known, and section 10 covers how to find out.

---

## 1. An Entry Point That Fits in One Fetch

Give an agent one URL that tells it what the site is, how to use it, and where everything lives. The convention is [`/llms.txt`](https://llmstxt.org/), a Markdown file with a title, a one-line summary, some detail, and lists of links under `##` headings. It is a proposal rather than a standard, and nothing obliges any client to read it, but it is cheap to publish and a person can read it too.

The mistake is treating it as a sitemap. This site's previous version listed all 436 pages and reached 74 KB, with one paragraph of guidance above a very long list. The current [`/llms.txt`](/llms.txt) is about 17.5 KB and contains:

- What the site is, and its licence.
- The rule most likely to be got wrong. Here that is which URI to send as a problem's `type`.
- Every problem type, because they are what the site exists to offer.
- A link to each other section, with its page count and size, so the reader can decide before it fetches.
- Links that point directly at Markdown, not at HTML it would have to discard.

State sizes in words or bytes. "Everything in one file" and "239,031 words" prompt very different decisions.

---

## 2. Split the Full Text by Section

A single file holding the whole site is easy to generate and hard to use. This site's [`/llms-full.txt`](/llms-full.txt) is 1.6 MB, which is more than an agent should load to answer a question about one header. It stays available, but the entry point steers readers toward smaller files:

| File | Bytes | Words |
| :--- | ---: | ---: |
| `/llms-full.txt` | 1,632,183 | 239,031 |
| `/llms/guides.txt` | 420,758 | 63,124 |
| `/llms/errors.txt` | 149,668 | 22,562 |
| `/errors.md`, the section's index | 14,742 | 1,897 |
| `/errors/forbidden.md`, one page | 3,548 | 563 |

Each step down is a choice the reader can make with what it learned from the step above. An index with one line per page is usually the most useful of these, which makes the quality of that line the next problem.

---

## 3. Summaries That Tell Similar Pages Apart

A directory only helps if its descriptions separate the things a reader is choosing between. This site has five problem types for [`403 Forbidden`](/status-codes/403), and until recently `/llms.txt` described each of them as `HTTP 403: Forbidden`. That is true, and useless to a reader trying to choose, because the only way to tell them apart was to fetch all five.

Each type now carries one sentence, the first of its "When to use it" section:

| Type | Summary, shortened |
| :--- | :--- |
| [`forbidden`](/errors/forbidden) | The credentials are valid, and your authorization rules still refuse this action |
| [`insufficient-scope`](/errors/insufficient-scope) | The credentials are valid, but the token lacks the permissions or scopes needed |
| [`feature-disabled`](/errors/feature-disabled) | The request is valid, and the feature is turned off for this account or plan |
| [`account-frozen`](/errors/account-frozen) | The account itself is suspended, locked or under review |
| [`tenant-suspended`](/errors/tenant-suspended) | The caller's account is fine, but the tenant the request targets is suspended |

Two things made this cheap. The sentence is derived from content that already existed, so there was nothing new to write and nothing new to keep in step, and the build fails if a page has no such paragraph. It is also the same sentence everywhere: the [JSON](/errors/forbidden.json), the search index, `/llms.txt` and the Markdown all use it.

A useful way to test a description is to read the whole list cold and ask whether you could choose from it. If two lines could swap places unnoticed, neither is doing its job.

<!-- RESULT NOTE FOR STEVE: if the agent choice test gives a number worth publishing, it goes here. Remove this comment before merging either way. -->

Machine-readable output needs the same care. This site's rule is that a problem type [registered with IANA](https://www.iana.org/assignments/http-problem-types/) should be sent with its registered URI, but the per-type JSON used to omit that URI, so an agent reading it would have built the wrong `type`. If a value is the point of the page, put it in every format the page comes in.

---

## 4. A Markdown Sibling for Every Page

Publish each page's content without its HTML shell at a predictable URL. The `llms.txt` proposal suggests appending `.md`, so `/guides/pagination` has `/guides/pagination.md`, and advertising it costs one line in the page's `<head>`:

```html
<link rel="alternate" type="text/markdown" href="/guides/pagination.md">
```

Keep facts that would otherwise be lost with the shell, such as the canonical URL, the update date and the defining standard. This site's siblings open with them:

```text
# 404 Not Found

> The server cannot find the requested resource or URI route.

Source: https://apiguide.dev/status-codes/404
Class: client-error
Defined in: RFC 9110, Section 15.5.5 <https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.5>
```

Then look for what the generator misses, because the gaps are rarely random. This site's siblings came from its content collections, so the section index pages and the hand-written [`/problem-json`](/problem-json) page had none, despite the latter being one of the most relevant pages on the site. A hand-written page needs a hand-written sibling, and a note beside each saying that the other exists.

Also serve these files with permissive [`Access-Control-Allow-Origin`](/headers/access-control-allow-origin), since a public, read-only document has no reason to refuse an agent running in a browser.

---

## 5. Answer `Accept` at the URLs Software Follows

A sibling only helps a reader who knows about it. Some URLs get followed without that knowledge, and the clearest case is the `type` of an [RFC 9457 problem](/specifications/problem-details), which a developer or their agent finds inside an error and looks up. RFC 9457 says clients [should not dereference a type automatically](https://www.rfc-editor.org/rfc/rfc9457.html#section-3.1.1) outside of helping a developer, so treat this as support for debugging and not as something ordinary error handling should depend on. [Content negotiation](https://www.rfc-editor.org/rfc/rfc9110.html#section-12) lets that one URL serve every reader. These are the current responses for `/errors/forbidden`:

| Request `Accept` | Response `Content-Type` | Size |
| :--- | :--- | ---: |
| `text/html,application/xhtml+xml,*/*;q=0.8`, a browser | `text/html` | 41,994 |
| `*/*`, a tool with no preference | `text/html` | 41,994 |
| `text/markdown` | `text/markdown` | 3,548 |
| `text/markdown, text/html, */*` | `text/markdown` | 3,548 |
| `application/json` | `application/json` | 349 |

The rules behind that table are short:

1. **The default stays HTML.** RFC 9457 says that dereferencing a type URI [SHOULD provide human-readable documentation](https://www.rfc-editor.org/rfc/rfc9457.html#section-3.1.1), and a person pasting one into a browser must still get the page. A wildcard therefore means HTML, and so does an `Accept` header that names nothing you can serve.
2. **Honor `q`, then the client's order, with wildcards last.** `text/markdown;q=0, text/html` gets HTML, and `text/markdown, text/html, */*` gets Markdown.
3. **Send [`Vary: Accept`](/headers/vary) on every negotiated response, HTML included.** Without it, a shared cache can hand one reader's format to the next.
4. **Say where the variant lives.** [`Content-Location`](/headers/content-location) names the sibling, and a [`Link`](/headers/link) header on the HTML response advertises it to clients that never parse the page.

```http
HTTP/2 200
Content-Type: text/markdown
Content-Location: /errors/forbidden.md
Vary: Accept
```

**Who sends this?** Fewer clients can be confirmed than the enthusiasm around the idea suggests. The [Claude Code tools reference](https://code.claude.com/docs/en/tools-reference) says its WebFetch tool sends an `Accept` header preferring Markdown over HTML, and the [Qwen Code documentation](https://qwenlm.github.io/qwen-code-docs/en/developers/tools/web-fetch/) gives its header in full. Other agents are named in blog posts, which is not the same as their own documentation, and [Cloudflare's feature page](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) names no clients at all. Assume the list is incomplete and changing, which is one reason to keep siblings at plain URLs as well.

Doing this needs something that can run at request time, which a purely static site does not have. This site uses a small Worker. If you are on Cloudflare and do not need curated output, its [Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) setting converts HTML at the edge on Pro plans and above. The trade-off is that the result is derived from your HTML, not from a sibling you control.

---

## 6. A Miss Is a Problem, Not a Page

An agent that asked for JSON and receives a 404 made of 29,720 bytes of HTML has learned very little and spent a lot to learn it. If the request was for a machine format, answer in one, with a pointer to somewhere useful:

```http
GET /errors/nope.json HTTP/2

HTTP/2 404
Content-Type: application/problem+json
Vary: Accept

{
  "type": "https://apiguide.dev/errors/resource-not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "There is no problem type at /errors/nope.json. The catalogue is at https://apiguide.dev/errors/index.json.",
  "instance": "/errors/nope.json"
}
```

A browser asking for `/errors/nope` still gets the HTML 404 page, because a person is reading it.

This site only does this under `/errors/*`, so `/guides/nope.md` still returns the HTML page. That is deliberate. Requests that run code [can count against limits that static assets do not](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), and on Cloudflare's free tier, exceeding them means those requests start failing. Put code in front of the URLs where it earns its place and leave the rest static, then say plainly where the line is.

---

## 7. Describe the Machine-Readable Parts

If your site serves structured data, it has an API, and it can be held to what you would ask of any other. This site's JSON endpoints, the negotiated documentation URL and its discovery files are described in [`/openapi.json`](/openapi.json), with an `operationId`, a description saying when to use each operation, and examples.

Publishing that document also lets you lint it. This site's scores 96 from [legible](/tools/design-documentation/legible), a tool by this site's author, with 3 warnings for not documenting a 4xx on static files that always exist. Leaving those is the honest option, since documenting a response that cannot happen would raise the score and make the description worse.

To make the description discoverable, publish an [API catalog](/specifications/api-catalog) at `/.well-known/api-catalog`, as defined by [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727.html). It is a [Linkset](/specifications/linkset) that points at what you serve, using `service-desc` for the machine-readable description and `service-doc` for documentation, both from [RFC 8631](https://www.rfc-editor.org/rfc/rfc8631.html). The RFC also requires a `HEAD` request to that path to return a `Link` header with the `api-catalog` relation, so check that as well as the document:

```json
{
  "anchor": "https://apiguide.dev/errors/index.json",
  "service-desc": [
    { "href": "https://apiguide.dev/openapi.json", "type": "application/vnd.oai.openapi+json;version=3.1" }
  ],
  "service-doc": [
    { "href": "https://apiguide.dev/errors", "type": "text/html" },
    { "href": "https://apiguide.dev/llms.txt", "type": "text/plain" }
  ]
}
```

---

## 8. Test Headers on the Real Platform

Everything above depends on response headers, and those are the part of a static site most likely to behave differently between a local emulator and production. Two bugs from this site's rollout make the point, and one of them only appeared on Cloudflare.

The site's headers are set in a Cloudflare [`_headers` file](https://developers.cloudflare.com/workers/static-assets/headers/). The first attempt advertised each page's sibling with a placeholder rule:

```text
/guides/:slug
  Link: </guides/:slug.md>; rel="alternate"; type="text/markdown"
```

A placeholder matches the sibling too, so `/guides/pagination.md` advertised `/guides/pagination.md.md`. The intended fix was to detach the header from those files:

```text
/*.md
  ! Link
```

Under `wrangler dev` that worked, and the header was gone. On a version uploaded to Cloudflare, the same file still sent `Link: </guides/pagination.md.md>`, and a narrower `/guides/*.md` rule did no better. The eventual fix was to stop relying on it: rules that use exact paths stay in `_headers`, and the code in front of `/errors/*` sets `Link` itself. Other pages keep their `<link rel="alternate">` in the HTML, since Cloudflare's [limit of 100 rules](https://developers.cloudflare.com/workers/static-assets/headers/) rules out one per page.

The second bug did show up locally. Two rules both set `Access-Control-Allow-Origin` on one path, and as the same documentation describes, the values are joined with a comma. `*, *` is not a valid value for that header, so browsers reject it, even though it looks harmless at a glance.

The lesson is not specific to Cloudflare. An emulator is an approximation of your platform, and it is at its least reliable in configuration like this. Deploy to a non-production preview, such as a [Workers version](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/), and `curl` the sibling files as well as the pages:

```bash
curl -sI https://<preview>/guides/pagination.md | grep -i -E '^(link|access-control)'
curl -sI -H 'Accept: text/markdown' https://<preview>/errors/forbidden
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://<preview>/errors/nope.json
```

---

## 9. When an MCP Server Is Not Worth It Yet

An [MCP server](/guides/mcp-servers) is a natural thing to reach for here, and for a public, read-only reference it is often premature. A person has to install it, it needs running and maintaining, and many of its tools would wrap fetches that already work over plain HTTP, which that guide warns against when it says to curate tools rather than mirror endpoints.

Do the text and HTTP work first, because it serves every client that can fetch a URL. Then consider a server when at least one of these is true:

| Signal | Why it changes the answer |
| :--- | :--- |
| Answering needs computation that fetching cannot do | A static file cannot run a query. A search that an agent otherwise has to perform over a 100 KB [index](/search-index.json) is a reasonable first tool |
| Your logs show agents repeating an expensive sequence of fetches | That sequence is one intention, and it can become one tool |
| The content is behind authentication | Your readers now need credentials handled for them, which plain fetching does not do |
| People are asking for one | The installation cost is already accepted |

This site's content is public and it has no evidence yet of the other signals, so it has no server. Search would be the first tool to consider, and that is a decision to revisit with evidence rather than a permanent one.

---

## 10. Measure It, Because Most of This Is Unproven

Be careful with claims here, including this guide's. Smaller responses are measurable, and whether they produce better outcomes for your readers is a separate question that needs its own evidence. Analytics that run in page JavaScript will not count a client that fetches a page without executing it, so you may be looking at a dashboard that cannot see the traffic in question.

- **Log what you can.** This site's Worker logs the format, path and `User-Agent` for each request that negotiates a non-HTML format, with no address or token. It cannot see requests served directly as static files, such as a `.md` fetched by URL outside `/errors/*`, so it undercounts.
- **Test the choices directly.** Give an agent only your entry point and a set of realistic situations, then check what it picks. Wrong picks tell you which summaries need rewriting.
- **Decide what would change your mind.** Without a threshold, any number can be read as success.

---

## Before You Ship It

A short review for a documentation site that agents will read:

1. One entry point fits in a single fetch, and it states the rule readers most often get wrong.
2. Larger files exist in steps, and each link says how big its target is.
3. Reading the directory cold is enough to choose between similar pages.
4. Every page has a Markdown sibling, including hand-written and index pages, and advertises it.
5. Machine-readable formats carry the values the page exists to give.
6. URLs that software follows negotiate on `Accept`, default to HTML, and send `Vary: Accept`.
7. A miss on a machine format gets a [problem response](/problem-json), and any exceptions are deliberate.
8. Structured endpoints are described in OpenAPI, linted, and discoverable from an API catalog.
9. Headers have been checked with `curl` on a real preview, on the sibling files as well as the pages.
10. You have some way of seeing whether any of this is used, and you know what it cannot see.
