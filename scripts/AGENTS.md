# Scripts (CLI tooling)

## Overview

Node ESM scripts for blog workflow, SEO quality gates, performance audit, and production smoke checks. Shared logic lives in `scripts/lib/`. These run at build time or in CI, never in the browser bundle.

## Key files

| File | Owns |
|---|---|
| `scripts/notion-sync.mjs` | Notion database → Markdown + images |
| `scripts/seo-audit.mjs` | Build gate: frontmatter and category validation |
| `scripts/new-post.mjs` | Scaffold a new post in `content/posts/` |
| `scripts/lib/site-config.mjs` | Canonical `SITE` object (origin, basePath, url) |
| `scripts/lib/post-schema.mjs` | Zod schema for Content Collections |
| `scripts/lib/meta-rules.mjs` | SEO audit rules |
| `scripts/run-perf-audit.mjs` | Lighthouse CI wrapper |
| `scripts/verify-production.mjs` | Post deploy smoke against live URLs |

## Commands

```bash
yarn notion:sync              # incremental sync
yarn notion:sync --all        # full resync
yarn notion:sync --dry-run    # preview only
yarn seo:audit                # run gate (also runs before build)
yarn seo:meta-batch --dry-run # report meta gaps
yarn perf:audit               # Lighthouse (starts preview if needed)
yarn verify:prod              # live site smoke
```

## Conventions

- Notion env vars load from `.env.local` / `.env`: `NOTION_TOKEN`, `NOTION_DATABASE_ID`.
- Legacy `generate-static.mjs` was removed; do not reintroduce a SPA static generator.
- `yarn build` = `seo:audit` then `astro build`. Use `build:astro` only to skip the gate intentionally.

## Agent skills

- Pending install (GitHub timeout): `intellectronica/agent-skills@notion-api` for Notion API sync patterns
- MCP servers: Notion (`https://mcp.notion.com/mcp`, recommended) for live workspace access while editing sync scripts

## Gotchas

- `NOTION_TOKEN` must never ship in the frontend bundle.
- `VITE_CHAT_API_URL` is public in the client; no secrets there.
- SEO audit errors block `yarn build` with exit code 1.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
