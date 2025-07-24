# Integrating GitHub Copilot Chat with SAP AI Core in BAS

## Background & Motivation

Business Application Studio (BAS) is exploring the option of moving from Joule-based AI assistance to a more customizable, open-source approach using GitHub Copilot Chat.
The goal is to add SAP AI Core as a provider, supporting custom models and MCP (Model-Connected Plugins) tool-calling for domain-specific developer workflows (e.g., CAP, Fiori).
This will allow richer AI capabilities, tighter SAP integration, and enterprise-level controls.

---

## Core Research Tasks & Future Work

### 1. SAP AI Core Provider and Extension Architecture

- [X] Understand Copilot Chat OSS architecture and LLM provider plug-in points.
- [X] Implement basic SAP AI Core provider and integrate into Copilot (currently file based credentials - ai-core-creds.json)
- [ ] Refactor provider to support streaming responses for real-time AI chat (currently responses are not streamed).
- [ ] Support/Test more models in Agent mode (e.g. anthropic is not fully supported in agent mode. Need to verify what is supported by orchestration API).
- [ ] Token counting and metering - `orchestration` service provides `getTokenUsage()` which provides token usage details, including `total_tokens`, `prompt_tokens`, and `completion_tokens`.
- [ ] Add integration/unit tests for core Copilot provider logic.
- [ ] Refactor for robust logging, diagnostics, and error transparency (for troubleshooting).

### 2. Secure Cloud and BAS Integration

- [ ] Upgrade BAS to 1.103.0 and verify 0.30.0 version of copilot there - In Progress
- [ ] Ensure credential usage (ai-core-creds.json direct file) is feature-toggled and only available in local/dev.
- [ ] In BAS production, ensure **all** AI Core API calls are routed via the `/llm` BAS proxy endpoint - How to do it?
    - [ ] Build a library like `gai-core`, seperated from the genie concept that will execute http requests in order to get specific deployment deployment and request completion. This will involve in parsing messages per each provider (e.g. openai payload is different from anthropic). We can avoid doing that by potentially use the SAP AI Core SDK - but this is not currently possible.
    - [ ] There is a concept of client proxy registry in **python** SDK see [here](https://help.sap.com/doc/generative-ai-hub-sdk/CLOUD/en-US/_reference/prompt-registry.html#initialize-the-client-to-interact-with-the-prompt-registry) and [here](https://github.wdf.sap.corp/AI/generative-ai-hub-sdk/blob/main/gen_ai_hub/proxy/core/proxy_clients.py) and example of registring [bas python client proxy](https://github.tools.sap/BTP-AI-Gen-EngSrv-India/generative-ai-hub-sdk-testcase/blob/basClient/bas_client.py) but this does not exist in javascript SDK. Opened [feature request](https://github.com/SAP/ai-sdk-js/issues/881) to AI Core  


### 3. Tool Calling / MCP Workflow

- [X] Test end-to-end tool call flow:
    - User asks a question.
    - Model emits tool call (function) in response.
    - Tool executes (e.g., MCP “weather”, CAP actions).
    - Model resumes conversation with results.
- [X] Test with real MCP integration for CAP project creation
- [ ] Test with other SAP-specific scenarios. (Fiori MCP etc.)
- [ ] Ensure Copilot gracefully handles tool errors, user cancellations, or partial tool results.
- [ ] Validate for multiple sequential/parallel tool calls.
- [ ] Deliver Example MCP?

### 4. Forking & Upstream Sync Strategy

- [ ] Create a proper GitHub fork of Copilot Chat OSS to allow for long-term maintainability and easier upstream syncs (similar to how “Continue AI” was handled).
- [ ] Add documentation (`FORK_NOTES.md`) on how to:
    - [ ] Rebase and merge from upstream.
    - [ ] Track local changes (especially SAP AI Core provider).
    - [ ] Apply/undo BAS-specific patches or toggles.

## Advanced

- [ ] Explore UI/UX customizations for Copilot Chat in BAS (branding, feedback links, etc).
- [ ] Implement telemetry to track extension adoption and usage (opt-in, privacy-compliant).
- [ ] See here for gaps from original genie concept - https://github.wdf.sap.corp/devx-wing/bas-mcp-server/blob/main/discussions.md 

---

## Example Code References

- **bas-mcp-server** https://github.wdf.sap.corp/devx-wing/bas-mcp-server
- **cline-joule** - https://github.com/eliavamar/Joule - Adjustments to Cline
- **continue-light-ide** - https://github.com/idantrorg/continue/commits/light-ide/ 

---


