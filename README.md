# milome.github.io

This public repository is the GitHub Pages deployment repository for `https://milome.github.io/`.

## Source Repository

The source code and content editing workflow live in the private repository `milome/kbase-content-engine`.

This repository does not contain source code and does not build the site from source. It deploys audited static artifacts published by the private source repository.

## Deployment Model

Normal release flow:

1. `milome/kbase-content-engine` builds the site from private source.
2. The private workflow audits `dist/` to block source files, private plans, dependency manifests, `.codex` content, sourcemaps, environment files, and secret-like values.
3. The private workflow publishes the audited `dist/` output to the public `pages-dist` branch.
4. The private workflow sends `repository_dispatch` with event type `deploy-pages-dist`.
5. This repository deploys `pages-dist` to GitHub Pages using `.github/workflows/deploy-dist.yml`.

Rollback flow:

1. `pages-dist-lkg` stores the previous known-good public artifact branch state.
2. `.github/workflows/rollback-pages-dist.yml` can restore `pages-dist` from `pages-dist-lkg`.
3. Rollback supports dry-run validation before executing the branch update.

## Public Branches

- `master`: README and deployment workflows only.
- `pages-dist`: audited static site artifact for GitHub Pages deployment.
- `pages-dist-lkg`: previous known-good artifact state for rollback.

## Operational Rule

Do not use this repository as the day-to-day source editing entry point. Make source changes in `milome/kbase-content-engine`, run the private publish workflow, and let this public repository deploy the resulting artifact.
