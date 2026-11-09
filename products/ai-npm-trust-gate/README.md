# AI npm Trust Gate

An agent skill for reviewing npm dependencies proposed by AI coding agents. It covers a proposed package, a dependency manifest/lockfile change, and first-response triage when an installed package looks suspicious.

## Included

- `SKILL.md`: the cross-agent workflow and decision rules.
- `scripts/audit-npm-lock.mjs`: a read-only, offline scanner for npm manifests and lockfiles.
- `references/`: evidence standards, incident triage, and a copy-ready report format.
- `examples/sample-review.md`: an illustrative report showing evidence, uncertainty, and a practical decision.

## Use

Load this folder as an agent skill, then ask for a specific review, for example:

> Use AI npm Trust Gate to assess whether we should add `example-package` for the requested feature. Do not install it.

For a local static scan, use Node.js 18 or later:

```text
node scripts/audit-npm-lock.mjs --dir <project-root>
node scripts/audit-npm-lock.mjs --dir <project-root> --json
```

The script supports npm `package-lock.json` lockfile versions 1, 2, and 3, plus `npm-shrinkwrap.json` in the same formats. It is deliberately offline and read-only. Older lockfile formats may omit lifecycle-script metadata. It does not inspect package source, contact npm, check advisories, run code, or replace a security review.

## Boundaries

This skill provides software supply-chain triage, not a security certification or incident-response service. It does not claim that a package is safe because it is popular, old, signed, or free of known advisories. Verify time-sensitive claims against current primary sources and retain uncertainty in the report.
