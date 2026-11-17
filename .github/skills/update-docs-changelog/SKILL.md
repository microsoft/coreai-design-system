---
name: update-docs-changelog
description: 'Update dated documentation changelog notes for a PR targeting main, including maintenance-only changes. No documentation version bump is needed.'
---

# Update documentation changelog

Before opening or updating a PR targeting `main`, inspect the full proposed
change and preserve unrelated edits. Add or update a concise section in
[apps/docsite/CHANGELOG.md](../../../apps/docsite/CHANGELOG.md)
using `## Description - YYYY-MM-DD`. Describe meaningful changes across the PR.
For maintenance-only work, say so without implying product changes.

Keep historical notes. Reuse an existing section for the same PR; no PR number
or semantic documentation version is required. Multiple descriptive sections
may share a date. Component package release notes remain separate.

Do not bump the component package for documentation or maintenance changes.
The build stamps one UTC `lastUpdated` timestamp into the site metadata, footer,
and published skill, then hashes the actual skill bytes. Do not edit generated
timestamps or synchronize source version labels.

Run the focused checks appropriate to the change and follow create-pr quality
checks. Include the dated changelog summary and actual validation results in
the PR description. This skill does not open PRs, create tags, or deploy.
