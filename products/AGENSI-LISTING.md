# Agensi listing draft — AI npm Trust Gate

## Title

AI npm Trust Gate — Review AI-Proposed Dependencies Before Install

## Short description

Evidence-backed preflight for AI-suggested npm packages, lockfile changes, install scripts, and suspected dependency incidents.

## Category

Security (secondary fit: Code Quality & Review)

## Suggested launch price

**$19 one-time** for the multi-file skill, scanner, references, and example. This is a launch hypothesis, not a promised market price. Agensi's current creator guide recommends roughly $12–$25 for comprehensive multi-file skills and suggests new creators consider a free skill first to build installs and reviews. Review the price after actual usage and buyer feedback.

At a $19 sale price and a 70% creator share of net price, the creator share is about $13.30 per sale before any taxes or payout-specific costs. Reaching $3,000 in creator share would take about **226 sales** at that price. A $3,000 single-file price is not supported by the marketplace's published examples or pricing guide.

## Listing description

AI coding agents can suggest a package that is misspelled, unnecessary, unverified, or capable of running code during installation. AI npm Trust Gate gives you a repeatable review before that dependency enters your project.

Use it to assess a proposed npm package, review `package.json` and `package-lock.json` changes, or triage a dependency that may already have executed. The skill checks exact package identity, project need, registry and source resolution, lockfile integrity, install-script exposure, version-specific advisories, provenance evidence, and CI blast radius. It returns a clear BLOCK, HOLD, PROCEED WITH GUARDRAILS, or NO NEW PACKAGE NEEDED decision with links and explicit unknowns.

Includes a small Node.js 18+ scanner for npm lockfiles (offline, read-only), an evidence and decision guide, an incident triage checklist, a report template, and an illustrative review. The scanner does not install packages, run scripts, contact the network, or claim that a dependency is safe.

Works as a tool-agnostic workflow in compatible coding agents. Current web research requires an agent with browsing or equivalent network research available; if that is unavailable, the skill marks those checks unverified.

The workflow is standalone and does not require the AegisNode CLI or a hosted service. It is informed by the open-source AegisNode project: https://github.com/ayusprasad/aegis-node

## What's included

- Cross-agent `SKILL.md` workflow
- Read-only Node.js scanner for npm lockfile versions 1–3
- Evidence standards and decision thresholds
- Suspected-compromise triage guide
- Copy-ready report template and illustrative sample

## Keywords

npm security, AI coding agents, dependency review, supply chain security, package-lock, typosquatting, install scripts, provenance, JavaScript security

## Creator note

Do not claim certification, guaranteed prevention, or that the skill replaces a dedicated security tool or incident-response professional. Use “helps review” and show the included offline scanner's exact limits.

## Launch post

AI coding agents can move from “add this package” to a real dependency change in one step. I built AI npm Trust Gate to put an evidence-backed review in between: exact package identity, lockfile changes, install-script exposure, provenance, advisories, and what remains unknown. It includes a read-only offline npm lockfile scanner and a suspected-compromise checklist. No package install or script execution during review. Feedback welcome: [Agensi listing link]
