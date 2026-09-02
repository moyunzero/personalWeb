# Scripts (CLI tooling)

## Overview

Node ESM scripts for blog workflow, SEO quality gates, performance audit, and production smoke checks. Shared logic lives in `scripts/lib/`. These run at build time or in CI, never in the browser bundle.

## Key files

| File | Owns |
|---|---|
| `scripts/notion-sync.mjs` | Notion database → Markdown + images |
| `scripts/listening-sync.mjs` | Notion listening DB → `content/listening/*.json` + optional `public/audio/listening/*.mp3` (Piper TTS) |
| `scripts/lib/listening-tts.mjs` | Soft-fail Piper + ffmpeg mp3 synthesis |
| `.github/workflows/listening-sync.yml` | Manual `workflow_dispatch` sync (Node 22, Python 3.12, ffmpeg, `piper-tts==1.7.0`) |
| `scripts/seo-audit.mjs` | Build gate: frontmatter and category validation |
| `scripts/new-post.mjs` | Scaffold a new post in `content/posts/` |
| `scripts/prepare-threejs-assets.mjs` | Source HDR/planets → `public/threejs-assets/web/` (+ cosmos budget; leaves `web/spectacle/` alone) |
| `scripts/prepare-spectacle-assets.mjs` | Shark source → `public/threejs-assets/web/spectacle/pyjama-shark/` (≤2.5 MB) |
| `scripts/check-cosmos-assets.mjs` | Build/CI gate: cosmos `web/` files + spectacle pack present and under their budgets |
| `scripts/lib/site-config.mjs` | Canonical `SITE` object (origin, basePath, url) |
| `scripts/lib/legacy-spa-paths.mjs` | Canonical legacy SPA banned path lists (Vitest fixture re-exports) |
| `scripts/lib/legacy-spa-import-guard.mjs` | Shared resolved path helpers for Vitest scan and ESLint rule |
| `scripts/lib/post-schema.mjs` | Zod schema for Content Collections |
| `scripts/lib/meta-rules.mjs` | SEO audit rules |
| `scripts/run-perf-audit.mjs` | Lighthouse CI wrapper |
| `scripts/verify-production.mjs` | Post deploy smoke against live URLs |
| `scripts/seo-index-check.mjs` | Post deploy crawl readiness + optional GSC URL Inspection |
| `scripts/lib/seo-index-check-lib.mjs` | Pure helpers for seo-index-check (unit tested) |

## Commands

```bash
yarn notion:sync              # incremental sync
yarn notion:sync --all        # full resync
yarn notion:sync --dry-run    # preview only
yarn listening:sync           # incremental listening JSON sync (manual; not in yarn build)
yarn listening:sync --all     # full resync + orphan JSON/mp3 cleanup (D-13)
yarn listening:sync --dry-run # preview only
yarn seo:audit                # run gate (also runs before build)
yarn seo:meta-batch --dry-run # report meta gaps
yarn seo:index-check          # crawl readiness; optional GSC with credentials
yarn lint                      # ESLint (src/, tests/, root configs)
yarn assets:cosmos            # regenerate web/ cosmos textures from assets/threejs-source/
yarn assets:cosmos:check      # verify committed web/ files (also first step of yarn build)
yarn assets:spectacle         # regenerate web/spectacle shark glTF from assets/spectacle-source/
yarn perf:audit               # Lighthouse (starts preview if needed)
yarn verify:prod              # live site smoke
```

## Conventions

- Notion env vars load from `.env.local` / `.env` for **Node CLIs only** (never `PUBLIC_` / `VITE_` / `import.meta.env` client prefixes):
  - Blog: `NOTION_TOKEN`, `NOTION_DATABASE_ID` (optional `NOTION_DATA_SOURCE_ID`, `NOTION_PROP_*`).
  - Listening (`yarn listening:sync` / `.github/workflows/listening-sync.yml`): Actions and local both require `NOTION_TOKEN`, `NOTION_LISTENING_DATABASE_ID`, and `NOTION_DATABASE_ID` (reuse the blog DB id secret for SYNC-03 dual-DB inequality only — never query the blog DB). Optional: `NOTION_LISTENING_DATA_SOURCE_ID`, `NOTION_LISTENING_PROP_*` (title/date/status/youtube), `NOTION_LISTENING_STATUS_DONE` (CSV, default `完成`). Never expose Notion keys as `PUBLIC_*`.
- Piper TTS is **OS/pip tooling**, not a yarn dependency (D-07). Local/CI install: `pip install 'piper-tts==1.7.0'`, `python3 -m piper.download_voices en_US-amy-medium --data-dir "${PIPER_DATA_DIR:-$HOME/.cache/piper}"`, plus system `ffmpeg`. Optional env: `PIPER_DATA_DIR`, `PIPER_VOICE` (default `en_US-amy-medium`).
- **D-10 (Phase 3 obligation):** `/listening/` page footer must attribute Piper voice `en_US-amy-medium` (CC BY-SA). UI is not in Phase 2 — document only here until Phase 3 ships the footer.
- `yarn listening:sync` is **manual** (local or Actions `listening-sync.yml` `workflow_dispatch`). It is **not** part of `yarn build` / `ci.yml` / `deploy.yml` (D-14).
- Legacy `generate-static.mjs` was removed; do not reintroduce a SPA static generator.
- `yarn build` = `check-cosmos-assets` then `seo:audit` then `astro build`. Use `build:astro` only to skip gates intentionally.
- Cosmos source textures live in `assets/threejs-source/` (gitignored); only commit `public/threejs-assets/web/` derivatives.
- Spectacle shark source lives in `assets/spectacle-source/` (gitignored); only commit `public/threejs-assets/web/spectacle/` derivatives (≤2.5 MB hard cap).
- `yarn seo:index-check` is local only (not CI). Optional env: `GOOGLE_APPLICATION_CREDENTIALS`, `GSC_SITE_URL`, `PRODUCTION_URL`. Flags: `--sample N`, `--strict` (unindexed or GSC errors fail). Never commit service account JSON.

## Agent skills

- Pending install (GitHub timeout): `intellectronica/agent-skills@notion-api` for Notion API sync patterns
- MCP servers: Notion (`https://mcp.notion.com/mcp`, recommended) for live workspace access while editing sync scripts

## Gotchas

- `NOTION_TOKEN` must never ship in the frontend bundle; listening secrets stay in `.env.local` / Actions secrets for the sync CLI only.
- Never introduce Notion keys under client-exposed env prefixes (`PUBLIC_`, `VITE_`, Astro `PUBLIC_*`).
- Do not add `piper-tts` to `package.json`; keep voice onnx under gitignored cache (D-09).
- `VITE_CHAT_API_URL` is public in the client; no secrets there.
- SEO audit errors block `yarn build` with exit code 1.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
