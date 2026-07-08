---
name: "Bruno"
description: "A fast, git-friendly open-source API client that stores collections directly as folder structures."
category: "clients-debugging"
lifecycleStages: ["development"]
url: "https://usebruno.com"
pricing: "open-source"
---

## What is Bruno?

Bruno is a lightweight, open-source API client designed to challenge legacy tools like Postman. It stores collections directly as markup files in a folder structure on your filesystem.

## Why use it in the API Lifecycle?

* **Git Friendly**: Unlike proprietary sync clouds, Bruno collections are text files. You commit them to Git, enabling seamless code review and merge conflict resolution.
* **Privacy & Control**: Stores requests locally on your machine. No mandatory cloud sync or login requirements.
* **Ergonomic Markup**: Uses its own human-readable markup language (`Bru`) to declare request parameters, assertions, and test scripts.

## Best Practices

* Create a `collections/` folder directly inside your application repository so team members can run API requests locally via Bruno.
