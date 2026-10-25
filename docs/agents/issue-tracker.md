# Issue tracker: Local Markdown

Keep feature specs and tickets in `.scratch/`, with one directory per feature.

- Spec: `.scratch/<feature-slug>/spec.md`
- Tickets: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, one file per ticket, numbered in dependency order from `01`.
- Record each ticket's triage state in a `Status:` line near the top.

When a skill says to publish a spec or ticket, create or update the corresponding Markdown file. When it says to fetch a ticket, read the referenced file.
