# AegisNode CLI 🛡️

[![npm version](https://img.shields.io/npm/v/aegisnode-cli.svg?style=flat-square)](https://www.npmjs.com/package/aegisnode-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

> **Windows security middleware CLI** that intercepts, analyzes, and blocks malicious or hallucinated npm packages from AI coding agents.

---

## 🛑 The Problem

AI coding agents (Copilot, Cursor, Devin, Claude, etc.) frequently:
- **Hallucinate** npm package names that don't exist
- Request packages with **subtle typos** that match known malicious typosquat packages
- Get tricked into requesting **supply-chain attack packages**

When these run in automated pipelines or directly on your machine, they can install malware before any human can intervene.

## 🛡️ The Solution

AegisNode intercepts **every `npm install`** command at the shell level before the package is fetched, running it through a three-layer defense pipeline:

```
npm install <package>
       ↓
[AegisNode Proxy Intercepts]
       ↓
Layer 1: Local Blocklist Cache (zero latency, offline-capable)
       ↓
Layer 2: Cloud Heuristic API
         ├── npm registry 404 → HALLUCINATED
         ├── Published < 48h + downloads < 100 → SUSPICIOUS
         └── Levenshtein distance ≤ 2 from top-1000 pkg → TYPOSQUAT
       ↓
BLOCKED → LLM-readable stderr error, exit 1
SAFE    → Spawn real npm-cli.js (absolute path, no loop), stream I/O
```

---

## 🚀 Quick Start

### 1. Install globally
```powershell
npm install -g aegisnode-cli
```

### 2. Initialize shell hooks
```powershell
aegisnode init
```

This will:
- Inject a PowerShell function into your `$PROFILE` that routes `npm install` through the proxy
- Configure CMD `doskey` macros via the Windows registry
- Download the initial blocklist cache to `%LOCALAPPDATA%\AegisNode\cache.json`

### 3. Restart PowerShell
Close and reopen your terminal.

### 4. Verify protection
```powershell
aegisnode status
```

### 5. Test it
```powershell
# This will be BLOCKED (typosquat of cross-env):
npm install crossenv

# This will be BLOCKED (hallucinated package):
npm install express-router-util

# This will PASS:
npm install express
```

---

## 💻 CLI Reference

| Command | Description |
|---------|-------------|
| `aegisnode init` | Install shell hooks and download initial cache |
| `aegisnode init --force` | Force reinstall hooks |
| `aegisnode status` | Show current protection status |
| `aegisnode update` | Force-refresh blocklist cache from GitHub |
| `aegisnode verify <pkg>` | Manually verify a package name |

---

## 🤖 LLM Error Format

When a package is blocked, this exact format is written to `stderr` so AI agents understand and stop retrying:

```
[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package 'crossenv' flagged as TYPOSQUAT - Levenshtein distance 1 from "cross-env". Do not attempt to install this package.
```

---

## 🏗️ Security Architecture

### Infinite Loop Prevention
The proxy NEVER spawns `npm` directly. Instead it resolves the **absolute path** to `node.exe` and `npm-cli.js`, executing:
```
C:\Program Files\nodejs\node.exe "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" <args>
```
This bypasses the PowerShell/CMD aliases entirely.

### Fail-Open Design
If the API is unreachable (network issues), AegisNode defaults to **allowing** the install (fail-open), so legitimate development is never blocked by network outages. The local blocklist cache always runs first and is offline-capable.

## 📝 License

MIT © AegisNode
