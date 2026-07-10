---
name: "Bruno"
description: "A fast, git-friendly open-source API client that stores collections directly as folder structures."
category: "clients-debugging"
lifecycleStages: ["development"]
url: "https://usebruno.com"
pricing: "freemium"
---

## What is Bruno?

Bruno is an open-source, Git-native API client that supports REST, GraphQL, gRPC, and Websocket protocols. It stores API collections as plain text files, enabling integration with version control systems and local-first operation without cloud syncing. The tool is designed to work with existing developer environments and processes.

## Why use it in the API Lifecycle?

* **Git-native collection storage**: API collections are stored as plain text files, allowing them to be managed and version-controlled using Git or other version control systems.
* **Multiple protocol support**: The client supports interactions with various API protocols, including REST, GraphQL, gRPC, and Websocket.
* **Local-first data handling**: All user data is stored locally on the machine, with no cloud synchronization, login, or account concept.
* **Extensible open-source architecture**: As an open-source tool, Bruno is designed for extensibility and can be customized or contributed to by the developer community.
* **Integration with existing permissions**: Leverages existing Git-based permissions and controls, such as role-based access and audit logs, for scalable security and access management.

## Best Practices

* Manage API collections within a version control system like Git, treating them as code files for better collaboration and tracking.
* Co-locate API collections with their relevant codebase to enhance discoverability and maintain a logical source of truth.
* Utilize existing Git permissions and controls to automatically manage access and security for API configurations within the tool.
* Be mindful that all data remains local and sharing of collections requires intentional actions via Git or other file transfer methods.
