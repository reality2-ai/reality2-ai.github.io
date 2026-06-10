# RESUME — reality2-ai.github.io (public website)

> Working-state notes for this repo. Public website repo — keep to
> public website facts only; no internal/working context beyond the site.

## Repo
- **Branch:** `main` (tracks `origin/main`)
- **State:** clean / up to date
- **Deploy:** GitHub Pages from `main`, served at reality2-ai.github.io (CNAME). Pushes auto-deploy in ~1 min.

## Current task
✅ **COMPLETE** — Accuracy + accessibility review of all pages (`index.html`,
`about.html`, `how.html`). All changes committed and pushed to `origin/main`.
No active task in progress.

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

### Next steps / open
- Nothing pending — all pages reviewed, working tree clean.

## Notes
- Files: `index.html`, `about.html`, `how.html`, `mesh.js`, `CNAME`.
