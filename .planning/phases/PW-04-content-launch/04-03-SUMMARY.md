# 04-03 Summary — 性能 + 站长文档 + 上线

**Status:** automated complete — human checkpoint pending  
**Wave:** 3

## Delivered

- Island deferral: `client:visible` / `client:idle` on home islands; GameIsland unchanged
- Font subset + async Material Symbols in `BaseLayout.astro`
- Particle count 150 → 60
- `lighthouserc.json`, `scripts/run-perf-audit.mjs`, `yarn perf:audit`
- `docs/WEBMASTER-SUBMISSION.md` + README SEO section
- `yarn test:uat:4` — vitest + phase4 e2e

## Verification

- `yarn perf:audit` — pass (3 runs, Performance ≥ 85, LCP ≤ 2500 ms)
- `yarn test:uat:4` — 20 tests pass
- `yarn build && yarn seo:audit` — pass

## Human checkpoint (LAUNCH-01)

User must submit sitemap to Google / Bing / 百度 and run Rich Results Test on 3 documented URLs. Type **approved** when done.
