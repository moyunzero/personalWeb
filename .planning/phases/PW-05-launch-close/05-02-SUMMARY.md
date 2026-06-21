# 05-02 Summary — Webmaster UAT (Google/Bing)

**Status:** partial (Baidu skipped; Rich Results pending)  
**Date:** 2026-06-21  
**Requirements:** LAUNCH-04 (partial), LAUNCH-05 (pending)

## User attestation

- **Google Search Console** + **Bing Webmaster Tools**: user approved (2026-06-21)
- **百度**: explicitly skipped by user
- **Rich Results Test (3 URLs)**: not confirmed in this session

## Doc updates

- `docs/WEBMASTER-SUBMISSION.md` — Baidu HTML meta + `verify:prod` runbook (prior commit)

## UAT

- `04-UAT.md` test 11 → pass (Google+Bing; Baidu skipped)
- `04-UAT.md` test 12 → pending (Rich Results)
- `05-UAT.md` created

## Production fix (same session)

Home sections invisible: `HomeMotion` + `client:visible` on null island never hydrated; fixed in `fix(home): show sections when HomeMotion island fails to hydrate`.
