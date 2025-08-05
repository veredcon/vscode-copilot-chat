# Integrating GitHub Copilot Chat with SAP AI Core in BAS

## Background & Motivation

Business Application Studio (BAS) is exploring the option of moving from Joule-based AI assistance to a more customizable, open-source approach using GitHub Copilot Chat.
The goal is to add SAP AI Core as a provider, supporting custom models and MCP (Model-Connected Plugins) tool-calling for domain-specific developer workflows (e.g., CAP, Fiori).
This will allow richer AI capabilities, tighter SAP integration, and enterprise-level controls.

---

## Core Research Tasks & Future Work

### 0. Enable activation of GitHub Copilot in BAS (1.102.3 + copilot 0.29.1) - without even our changes.

### 1. SAP AI Core Provider and Extension Architecture

- [X] Understand Copilot Chat OSS architecture and LLM provider plug-in points.
- [X] Implement basic SAP AI Core provider and integrate into Copilot (currently file based credentials - ai-core-creds.json)
- [ ] Implement the provider to use AI Core SDK API calls are routed via the `/llm` BAS proxy endpoint - Use directly ai-core-sdk javascript and use custom destination that is registered programatically - look here for details: https://github.com/SAP/ai-sdk-js/issues/881 
- [ ] Extract the implementation from the patch of copilot to a seperate extension like in the sample provided here so the LLM provider will be contribted from an extension- https://github.com/microsoft/vscode-copilot-chat/pull/315 (only works from 1.103.0 of VSCode) - This will be relevant for both BAS and Local VSCode. - Check if the same provider can work for both BAS (with /llm) and Local VSCode (when supplying key) - or we must to split to 2 extensions. (based on bas-sdk). Think if needed to enhance bas-sdk for this scenario. We don't need to implement the scenario for local at this point - only to check if we can differentiate between the two in runtime.
- [ ] Ability to set default: e.g. Agent + specific model from SAP AI Core Provider (remove other providers, filter models from the instance according to some "white list") - needs to auto register specific models (with one selected by default). How to determine which "default" model will be relevant for each scenario? - Is this configuration of default model can be decided at runtime (e.g. by reading some configuration) or it is static content e.g. in package.json. 
- [ ] Refactor provider to support streaming responses for real-time AI chat (currently responses are not streamed) - use streaming API from AI Core SDK javascript.
- [ ] Support/Test more models in Agent mode (e.g. anthropic is not fully supported in agent mode. Need to verify what is supported by orchestration API) - initiate meeting/issue/discussion with AI Core.
- [ ] Token counting and metering - `orchestration` service provides `getTokenUsage()` which provides token usage details, including `total_tokens`, `prompt_tokens`, and `completion_tokens`
    - Understand how our BAS proxy for metering works and understand how to maintain it - we will still add custom headers to the request of specific model + genie name="Vibe Coding".
    - Investigate ability to categorize different API calls (e.g., analysis, file generation, file read) and assign weights to them in order to support usage profiling and pricing decisions.
- [ ] Add integration/unit tests for core Copilot provider logic.
- [ ] Refactor for robust logging, diagnostics, and error transparency (for troubleshooting).

### 2. Secure Cloud and BAS Integration

- [ ] Upgrade BAS to 1.103.0 and verify 0.30.0 version of copilot there - In Progress (or 1.102.2 and copilot 0.29.1)
- [ ] Remove the current credential usage (ai-core-creds.json direct file).
 
### 3. Tool Calling / MCP Workflow

- [X] Test end-to-end tool call flow:
    - User asks a question.
    - Model emits tool call (function) in response.
    - Tool executes (e.g., MCP “weather”, CAP actions).
    - Model resumes conversation with results.
- [X] Test with real MCP integration for CAP project creation
- [ ] Register default MCPs in file ~/Library/Application Support/Code/User/mcp.json (need to define how to get MCP list per dev space type) - **As part of simple extension framework contribute different MCP.** like we write vscode settings today. Extensions will contribute not only the MCP itself but also the MCP configuration itself. Maybe a new section of MCP server.
- [ ] Verify that BAS env vars are propegated to the registered MCP tools and if not, modify the code to propegate them (as we don't want to configure them in the mcp.json configuration file).
- [ ] Test with other SAP-specific scenarios. (Fiori MCP etc.)
- [ ] Ensure Copilot gracefully handles tool errors, user cancellations, or partial tool results.
- [ ] Validate for multiple sequential/parallel tool calls. 

### 4. Forking & Upstream Sync Strategy & Delivery

- [ ] Create a proper **GitHub fork of Copilot Chat OSS** to allow for long-term maintainability and easier upstream syncs (similar to how “Continue AI”/"OpenVscode" was handled).
- [ ] Add documentation (`FORK_NOTES.md`) on how to:
    - [ ] Rebase and merge from upstream.
    - [ ] Track local changes/"patches" (especially SAP AI Core provider).
    - [ ] Apply/undo BAS-specific patches or toggles.
- [ ] Add cenetral pipeline to the forked GitHubCopilot Code OSS.
- [ ] Deliver the **GitHub Copilot OSS** extension as part of joule-core (excluded in private cloud) - requires PM approval. 
- [ ] **VSCode Chat model provider**
    - Release the new VSCode extension in a gen-ai-tools repository
    - Deliver it as part of joule-core  

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


