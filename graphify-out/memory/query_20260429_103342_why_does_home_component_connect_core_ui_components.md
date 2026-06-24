---
type: "query"
date: "2026-04-29T10:33:42.189952+00:00"
question: "Why does Home Component connect Core UI Components to Runner & Capture Logic?"
contributor: "graphify"
source_nodes: ["Home Component", "Capture Panel", "Status Panel", "Project Context"]
---

# Q: Why does Home Component connect Core UI Components to Runner & Capture Logic?

## Answer

The Home Component acts as the central stage where Core UI (Form, Controls), Runner Logic (Status Panel, RunnerStats), and Capture Logic (Capture Panel) converge. It bridges these by direct orchestration of references and by calling shared infrastructure like the Get Patient Token API Client, as rationalized in the Project Context.

## Source Nodes

- Home Component
- Capture Panel
- Status Panel
- Project Context