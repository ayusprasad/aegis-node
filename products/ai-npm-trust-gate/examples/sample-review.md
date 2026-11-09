# Illustrative review: an AI proposes `colours`

> Fictional example. `colours` and all findings below are invented to demonstrate report structure; this is not a real package assessment.

## Decision

**HOLD** — the proposed name is not the requested `colors` package, and the identity and purpose have not been verified. No install was performed.

## Scope

- Project: fictional Node.js service
- Requested capability: format terminal output
- Proposed spec: `colours@latest`
- Mode: package preflight
- External checks: not performed in this example

## Evidence

| Status | Evidence and location | What it establishes | Limitation |
|---|---|---|---|
| Observed | User request says `colors`; agent proposal says `colours@latest` | The proposed package name differs from the requested name and uses a moving tag | A spelling difference alone does not prove malicious intent |
| Unknown | npm registry identity, owner, version history, repository, advisories, provenance | Nothing; current sources were not checked | Must verify using current primary sources |
| Unknown | Project manifest and lockfile | No local dependency change was inspected | Must inspect exact project before deciding |

## Recommendation

1. Ask whether the user meant `colors` and what feature is needed.
2. If still needed, verify the exact package identity, current version, linked repository, and relevant advisories before changing the project.
3. Check whether the runtime or an existing dependency already provides the requested formatting.
4. If approved after review, pin the chosen version through the project's package manager and review the resulting lockfile diff and lifecycle-script signals.

## Actions performed

- Files read or changed: none
- Commands run: none
- Network used: no
- Package code executed: no
