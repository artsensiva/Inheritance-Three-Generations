# Contributing

## Setup
Node 22.12+ (`.nvmrc`). `npm ci`, then `npm run dev`. Before opening a pull request run `npm run build` and `npm test`.

## Workflow
* Work on a branch from `main` (for example `feat/…`, `fix/…`, `docs/…`); do not push to `main` directly.
* Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`).
* Open a pull request; CI must be green before merging. Prefer squash or rebase merges to keep history linear.

## Content changes
Events live in `src/content/events_*.ts`; see "Editing content" in the README. New events need at least one option that is always selectable, and `npm run simulate` / `npx tsx scripts/dominance.ts` should stay clean. Please keep the fictional-setting rule: no claims about real demographic probabilities or history.

## Out of scope
Accounts, payments, multiplayer, cloud saves, analytics and live AI generation are deliberately not part of this project.
