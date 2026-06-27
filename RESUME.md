# RESUME — reality2-ai.github.io (public website)

> Working-state notes for this repo. Public website repo — keep to
> public website facts only; no internal/working context beyond the site.

## Repo
- **Branch:** `main` (tracks `origin/main`)
- **State:** dirty local worktree: `website` has uncommitted article metadata
  pass changes in `about.html`, `how.html`, and `built-by-a-fleet.html`;
  website-codex is committing only this RESUME live-verification handoff.
- **HEAD at live verification:** `7071d96` (`Record article navigation handoff`)
- **Content commit:** `4ac496f` (`Fix article mobile navigation`)
- **Base before content commit:** `3e200ef` (`index.html/mesh.js/sitemap: SEO, a11y, and perf audit fixes`)
- **Deploy:** GitHub Pages from `main`, served at reality2-ai.github.io (CNAME). Pushes auto-deploy in ~1 min.
- **Current file ownership:** `website-codex` owns this article-page responsive
  nav fix in `about.html`, `how.html`, and `built-by-a-fleet.html`. `website`
  landed the metadata/PWA/asset audit in `a63ce92` and `3e200ef` and will own
  the current uncommitted article metadata/a11y follow-up in `about.html`,
  `how.html`, and `built-by-a-fleet.html`. Do not edit `index.html`, `mesh.js`,
  `sitemap.xml`, root PWA/icon assets, product cards, WASM/r2-core provenance,
  mission/vision copy, or footer wording without coordination.

## Current task
✅ **COMPLETE + PUSHED** — Article-page mobile nav overflow fixed. At 360px,
`about.html`, `how.html`, and `built-by-a-fleet.html` previously rendered the
full inline nav across the fixed header, overlapping/wrapping against the logo.
Those three pages now use a compact hamburger below 640px, matching the homepage
pattern, with `aria-controls="nav-menu"` and `aria-expanded` reset when nav
links close the menu. Content commit: `4ac496f`.

### Verification this turn
- Baseline Firefox headless 360px screenshots showed article-page nav overlap:
  inline links crowded/wrapped across the logo on `about.html` and `how.html`.
- After the fix, Firefox headless screenshots at `--window-size 360,640` and
  `--window-size 320,640` for all three article pages show a clean logo +
  hamburger header with no overlap/clipping.
- `git diff --check` passed.
- Node static check passed: JSON-LD parses, no duplicate IDs, and each article
  page has `.menu-toggle`, `aria-controls="nav-menu"`, `id="nav-menu"`, and
  `nav .links.open { display: flex; }`.
- `pgrep -af firefox` returned no running Firefox processes after verification.
- Peer challenge/coordination: `website` confirmed no active edit collision,
  independently saw the same hamburger gap, assigned `website-codex` ownership
  of `about.html` / `how.html` / `built-by-a-fleet.html`, and specifically asked
  for `aria-expanded='false'` when nav links close the menu. Implemented.
- Live HTTP verification after push:
  - Core pages returned 200: `/`, `/about.html`, `/how.html`,
    `/built-by-a-fleet.html`.
  - PWA/icon assets returned 200: `/favicon.ico`, `/manifest.json`,
    `/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png`.
  - Bogus path `/definitely-not-a-real-r2-page-codex-check` returned 404 and
    served the custom themed 404 body (`This page <span>disappeared</span>`).
  - Live article pages contain the hamburger `menu-toggle` and
    `aria-expanded='false'` reset markup.

### Changed files this turn
- `about.html`: added mobile hamburger CSS/markup for the article nav.
- `how.html`: added the same article-nav mobile hamburger. Did **not** touch the
  held WASM/r2-core provenance content.
- `built-by-a-fleet.html`: added the same article-nav mobile hamburger.
- `RESUME.md`: updated this durable handoff.
- Not part of this commit: `website`'s PWA/asset/index audit, already landed in
  `a63ce92` and `3e200ef`.
- Not part of this commit: `website`'s currently uncommitted article metadata
  pass in `about.html`, `how.html`, and `built-by-a-fleet.html`
  (referrer/icon/manifest tags, twitter image alt, `inLanguage`, theme-color
  sync, main landmark, reduced-motion tweak). Leave unstaged unless
  coordinating.

### Next actions
- No further website-codex action pending on this task.
- Open design/product decisions for Roy, not changed here: hero fade-word
  contrast vs signature aesthetic; Google Fonts privacy vs self-hosted fonts.

### Previous task verification
- Homepage/how-page WASM size copy refreshed. The public HTML no longer claims
  `70KB` or `290KB`; it uses "about 300KB" / `~300KB`, matching the current live
  `/r2-notekeeper/pkg/r2_wasm_bg.wasm` asset (307,049 bytes, ~300 KiB). Content
  commit: `a66a529` (`Correct WASM size copy`); handoff commit: `047c737`.
- `git diff --check` passed.

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
- Keyboard-nav + screen-reader pass (commit `ed4c9ac`): prefers-reduced-motion
  (mesh.js renders a static frame + stops; CSS neutralises animations); theme
  toggle announces via aria-live region; hamburger aria-hidden icon + aria-controls
  → id="nav-menu". Audit confirmed clean heading order, no positive tabindex, no
  non-interactive onclick. Reduced-motion path harness-verified (no rAF, draws once).

- Canonical domain fix (commit `94b3c8f`, LIVE): all canonical/OG/Twitter/
  JSON-LD @id+url/sitemap `<loc>`/robots Sitemap + the r2-notekeeper sub-app
  links pointed at the `reality2-ai.github.io` redirect host; site actually
  serves at `reality2.ai` (CNAME; the .github.io host 301s there). Repointed
  all 43 refs to reality2.ai (verified every path incl. /r2-notekeeper/ = 200).
  Removes a redirect hop; canonical/social now resolve the real domain. Live-verified.
- "Built by a fleet" page (commit `633425d`, LIVE): public colophon —
  built-by-a-fleet.html. Concept-level only (Roy-approved go-live; reviewed for
  the public/private boundary): "a fleet of Claude AI agents as a trust group under human
  guardianship, mirroring R2". Abstract mesh visual; existing site style/themes +
  a11y/SEO. Linked from every footer + sitemap. Mechanics-scrubbed (page, footers,
  sitemap, commits, live HTML). NO fleet mechanics anywhere — keep it that way.

### Next steps / open
- Nothing pending. Public site reviewed end-to-end (accuracy, a11y, performance,
  SEO/social) + "Built by a fleet" page live. All verified.
- Parked: `design/living-terrain-hero` branch (hero redesign prototype) — hold for
  the [[mission-vision-refresh-pending]] task. `design/built-by-a-fleet` branch is
  merged; safe to delete (deliberate step).

## Notes
- Files: `index.html`, `about.html`, `how.html`, `built-by-a-fleet.html`, `mesh.js`, `CNAME`.
- Pages: built-by-a-fleet.html must stay CONCEPT-ONLY (no fleet mechanics) — public repo.
