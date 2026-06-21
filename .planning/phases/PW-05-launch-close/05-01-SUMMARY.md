# 05-01 Summary — Ship Astro v1.0 to GitHub Pages

**Status:** complete  
**Date:** 2026-06-21  
**Requirements:** LAUNCH-03

## What shipped

- Committed full Astro v1.0 implementation (Phases 1–4): `9fe4bc2`
- Added `scripts/verify-production.mjs` + `yarn verify:prod` (4 live checks + `--skip-network` dist mode)
- Pushed `master` → GitHub Actions **Deploy static content to Pages** green (`27908319071`)
- CI fix: Node 22 required for `@astrojs/react@5` (`1a574ef`)

## Verification

| Gate | Result |
|------|--------|
| `yarn build && yarn seo:audit && yarn test:uat:4` | pass (pre-push) |
| `yarn test tests/verify-production.test.ts` | 3 passed |
| `yarn verify:prod` (live) | **0 error(s)** |

Production now serves Astro SSG (zh-CN home), not legacy React SPA.

## Live URLs confirmed

- Home: https://moyunzero.github.io/personalWeb/
- Google verify: https://moyunzero.github.io/personalWeb/googleef60eaecd43955c6.html
- Bing verify: https://moyunzero.github.io/personalWeb/BingSiteAuth.xml
- Sitemap: https://moyunzero.github.io/personalWeb/sitemap-index.xml

## Notes

- First deploy failed on Node 20 engine check; resolved with Node 22 in `deploy.yml`.
- Baidu `baidu_verify_*.html` not yet in repo — tracked in 05-02.
