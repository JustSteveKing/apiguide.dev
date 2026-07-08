---
title: "JSON Schema in Web APIs"
description: "An authoritative guide to JSON Schema, detailing validation vocabulary, conditional schemas, logical operators, and $ref definition resolving."
currentVersion: "Draft 2020-12"
officialUrl: "https://json-schema.org"
---

## Introduction to JSON Schema

JSON Schema is a declarative grammar for annotating and validating JSON documents. It acts as the validation engine for modern web APIs, ensuring incoming request payloads match expected structures before hitting backend application logic.

---

## 1. Logical Combinators

JSON Schema provides operators to compose complex validation requirements from simpler schemas:

### `allOf` (AND)
The JSON data must validate successfully against *every* subschema in the array.
```json
{
  "allOf": [
    { "type": "object", "properties": { "name": { "type": "string" } } },
    { "type": "object", "properties": { "age": { "type": "integer" } } }
  ]
}
```

### `anyOf` (OR)
The JSON data must validate successfully against *at least one* of the subschemas in the array.
```json
{
  "anyOf": [
    { "type": "string", "format": "email" },
    { "type": "string", "format": "phone" }
  ]
}
```

### `oneOf` (XOR)
The JSON data must validate successfully against *exactly one* of the subschemas in the array. If it validates against more than one, validation fails.
```json
{
  "oneOf": [
    { "type": "integer", "multipleOf": 3 },
    { "type": "integer", "multipleOf": 5 }
  ]
}
```

---

## 2. Conditional Subschemas (`if`, `then`, `else`)

JSON Schema allows dynamic validation logic based on the value of properties.

### Example: Custom country-based validation
If the `country` property is `US`, then the `postal_code` must match the US ZIP format; otherwise, it can be a generic string.

```json
{
  "type": "object",
  "properties": {
    "country": { "type": "string" },
    "postal_code": { "type": "string" }
  },
  "if": {
    "properties": { "country": { "const": "US" } }
  },
  "then": {
    "properties": {
      "postal_code": { "pattern": "^[0-9]{5}(-[0-9]{4})?$" }
    }
  },
  "else": {
    "properties": {
      "postal_code": { "minLength": 3 }
    }
  }
}
```

---

## 3. Schema Referencing & Defs (`$ref`, `$defs`)

To maintain clean, DRY (Don't Repeat Yourself) schemas, you can define reusable subschemas under the `$defs` key and reference them using JSON pointers:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "billing_address": { "$ref": "#/$defs/address" },
    "shipping_address": { "$ref": "#/$defs/address" }
  },
  "$defs": {
    "address": {
      "type": "object",
      "required": ["street", "city"],
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" }
      }
    }
  }
}
```

