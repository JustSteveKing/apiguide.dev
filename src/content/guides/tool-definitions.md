---
title: "How an API Becomes Tool Definitions"
description: "What an agent actually receives when your OpenAPI document is converted into tool definitions, which parts of the contract survive the conversion, and which are silently dropped."
category: "core"
---

## The Document Is Not the Interface

An autonomous agent never sees your API. It does not read your documentation site, it does not browse your endpoints, and it does not have your specification open beside it. What reaches the model is a **tool definition**: a name, a description, and a single JSON Schema describing one object of arguments. Everything a caller knows about your API has to survive that conversion, and a surprising amount of it does not.

This is the most useful exercise available to anyone designing an API that agents will call. Take one operation, convert it, and read the result cold, without the specification next to it. If you cannot tell what the operation does, when to use it, or what you get back, neither can the model, because that is all it was given.

The conversion itself is mechanical, and every major tool-calling API expects roughly the same shape:

```json
{
  "name": "updateUser",
  "description": "Update a user's profile.",
  "input_schema": {
    "type": "object",
    "properties": { },
    "required": [ ]
  }
}
```

Three fields. A name, a sentence, and one flat object. The sections below cover what has to be squeezed into them.

---

## 1. Four Namespaces Become One

This is the structural change, and the one most likely to produce a wrong call rather than a confusing one.

An HTTP operation has four separate places to put an input: the path, the query string, the headers, and the request body. Those namespaces are independent, so `userId` in the path and `userId` in the body are unambiguously different things.

A tool has one namespace. To expose the operation, a converter flattens the path, query, header and cookie parameters together with the request body's top-level properties into a single argument object. Independence is lost in the process.

Consider an operation that looks entirely reasonable:

```yaml
/users/{username}:
  put:
    operationId: updateUser
    parameters:
      - name: username
        in: path
        required: true
        schema: { type: string }
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              username: { type: string }
              email:    { type: string }
```

The path identifies the user to update. The body carries the new values, including a new username. Two different meanings, two different namespaces, no ambiguity to a person.

Flattened, there is one `username` argument for both. A converter has to choose: rename one side to something the model has never seen documented, such as `body_username`; nest the body under a `body` key that few models expect; or let one silently win. Whichever it picks, the model sends one value and the API receives it in the wrong place, or twice.

**Fix it in the specification, not the converter.** Give each input one name and one meaning:

```yaml
/users/{userId}:
  put:
    operationId: updateUser
    parameters:
      - name: userId
        in: path
```

`PUT /resource/{id}` with a body that repeats the identifier is the classic case, and it is common precisely because it reads fine to a human.

See [resource naming](/guides/resource-naming).

---

## 2. The Name Becomes a Function Name

`operationId` becomes the tool's name, and tool names are constrained in ways paths are not.

| API | Allowed |
| --- | --- |
| OpenAI | `^[a-zA-Z0-9_-]{1,64}$` |
| Anthropic | `^[a-zA-Z0-9_-]{1,128}$` |

The safe target is the intersection: letters, digits, underscore and hyphen, at most 64 characters. An `operationId` outside that, such as `pets.findByStatus`, `get pet` or `Pets/Find`, is rejected outright. Converters work around it by rewriting the name, and they do not all rewrite it the same way, which reintroduces every problem that having an `operationId` was supposed to solve.

Two consequences worth stating plainly:

- **An operation with no `operationId` gets a generated one.** Something derived from the method and path, chosen by whichever tool did the conversion, and different across tools. The name is part of your contract, so name it yourself.
- **A name over 64 characters is usually a description.** If an `operationId` needs that much room, it is explaining the operation rather than naming it. Move the detail into the description, where it belongs and where there is space for it.

---

## 3. The Description Becomes the Entire Prompt

The description is not documentation. It is the reasoning material the model uses to decide whether to call this operation at all, and it is competing with every other tool in the same request.

The common failure is not an absent description, it is a present one that carries no information:

```yaml
# Passes a "has a description" check, tells the model nothing
delete:
  operationId: deletePet
  description: Delete a pet.
```

A model given that still does not know whether the delete can be undone, what happens to the pet's outstanding orders, or what comes back. Every word restates the name. A description worth its place answers the questions the name raises:

```yaml
delete:
  operationId: deletePet
  description: >
    Permanently remove a pet from the store. This cannot be undone.
    Pets with unfulfilled orders cannot be deleted and return 409.
    Returns 204 with no body on success.
```

Three habits carry most of the value:

- **State when to use it, not only what it does.** Where two operations are close, say which is which. `listOrders` and `searchOrders` are indistinguishable by name.
- **Say what comes back.** The model does not get your response schema in a form it can reason about ahead of time, so the description is where "returns 204 with no body" lives.
- **Name the failure modes.** "Returns 409 if the pet has unfulfilled orders" is the difference between a model recovering and a model retrying forever.

See [error handling](/guides/error-handling) for the shape those failures should take.

---

## 4. The Schema Becomes the Argument Shape

The request body schema, merged with the parameters, becomes the `input_schema`. Two limits apply that have no equivalent in HTTP.

**Depth.** OpenAI's strict mode rejects schemas nested more than five levels deep, and well before that limit, depth is where tool calls come back structurally wrong: the right values at the wrong level. Composition does not count, so `allOf` of two flat objects is still flat to whoever fills it in. Wrappers that exist only for grouping, such as `{ "shipping": { "address": { "location": {} } } }`, can usually lose a level or two. A payload that genuinely is deep is often better split into operations that build the structure a step at a time: create the order, then add lines to it.

**Width.** There is no hard limit on argument count, but past roughly fifteen, models start dropping optional arguments they should have sent, confusing arguments with similar names (`min_price`, `price_min`, `minimum`), and filling in ones nobody asked for simply because they were offered. A `searchTransactions` with 29 filters is usually three operations underneath.

Width has a second cost that depth does not. **Tool definitions are sent on every request.** They occupy the context window before the conversation starts, so a wide tool is not just harder to call correctly, it is more expensive on every single call, including the ones that never use it.

Beyond those, the ordinary rules apply with less tolerance than usual. An untyped property is an instruction to guess. A property with no description is a name and nothing else. A `oneOf` with no discriminator is a decision the model has to make from field names alone.

See [input validation](/guides/input-validation).

---

## 5. What Does Not Survive the Conversion

Worth knowing, because these are the parts of an HTTP contract that people assume carry over and that mostly do not.

| Part of the contract | What reaches the model |
| --- | --- |
| Path and method | Usually nothing. The name and description are all that remain |
| Status codes | Nothing at definition time. The model sees a response only after calling |
| Response schema | Nothing, in most converters. If the model needs to know the shape, the description has to say so |
| Response examples | Nothing, for the same reason |
| Headers, both request and response | Request headers flatten in as arguments. Response headers, including `Retry-After` and rate limit headers, are invisible |
| Auth and scopes | Handled outside the tool, by whoever configured the client. The model cannot reason about what it is allowed to do |
| Deprecation and `Sunset` | Nothing. A deprecated operation looks exactly like a current one |
| Tags and grouping | Nothing. Related operations arrive as an undifferentiated list |

The pattern is that **anything expressed as metadata about a response is lost, and anything expressed in prose survives.** That is an argument for descriptions carrying more than they traditionally do, and it is why the description is the highest-leverage field in the whole document.

It is also why a deprecated operation is a genuine hazard. A caller reading your documentation sees the warning. A model sees a tool that works, and keeps calling it until it stops working. See [deprecation and sunsetting](/guides/deprecation-sunsetting).

---

## 6. Read One Cold

The exercise is worth doing once per API, and it takes minutes.

1. Pick the operation you would least like a caller to get wrong.
2. Convert it into a tool definition, by whatever route your consumers will use.
3. Put the specification away and read only the definition.
4. Ask: what does this do, when should it be used instead of its neighbors, what comes back, and what happens when it fails?

Every question you cannot answer is one the model cannot answer either, and it will answer anyway. That is the difference between this consumer and a human one. A person who cannot tell what an operation does asks, or guesses and notices. A model that cannot tell produces a confident, well-formed, wrong call, and the response it gets back is usually the first sign anything went wrong.

For the full review, including the parts of the contract that live outside the specification, see the [agent-ready API checklist](/guides/agent-ready-checklist).
