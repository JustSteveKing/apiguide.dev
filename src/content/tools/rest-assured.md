---
name: "REST Assured"
description: "An open-source Java DSL for testing HTTP APIs with given/when/then syntax, JSON and XML path assertions, and JSON Schema validation."
category: "testing-mocking"
lifecycleStages: ["development", "testing"]
url: "https://rest-assured.io"
pricing: "open-source"
---

## What is REST Assured?

REST Assured is an open-source, Apache 2.0 licensed Java library for testing HTTP APIs, created and maintained by Johan Haleby with other contributors. It brings the readability of dynamic-language HTTP testing to the JVM: a test reads as `given()` (the request), `when()` (the call) and `then()` (the assertions), and plugs into JUnit or TestNG like any other test. Response bodies are queried with Groovy-style JsonPath and XmlPath expressions and checked with Hamcrest matchers, and optional modules add JSON Schema validation and Spring MockMvc support.

## Why use it in the API Lifecycle?

* **Fluent request and assertion DSL**: `given().header(...).body(...).when().post("/orders").then().statusCode(201)` keeps request setup and expectations in one readable chain.
* **Path-based assertions**: JsonPath and XmlPath expressions such as `body("items.size()", is(2))` assert on specific fields without deserializing the whole response.
* **JSON Schema validation**: The `json-schema-validator` module checks a response with `matchesJsonSchemaInClasspath("products-schema.json")`, and 6.1 adds support for JSON Schema draft-06, draft-07, 2019-09 and 2020-12.
* **Reusable specifications**: `RequestSpecBuilder` and `ResponseSpecBuilder` capture shared base URIs, headers, auth and common expectations once for a whole suite.
* **Value extraction**: `extract().path("_links.next.href")` pulls a value out of a validated response for the next request in a flow.
* **Spring integration**: The `spring-mock-mvc` module runs the same DSL against a Spring MVC application without starting a server, and the Spring modules target Spring 7 since 6.0.

## Best Practices

* Define a `RequestSpecification` per API (base URI, [`Accept`](/headers/accept), auth) and a `ResponseSpecification` for invariants such as the [`Content-Type`](/headers/content-type), so individual tests state only what is specific to them.
* Validate responses against the JSON Schema generated from, or embedded in, your OpenAPI document with `matchesJsonSchemaInClasspath`, in addition to asserting the few fields the test is about. One catches drift, the other catches wrong values.
* Turn on `RestAssured.enableLoggingOfRequestAndResponseIfValidationFails()` globally. Full request and response logs on failure make CI failures diagnosable, and logging only on failure keeps passing runs quiet and avoids writing tokens to logs needlessly.
* Use the MockMvc module for fast controller-level tests and a real HTTP server for a smaller set of end-to-end tests. MockMvc skips the servlet container, so it will not catch filters, proxies or serialization settings that only apply on the wire.
* Assert error responses as carefully as success: status, [`Content-Type: application/problem+json`](/specifications/problem-details), and the `type` and `status` members. The broader layering of unit, contract and end-to-end tests is in [API Testing](/guides/api-testing).
* Do not chain a whole user journey into one test method. Extract values between steps where you must, but keep each test small enough that its name explains its failure.
