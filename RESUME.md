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
- mesh.js node/cluster leak (commit `2cc1b45`): added `compactNodes()` — a
  reindexing pass that frees dead nodes/clusters and remaps all index references
  (edge i/j + edgeMap, packet/heartbeat paths, clusterGroup); runs each lifecycle
  event. Verified with a stubbed-DOM harness (16k frames): node count stabilises
  at 53, clusters cap at 7, alive==total (no accumulation). Headless render clean.
- WCAG AA contrast audit (commits `e803a07`, `6c50309`): measured every text/bg
  pair across all 3 themes. Fixes: dark secondary text on about/how brought to
  homepage parity (text-dim → #a8a49e); text-faint lifted to AA on all pages
  (dark #817b75 4.61:1, light #6f6b66 4.73:1, was 2.6-3.3:1); light accent
  unified on darker #7a5c18 (5.57:1) so body links pass AA (replaced homepage's
  #a07828 3.61:1). Per Roy's design decisions. Light theme render-verified.

- Social/SEO metadata (commit `9d77d70`): added favicon.svg (gold hexagon mark),
  og-image.png (1200x630 branded card matching the hero), and per-page canonical,
  theme-color, Open Graph + Twitter summary_large_image tags across all 3 pages.
  Closes the blank-tab-icon + no-link-preview gap. Assets + tags verified live.

- sitemap.xml + robots.txt (commit `1ef41f5`): robots allows all + points to
  sitemap; sitemap lists the 3 pages with lastmod/changefreq/priority. Both live
  (200, correct content-types).
- JSON-LD structured data + logo (commit `06ef6a1`): index has Organization +
  WebSite @graph (logo, sameAs→GitHub); about/how have WebPage nodes linking the
  homepage @ids. logo.png = 512x512 gold-hexagon brand tile. All validated as
  parseable JSON and verified live.

### Next steps / open
- Nothing pending — pages + mesh.js reviewed (both memory leaks fixed), full WCAG
  AA contrast pass, social/SEO metadata, sitemap/robots, and JSON-LD all done + live.
- Backlog ideas (unstarted): broader keyboard-nav / screen-reader pass.

## Notes
- Files: `index.html`, `about.html`, `how.html`, `mesh.js`, `CNAME`.
