# npm dependency incident triage

Use this when a package may already have been installed or executed. This is a conservative first-response checklist, not a substitute for an incident-response team.

## Stabilize and preserve

1. Stop importing, invoking, rebuilding, or reinstalling the suspected package. Do not run its binaries or scripts to “see what happens.”
2. Record the project, package name and exact version, source/registry, discovery time, installation time if known, machine/user context, and whether install scripts ran. Separate confirmed facts from estimates.
3. Preserve the current `package.json`, lockfile, relevant CI job logs, package-manager output, and timestamps. Avoid deleting `node_modules`, caches, shell history, or logs before the owner decides what evidence must be retained.
4. Do not copy tokens, `.npmrc` auth values, environment values, or private logs into the report. Record whether credentials were present and their scope without exposing their values.

## Scope possible execution

- Check the lockfile for the exact version and source; check registry metadata and advisories for version-specific reports.
- Inspect the package's `preinstall`, `install`, `postinstall`, and `prepare` behavior where source is available. Also consider transitive packages, Git dependencies, and the package manager/CLI version and flags.
- Establish whether installation scripts were allowed and whether install, build, test, or application startup actually executed the package. Do not infer execution from presence alone.
- Identify affected developer machines, CI runners, deployment builds, and the credentials each could access during the relevant window.
- If evidence is insufficient, keep the case at HOLD and preserve data; do not overstate compromise.

## Contain and recover with the owner

- If a credential could have been read by executed code, recommend revoking/rotating it from a known-clean device or environment. Prioritize npm publishing tokens, cloud credentials, CI tokens, source-control tokens, signing keys, and deployment secrets according to actual exposure.
- Pause affected automation or isolate a runner only with the system owner's authorization and operational context.
- After evidence preservation, prepare a minimal removal/replacement plan, regenerate the lockfile from a trusted source, review the diff, and rebuild from a clean environment. Do not silently mutate the project.
- Keep incident communications factual: package/version, evidence, exposure window, affected assets, actions taken, remaining unknowns, and owner.
- Use the registry/hosting provider's current reporting channel for confirmed malicious packages. Do not publish unverified accusations.

## Handoff format

Provide a short timeline, known affected systems, evidence preserved, whether code executed, credential exposure assessment, actions proposed versus already authorized, and the next owner decision. Never claim “contained” until the relevant systems and credentials have been checked.
