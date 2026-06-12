# RESUME — reality2-ai.github.io (public website)

> Working-state notes for this repo. Public website repo — keep to
> public website facts only; no internal/working context beyond the site.

## Repo
- **Branch:** `main` (tracks `origin/main`)
- **State:** clean / up to date
- **Deploy:** GitHub Pages from `main`, served at reality2-ai.github.io (CNAME). Pushes auto-deploy in ~1 min.

## Current task
✅ **COMPLETE** — Reviewed all pages + `mesh.js`. All changes committed and
pushed to `origin/main`. No active task in progress.

### Done this session
- Conformance badge: dropped hardcoded `110/110` → "Conformance" (commit `506fd11`).
- Conformance badge: added hover `title` + `aria-label` pointing at the live (browser-computed) pass count (commit `567480a`). Verified live on site.
- Verified all 6 "Built with R2" card links return 200; badges accurate.
- r2-hive "Live" → relay.reality2.ai confirmed correct.
- r2-anthill card: Source → public `anthill` (intentional; reviewed).
- RESUME.md now tracked + pushed; `.gitignore` repurposed for OS junk.
- about/how review (commit `5137da4`): fixed `how.html` WASM size 70KB → 290KB
  (live asset ~300KB); added `role="main"` + focus-visible outlines to about.html
  and how.html for a11y parity with index.html.
- Verified deployed site renders correctly: all three pages serve HTTP 200 (fresh,
  CDN age 0), markup tag-balanced, and headless-Chrome screenshots confirm
  index/about/how display correctly with the 290KB fix visible.
- mesh.js review (commit `906dc9c`): fixed packet-array memory leak (dead packets
  now compacted out each tick); fixed heartbeat return-pulse setTimeout units
  (frames→200ms); cached the per-frame bg gradient; added a missing-canvas guard.
  Syntax-checked + headless-rendered clean (no console errors, mesh displays).

### Next steps / open
- **mesh.js #2 (deferred):** dead nodes + clusterMeta accumulate (grow ~6 per
  ~25-60s) and are never freed. Riskier fix — edges/packets/heartbeats reference
  nodes by array index, so needs dead-slot reuse, not splicing. Do as its own pass.

## Notes
- Files: `index.html`, `about.html`, `how.html`, `mesh.js`, `CNAME`.
