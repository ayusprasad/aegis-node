# Evidence and decision guide

Use concrete, version-specific evidence. State what was checked, where it came from, and when it was observed. Separate observed facts from interpretation.

## Evidence tiers

- **Project evidence:** exact manifest and lockfile entries, the dependency diff, repository config, CI install workflow, and package lifecycle metadata. Quote a file and line when available.
- **Publisher and registry evidence:** npm's exact package/version page and metadata, the repository URL linked by the publisher, release tags, and published provenance/signatures. Confirm that package, version, repository, source commit, and workflow refer to one another.
- **Independent security evidence:** version-specific OSV or GitHub Security Advisory records; official maintainer/security notices; OpenSSF Scorecard for repository practices. Verify whether an advisory affects the exact locked version.

If a source cannot be reached, mark it **not checked** or **unverified**. Never fabricate source results, freshness, download counts, maintainer history, or attestations.

## Interpret signals carefully

- **Exact name and scope:** a one-character difference from a known package is a reason to hold and verify ownership, not standalone proof of malicious intent.
- **Recent publication or maintainer change:** useful context for targeted review; neither establishes malice by itself.
- **Install-time script flag:** identifies code that may execute during installation. Inspect the actual script and its call chain; the flag alone is not a malicious verdict.
- **Lockfile integrity:** helps bind an install to an artifact. It does not prove that the artifact is benign.
- **npm provenance/signatures:** can support claims about publisher, source, and build workflow. Their presence does not prove source code is harmless; absence is not proof of compromise.
- **Downloads, stars, age, and Scorecard:** weak or contextual signals. Do not use them as a substitute for package identity, version-specific advisories, source review, or provenance checks.
- **No advisory found:** report “no matching advisory found in the sources checked as of [date]”, never “no vulnerabilities” or “safe”.
- **URL/Git/file/workspace/custom registry source:** identify the exact source and pinning. Treat unfamiliar or mutable sources as HOLD until verified against the user's dependency policy.

## Decision thresholds

### BLOCK

Use only when there is strong, relevant evidence: a verified malware/compromise notice affecting the exact package/version; clear package impersonation supported by source/ownership evidence; or malicious behavior confirmed in the code that would run. Link the evidence and state its affected versions and dates.

### HOLD

Use when identity, version, source ownership, lockfile consistency, install-time behavior, or current evidence cannot be established. Make the next verification step specific. “Unknown” is a valid result.

### PROCEED WITH GUARDRAILS

Use only after confirming exact identity, version/source, project need, and relevant evidence. Name residual risks and controls, such as exact version pinning, reviewed lockfile, least-privilege CI, restricted install scripts, or a disposable environment. This is not a guarantee.

### NO NEW PACKAGE NEEDED

Use when the requested capability already exists in the runtime or an existing maintained dependency, and adding another package has no demonstrated benefit.

## Required report discipline

1. Label each statement **Observed**, **Interpretation**, or **Unknown** when the distinction could affect the decision.
2. Link external evidence and provide an observation date. Cite local paths and line numbers where available.
3. Describe package/version, registry/source, lockfile status, lifecycle behavior, and applicable advisories.
4. State which checks were not possible. Avoid unbounded trust scores and “safe/clean” claims.
5. Distinguish reviewing from changing the project. List every command that was run and whether it wrote files or executed package code.

## Primary references

- npm lockfile fields and versions: https://docs.npmjs.com/files/package-lock.json.html
- npm lifecycle scripts: https://docs.npmjs.com/using-npm/scripts.html
- npm provenance viewing and signature verification: https://docs.npmjs.com/viewing-package-provenance/
- OSV query/API documentation: https://google.github.io/osv.dev/api/
- GitHub Security Advisories: https://docs.github.com/en/code-security/security-advisories
- OpenSSF Scorecard: https://scorecard.dev/

Use current documentation if behavior may have changed. A reference link is a starting point, not evidence that a specific package passed a check.
