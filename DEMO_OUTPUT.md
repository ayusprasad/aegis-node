# AegisNode end-to-end demo output

Generated: 2026-11-09 12:08:14 +05:30
Repository: C:\Users\ayush\Downloads\aegis-node-main\aegis-node-main

## Server startup
Next.js dev server ready at http://localhost:3000

## Direct API checks
API express: {"status":"safe","reason":"passed_all_checks"}
API @types/node: {"status":"safe","reason":"passed_all_checks"}
API crossenv: {"status":"blocked","reason":"TYPOSQUAT - Levenshtein distance 1 from \"cross-env\". Possible impersonation"}
API reactt: {"status":"blocked","reason":"TYPOSQUAT - Levenshtein distance 1 from \"react\". Possible impersonation"}
API aegisnode-zz-nonexistent-48213: {"status":"blocked","reason":"HALLUCINATED"}
API express-router-util: {"status":"blocked","reason":"HALLUCINATED"}

## Proxy test matrix (safe installs use --ignore-scripts)
### 1. express - safe real install
`node packages/cli/dist/bin/proxy.js install express --ignore-scripts`
```text

added 65 packages, and audited 66 packages in 3s

30 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

[AegisNode] Intercepting npm install - evaluating 1 package(s)...
  ✓ express → safe

[AegisNode] All 1 package(s) verified safe. Proceeding...
```
Exit code: 0

### 2. react - exact match safe
`node packages/cli/dist/bin/proxy.js install react --ignore-scripts`
```text

added 1 package, and audited 67 packages in 2s

30 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

[AegisNode] Intercepting npm install - evaluating 1 package(s)...
  ✓ react → safe

[AegisNode] All 1 package(s) verified safe. Proceeding...
```
Exit code: 0

### 3. @types/node - scoped package safe
`node packages/cli/dist/bin/proxy.js install @types/node --ignore-scripts`
```text

added 2 packages, and audited 69 packages in 2s

30 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

[AegisNode] Intercepting npm install - evaluating 1 package(s)...
  ✓ @types/node → safe

[AegisNode] All 1 package(s) verified safe. Proceeding...
```
Exit code: 0

### 4. express@4.18.2 with -D - safe
`node packages/cli/dist/bin/proxy.js install -D express@4.18.2 --ignore-scripts`
```text

added 7 packages, removed 4 packages, changed 28 packages, and audited 72 packages in 2s

13 packages are looking for funding
  run `npm fund` for details

7 vulnerabilities (3 low, 1 moderate, 3 high)

To address all issues, run:
  npm audit fix

Run `npm audit` for details.

[AegisNode] Intercepting npm install - evaluating 1 package(s)...
  ✓ express → safe

[AegisNode] All 1 package(s) verified safe. Proceeding...

npm warn idealTree Removing dependencies.express in favor of devDependencies.express
```
Exit code: 0

### 5. crossenv - local blocklist blocked
`node packages/cli/dist/bin/proxy.js install crossenv --ignore-scripts`
```text

[AegisNode] Intercepting npm install - evaluating 1 package(s)...
  ✗ crossenv → MALICIOUS - Typosquat of cross-env - known malware, steals env vars

[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package 'crossenv' flagged as MALICIOUS - Typosquat of cross-env - known malware, steals env vars. Do not attempt to install this package.
```
Exit code: 1

### 6. reactt - TYPOSQUAT blocked
`node packages/cli/dist/bin/proxy.js install reactt --ignore-scripts`
```text

[AegisNode] Intercepting npm install - evaluating 1 package(s)...
  ✗ reactt → TYPOSQUAT - Levenshtein distance 1 from "react". Possible impersonation

[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package 'reactt' flagged as TYPOSQUAT - Levenshtein distance 1 from "react". Possible impersonation. Do not attempt to install this package.
```
Exit code: 1

### 7. nonexistent package - HALLUCINATED blocked
`node packages/cli/dist/bin/proxy.js install aegisnode-zz-nonexistent-48213 --ignore-scripts`
```text

[AegisNode] Intercepting npm install - evaluating 1 package(s)...
  ✗ aegisnode-zz-nonexistent-48213 → HALLUCINATED

[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package 'aegisnode-zz-nonexistent-48213' flagged as HALLUCINATED. Do not attempt to install this package.
```
Exit code: 1

### 8. API off + fake cached entry - offline blocked
`node packages/cli/dist/bin/proxy.js install aegisnode-demo-offline-48213 --ignore-scripts`
```text

[AegisNode] Intercepting npm install - evaluating 1 package(s)...
  ✗ aegisnode-demo-offline-48213 → MALICIOUS - DEMO_OFFLINE_BLOCK

[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package 'aegisnode-demo-offline-48213' flagged as MALICIOUS - DEMO_OFFLINE_BLOCK. Do not attempt to install this package.
```
Exit code: 1

### 9. API off + clean package - fail-open allowed
`node packages/cli/dist/bin/proxy.js install is-number --ignore-scripts --no-save`
```text

added 1 package, and audited 73 packages in 1s

13 packages are looking for funding
  run `npm fund` for details

7 vulnerabilities (3 low, 1 moderate, 3 high)

To address all issues, run:
  npm audit fix

Run `npm audit` for details.

[AegisNode] Intercepting npm install - evaluating 1 package(s)...
  ✓ is-number → safe

[AegisNode] All 1 package(s) verified safe. Proceeding...
```
Exit code: 0

### 10a. npm -v - pass-through
`node packages/cli/dist/bin/proxy.js -v`
```text
11.19.1
```
Exit code: 0

### 10b. npm install with no package - pass-through
`node packages/cli/dist/bin/proxy.js install --ignore-scripts`
```text

removed 1 package, and audited 72 packages in 1s

13 packages are looking for funding
  run `npm fund` for details

7 vulnerabilities (3 low, 1 moderate, 3 high)

To address all issues, run:
  npm audit fix

Run `npm audit` for details.
```
Exit code: 0

### 11. README example express-router-util - HALLUCINATED
`node packages/cli/dist/bin/proxy.js install express-router-util --ignore-scripts`
```text

[AegisNode] Intercepting npm install - evaluating 1 package(s)...
  ✗ express-router-util → HALLUCINATED

[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package 'express-router-util' flagged as HALLUCINATED. Do not attempt to install this package.
```
Exit code: 1

### 12. crossenv and mongose - explicit/cache blocks
`node packages/cli/dist/bin/proxy.js install crossenv mongose --ignore-scripts`
```text

[AegisNode] Intercepting npm install - evaluating 2 package(s)...
  ✗ crossenv → MALICIOUS - Typosquat of cross-env - known malware, steals env vars
  ✗ mongose → MALICIOUS - Typosquat of mongoose - data exfiltration

[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package 'crossenv' flagged as MALICIOUS - Typosquat of cross-env - known malware, steals env vars. Do not attempt to install this package.
[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package 'mongose' flagged as MALICIOUS - Typosquat of mongoose - data exfiltration. Do not attempt to install this package.
[AEGISNODE SECURITY OVERRIDE]: 2 packages were blocked. Review your package requirements and use only verified, well-established packages.
```
Exit code: 1

## Notes
Safe-install sandbox: C:\Users\ayush\AppData\Local\Temp\aegis-demo-sandbox-cfbe55b0
All real installs in this demo used --ignore-scripts; blocked cases never spawned npm.
Next.js stdout: C:\Users\ayush\Downloads\aegis-node-main\aegis-node-main\.local\demo-next.stdout.log
Next.js stderr: C:\Users\ayush\Downloads\aegis-node-main\aegis-node-main\.local\demo-next.stderr.log
