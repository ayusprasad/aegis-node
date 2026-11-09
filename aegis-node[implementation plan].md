# SYSTEM DIRECTIVE: PROJECT AEGISNODE IMPLEMENTATION BRIEF

## 1. Context & Agent Directives
**Target Agent:** You are an Expert Software Developer and Code Architect.
**Project Name:** AegisNode
**Purpose:** A native Windows security middleware CLI and web ecosystem designed to intercept, analyze, and block autonomous AI coding agents from installing hallucinated or malicious npm packages.
**Strict Constraints:**
* **ZERO PLACEHOLDERS:** Do not use `// add logic here` or `...`. Provide complete, copy-pasteable code.
* **NO HALLUCINATIONS:** If you lack context on a specific Netlify API or Windows API interaction, explicitly state your uncertainty and request clarification.
* **ENVIRONMENT:** The execution environment is native Windows (PowerShell/CMD), NOT WSL or Linux.
* **STEP-BY-STEP:** Present your plan, summarize understanding, and ask "Do you approve this plan before I begin?" followed by "Shall I proceed?" after each phase.
* **FILE PATHS:** Provide exact file paths and line numbers for every integration.

---

## 2. Architectural Synthesis (The Stack)

AegisNode is structured as a Monorepo containing three interconnected domains:

### A. The Threat Feed (GitHub Raw)
* **Hosting:** Public GitHub Repository.
* **Format:** A static `blocklist.json` file containing known malicious package signatures.
* **Mechanism:** Acts as a zero-latency, local-cacheable database for the CLI.

### B. The Web Domain & API (Netlify + Next.js)
* **Hosting/Deployment:** Netlify.
* **Frontend:** A Next.js landing page and documentation site.
    * **Design Language:** Apple-inspired minimalism, utilizing Tailwind CSS. High-contrast, clean typography, ample whitespace.
    * **UI Constraint:** Any console, log output, or chat-style interfaces displayed on the frontend **must have strictly left-aligned text** (do not center-align log data).
* **Backend:** Netlify Edge Functions (`/api/verify`).
    * **Mechanism:** Handles dynamic heuristic lookups (querying `registry.npmjs.org` for package age, download count, and Levenshtein distance against top 1000 packages).

### C. The CLI Domain (Windows Native Node.js)
* **Environment:** Global npm package installed on Windows.
* **Interception Mechanism:** Injects a hook into the Windows PowerShell `$PROFILE` and provides a CMD `doskey` configuration to alias `npm` commands to `aegisnode-proxy`.
* **Execution:** Spawns child processes to the absolute path of the real Node `npm-cli.js` when safe, preserving `stdout`/`stderr` streaming perfectly.

---

## 3. Implementation Plan & Workflows

Agent, you must implement this project according to the following phased blueprint. 

### Phase 1: Monorepo Scaffold & Netlify Setup
1. Initialize a generic Monorepo (using Turborepo or standard npm workspaces).
2. Scaffold `packages/cli` (Node.js) and `apps/web` (Next.js).
3. Configure `netlify.toml` in the root to properly build and deploy the Next.js app to Netlify, exposing the `/api/verify` serverless function.
4. Establish the `blocklist.json` in the root repository.

### Phase 2: Serverless Heuristic Engine (Netlify API)
1. Implement the `/api/verify` endpoint.
2. **Input:** `POST` request containing `{ "package": "express-router-util" }`.
3. **Logic:**
    * Fetch metadata from `https://registry.npmjs.org/<package>`.
    * If 404, flag as `HALLUCINATED`.
    * If published < 48 hours ago AND downloads < 100, flag as `SUSPICIOUS`.
    * Check Levenshtein distance against common packages (e.g., `reactt` vs `react`).
4. **Output:** strict JSON response `{ "status": "safe" | "blocked", "reason": "..." }`.

### Phase 3: Windows Interception Hook (The Proxy)
1. In `packages/cli`, build the initialization script (`aegisnode init`).
2. **Windows Specifics:**
    * Detect the user's PowerShell `$PROFILE` path.
    * Append a PowerShell function: `function npm { aegisnode-proxy $args }`.
    * Ensure the proxy parser intercepts `install`, `i`, `add` commands and extracts the package names.
3. **Infinite Loop Prevention:** The proxy MUST resolve the absolute path to the system's actual Node installation (e.g., `C:\Program Files\nodejs\node.exe C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js`) to execute safe commands. Do not simply spawn `npm` from the proxy, or it will intercept itself.

### Phase 4: Local Evaluation Engine
1. Implement a caching utility in the CLI that fetches `blocklist.json` from the GitHub Raw URL once every 24 hours, storing it in `%LOCALAPPDATA%\AegisNode\cache.json`.
2. **Execution Flow:**
    * Check intercepted package against local `cache.json`. If matched -> **BLOCK**.
    * If not in cache, send lightweight fetch to `https://<your-netlify-domain>.netlify.app/api/verify`.
    * If response is `blocked` -> **BLOCK**.
    * If response is `safe` -> **PROCEED**.

### Phase 5: AI Context Preservation (Stdout/Stderr)
1. When a package is safe, use `child_process.spawn` to stream the real npm output back to the terminal so the AI agent sees standard execution.
2. When a package is **BLOCKED**, write a highly visible error to `stderr` formatted specifically for an LLM to read. 
    * Format: `[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package '${pkg}' flagged as ${reason}. Do not attempt to install this package.`
3. Exit the process with code `1`.

---
**Agent Instruction:** Please confirm your understanding of this brief, acknowledge the strict constraints regarding Windows interception and left-aligned UI text, and present your detailed plan for Phase 1. End your response with "Do you approve this plan before I begin?"