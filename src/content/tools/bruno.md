---
name: "Bruno"
description: "A fast, git-friendly open-source API client that stores collections directly as folder structures."
category: "clients-debugging"
lifecycleStages: ["development"]
url: "https://usebruno.com"
pricing: "freemium"
---

## What is Bruno?

Bruno is an open-source, Git-native API client that supports REST, GraphQL, gRPC, and Websocket protocols. It is a local-first solution designed to operate without cloud syncing or account requirements, storing API collections as plain-text files. The tool emphasizes developer control and integration with existing development workflows.

## Why use it in the API Lifecycle?

* **Git-native API Collections**: Stores API collections as plain-text files within a repository, allowing version control, diffing, and merging using standard Git workflows.
* **Multi-protocol Support**: Supports interaction with various API types including REST, GraphQL, gRPC, and Websocket.
* **Local-first Operation**: Operates entirely on the local machine, ensuring data privacy and preventing cloud syncing or external data exposure.
* **Extensibility**: Offers an open-source architecture that allows for customization and integration with existing developer toolchains.
* **Environment Management**: Supports separate .env files and environments for managing variables and configurations.
* **Request Grouping**: Allows users to organize multiple requests into folders and execute them sequentially.

## Best Practices

* Store API collections alongside related code in Git to leverage version control for collaboration and change tracking.
* Utilize the local-first nature of the tool to maintain data privacy and security, as no data is synced to the cloud.
* Integrate Bruno into existing IDEs and terminals for a cohesive development experience.
* Use the plain-text file storage for collections to enable easy review and diffing of API definitions in pull requests.
* Employ the variable handling capabilities to manage different environments (development, sandbox) effectively.
