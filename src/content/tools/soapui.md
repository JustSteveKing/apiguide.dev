---
name: "SoapUI"
description: "A functional testing application for SOAP and REST APIs, designed for testing complex enterprise integrations."
category: "testing-mocking"
lifecycleStages: ["testing"]
url: "https://soapui.org"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is SoapUI?

SoapUI Open Source is a desktop API testing tool from SmartBear for SOAP, REST, GraphQL and JMS services. Tests are organized as a project of test suites, test cases and test steps, saved as a single XML project file, with assertions on each request and Groovy or JavaScript for anything the built-in steps do not cover. It also runs mock services from a WSDL or a REST definition. SmartBear's commercial product, ReadyAPI, is built on the same core and adds codeless assertions, data-driven testing, more protocols and team features; SoapUI Open Source is the free edition.

## Why use it in the API Lifecycle?

* **SOAP and WSDL first**: Import a WSDL and get a request for every operation, with schema compliance assertions against the WSDL. For SOAP services this remains one of the most complete free tools.
* **REST, GraphQL and JMS**: The same project structure covers REST resources, GraphQL queries and JMS messaging alongside SOAP.
* **Assertions and property transfer**: Assertions check status, content, XPath and JSONPath results, and property transfers carry a value from one step's response into the next request.
* **Mock services**: Serve canned responses for an operation so a client can be tested before the provider exists.
* **Command-line runner**: `testrunner.sh` (or `testrunner.bat`) runs a project headlessly, which is how SoapUI tests run in CI.

## Best Practices

* Run the project in CI with the test runner, not by hand: `testrunner.sh -s"Orders" -e https://staging.example.com -j -f reports orders-soapui-project.xml`. `-e` overrides the project's endpoint so one project runs against every environment, and `-j` writes JUnit-compatible reports the pipeline can display.
* Keep environment-specific values in project properties and override them with `-Pname=value` at run time, rather than hard-coding hosts, credentials or tenant IDs into test steps. Never commit real credentials inside the project XML.
* Assert on status and content type for every step, not just on body content: a SOAP 1.1 fault should arrive as [`500 Internal Server Error`](/status-codes/500) with a fault body (SOAP 1.2 uses [`400 Bad Request`](/status-codes/400) for sender faults), and a REST validation failure as `400` or [`422 Unprocessable Content`](/status-codes/422) with an [`application/problem+json`](/specifications/problem-details) body. A test that only greps the body passes when the server returns an error page that happens to contain the expected word.
* Prefer XPath and JSONPath match assertions on specific fields over Contains assertions on whole responses, which break on harmless reordering and pass on wrong values.
* Keep each test case self-contained: create the data it needs in its own setup steps and clean up afterwards, so suites can run in any order and a single case can be rerun in isolation.
* Expect merge pain. The whole project is one large XML file, so two people editing different tests still conflict; split large suites into separate projects by service or team. For REST-only work where tests should diff cleanly in review, a plain-text tool such as [Hurl](/tools/testing-mocking/hurl) or [Bruno](/tools/clients-debugging/bruno) is usually the better fit.
