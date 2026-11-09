# CHANGES.md - Log of Changes & Architectural Fixes

This document records all modifications made to transform the downloaded AegisNode repository into a robust, completely runnable local Windows setup.

---

### 1. Fallback to Bundled `blocklist.json` in CLI Cache Utility
- **File**: `packages/cli/src/cache/blocklistCache.ts`
- **Reason**: When the user hasn't yet executed `aegisnode init` or when running offline without the Next.js dev server up, the cache utility encountered a fetch error for `DEFAULT_BLOCKLIST_URL` and returned an empty list (`[]`). This caused known malicious packages like `crossenv` to bypass local layer-1 protection and mistakenly fall open as safe.
- **Change**: Added `loadBundledBlocklist()` which falls back to resolving `blocklist.json` directly from the repository root when both the local cache file and remote endpoint are unavailable.

### 2. Local Environment & Node Runtime Setup
- **File**: `.local/node-v24.22.1-win-x64`
- **Reason**: The host system environment lacked global `node` and `npm` binaries registered in the system/user PATH.
- **Change**: Provided a standalone, zero-installation portable Node v24.22.1 runtime in `.local/node-v24.22.1-win-x64` with scripts prepending it to `PATH` dynamically for tests and local executions.

### 3. Windows Command Shims (`local-bin`)
- **Files**:
  - `scripts/local-bin/aegisnode.cmd`
  - `scripts/local-bin/aegisnode-proxy.cmd`
- **Reason**: On Windows systems with strict group policies or restricted execution rights, standard symlink creation via `npm link` often fails.
- **Change**: Added direct Windows batch shims in `scripts/local-bin` that invoke `node packages/cli/dist/bin/aegisnode.js` and `proxy.js` with all arguments passed through without symlink dependencies.

### 4. Automated End-to-End Orchestrator Script
- **File**: `scripts/demo.ps1`
- **Reason**: Needed an autonomous, reproducible single-command test harness to start the Next.js dev server, test all API routes, run the full 12-test proxy matrix in an isolated `%TEMP%` sandbox, record real terminal output, and clean up processes.
- **Change**: Implemented `scripts/demo.ps1` to automate the entire test verification lifecycle cleanly without leaving orphaned servers or mutating repository files.

### 5. Local URL Defaulting and Offline Testing
- **Files**:
  - `packages/cli/src/cache/blocklistCache.ts`
  - `packages/cli/src/evaluator/heuristicEvaluator.ts`
- **Reason**: Replaced hardcoded remote GitHub / cloud placeholders with local configurable defaults via `AEGISNODE_API_URL` (default `http://localhost:3000/api/verify`) and `AEGISNODE_BLOCKLIST_URL` (default `http://localhost:3000/blocklist.json`), with optional cache path overrides via `AEGISNODE_CACHE_PATH`.

### 6. Top-1000 Packages Dataset
- **File**: `apps/web/src/data/top-npm-packages.json`
- **Source**: Public npm top-packages dataset supplemented by `CORE_NPM_PACKAGES` in `apps/web/src/app/api/verify/route.ts`.
- **Reason**: Ensures accurate Levenshtein distance calculations against common npm packages while avoiding false positives for exact matches (distance 0).

### 7. Local API, Blocklist Route, and Offline Defaults
- **Files**: `packages/cli/src/evaluator/heuristicEvaluator.ts`, `packages/cli/src/cache/blocklistCache.ts`, `apps/web/src/app/blocklist.json/route.ts`
- **Reason**: The downloaded project pointed the CLI at a nonexistent Vercel deployment and the blocklist at the original author’s GitHub repository.
- **Change**: Added `AEGISNODE_API_URL`, `AEGISNODE_BLOCKLIST_URL`, and test-only `AEGISNODE_CACHE_PATH` overrides. Defaults now target `http://localhost:3000/api/verify`, `http://localhost:3000/blocklist.json`, and `%LOCALAPPDATA%\AegisNode\cache.json`. The Next.js app serves the checked-in blocklist locally.

### 8. Verification API Correctness
- **File**: `apps/web/src/app/api/verify/route.ts`
- **Reason**: The original route used a hand-written sample rather than a real top-1000 package list, checked package creation time instead of latest-version publication time, returned extra response fields, and classified unpublished typosquats as generic hallucinations.
- **Change**: Added the checked-in dataset, exact-match protection, latest-version age checks, scoped-package support, clean `{ status, reason }` responses, and actionable typosquat classification.

### 9. Windows Proxy and Hook Reliability
- **Files**: `packages/cli/src/proxy/runner.ts`, `packages/cli/src/commands/init.ts`, `packages/cli/src/commands/status.ts`, `packages/cli/src/commands/uninstall.ts`, `scripts/local-bin/*`
- **Reason**: The original parser could misclassify URLs/local paths, `npm link` was blocked by this Windows policy, DOSKEY macros started with an invalid comment, status could not detect the macro, and there was no clean uninstall command.
- **Change**: Added explicit path overrides, non-registry argument pass-through, direct Windows command shims, valid DOSKEY output, profile/AutoRun backups, accurate status reporting, and reversible `aegisnode uninstall` restoration.
- **Follow-up**: Repeated `init --force` runs no longer back up an existing AegisNode hook, and uninstall ignores any legacy backup that contains the hook marker instead of restoring it.

### 10. Build and Frontend Reliability
- **Files**: `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`, `apps/web/next.config.js`, `apps/web/package.json`, `apps/web/src/app/docs/page.tsx`
- **Reason**: The web build fetched Google Fonts and failed in a network-restricted environment; Next 16’s default Turbopack worker also failed on this Windows setup, and docs advertised the old deployed URL.
- **Change**: Removed build-time Google Font fetching, switched the web scripts to webpack, configured the correct workspace root, and updated the docs to local-first configuration.

### 11. Blocklist Quality Guard
- **Files**: `packages/cli/src/cache/blocklistCache.ts`, `scripts/update-blocklist.js`
- **Reason**: The checked-in OSV dump treated every `GHSA-*` vulnerability alias as package-level malware, causing false positives for packages such as `express` and `lodash`.
- **Change**: Generic `SUPPLY_CHAIN_MALWARE_OSV` records are retained for audit provenance but excluded from actionable checks and status counts. The updater now requires explicit malware language or an `MAL-*` identifier instead of treating ordinary GHSA advisories as malware.

### 12. Reproducible Local Run Artifacts
- **Files**: `RUN_LOCAL.md`, `scripts/demo.ps1`, `DEMO_OUTPUT.md`
- **Reason**: The repository had no complete Windows local-run sequence or reproducible end-to-end evidence.
- **Change**: Added exact setup/start/stop/undo commands and a demo script that starts Next.js, calls the real npm registry/download APIs through `/api/verify`, runs safe installs only in a temp sandbox with `--ignore-scripts`, tests offline cache blocking and fail-open behavior, and records actual outputs.

### 13. Next 16 Lint Script Compatibility
- **File**: `apps/web/package.json`
- **Reason**: Next 16 removed the `next lint` command, so the original script failed with “Invalid project directory …/lint”.
- **Change**: `npm run lint` now runs the strict TypeScript check (`tsc --noEmit`), which is the repository’s available static validation in the absence of an ESLint configuration.

### 14. Accurate Protection Status
- **File**: `packages/cli/src/commands/status.ts`
- **Reason**: The original status command reported full protection when either one of the two shell hooks was present.
- **Change**: Status now distinguishes fully active, partially active, and inactive hook states.

### 15. Repository Hygiene
- **File**: `.gitignore`
- **Reason**: The web TypeScript build generated `tsconfig.tsbuildinfo`, which is local compiler cache rather than project source.
- **Change**: Ignore TypeScript build-info files so generated compiler metadata is not committed.
