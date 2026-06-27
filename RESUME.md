# RESUME — reality2-ai.github.io (public website)

> Working-state notes for this repo. Public website repo — keep to
> public website facts only; no internal/working context beyond the site.

## Repo
- **Branch:** `main` (tracks `origin/main`)
- **State:** clean / all work committed + pushed + live-verified.
- **Current HEAD:** run `git log -1 --oneline`; RESUME-only handoff commits may
  follow the content commits listed below, so this file does not embed its own
  final commit hash.
- **Deploy:** GitHub Pages from `main`, served at reality2.ai (CNAME; the
  `reality2-ai.github.io` host 301s there). Pushes auto-deploy in ~1 min.
- **Two agents share this worktree** (`website` + `website-codex`): named adds
  only, coordinate file ownership, re-Read before editing. The audit batch
  split cleanly — `website-codex` did the article-page responsive nav
  (`4ac496f`); `website` did the completeness assets + index pass (`a63ce92`,
  `3e200ef`) and the article-page metadata pass (`9143584`). Held (neither
  touches): product cards, WASM/r2-core provenance, mission/vision copy.

## Current task
✅ **COMPLETE + PUSHED + LIVE** — Audit-driven public-site improvement batch
(perf / a11y / SEO / security / completeness-PWA / cross-page consistency). A
7-dimension audit produced 45 findings; every mechanical fix landed across both
agents (`a63ce92`, `3e200ef`, `4ac496f`, `9143584`) and is live-verified on
reality2.ai. Design/content calls deferred to Roy (see "Open for Roy"). The
article-nav sub-task detail follows.

### Article-page mobile nav (website-codex, `4ac496f`)
Article-page mobile nav overflow fixed. At 360px,
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
- Watchdog verification on 2026-06-28 after the full merged audit batch:
  - `git fetch origin && git status --short --branch` showed clean
    `main...origin/main`.
  - Local static checks passed: JSON-LD parses, manifest parses, no duplicate
    IDs, article pages contain `menu-toggle`, `aria-expanded` reset,
    `id="nav-menu"`, and `<main id="main">`.
  - `git diff --check` passed.
  - Live paths returned 200: `/`, `/about.html`, `/how.html`,
    `/built-by-a-fleet.html`, `/404.html`, `/favicon.ico`, `/manifest.json`,
    `/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png`, `/og-image.png`,
    `/logo.png`, `/mesh.js`, `/sitemap.xml`, `/robots.txt`.
  - Bogus path `/definitely-not-a-real-r2-page-final-check` returned 404 with
    the custom themed 404 body.
  - Live article pages contain hamburger markup plus `twitter:image:alt`,
    JSON-LD `inLanguage`, and `<main id="main">` markers.
- Cross-provider takeover check on 2026-06-28:
  - `git status --short --branch` showed clean `main...origin/main` at
    `ad00471`.
  - `git diff --name-status` showed no changed files.
  - Local static takeover checks passed: JSON-LD parses, `manifest.json` parses,
    no duplicate IDs, and article pages contain hamburger, `aria-expanded`
    reset, `<main id="main">`, `twitter:image:alt`, and JSON-LD `inLanguage`.
  - `git diff --check` passed.
  - No active implementation task found; remaining items are Roy decisions or
    low-priority deferred technical work.

### Changed files this turn
- `about.html`: added mobile hamburger CSS/markup for the article nav.
- `how.html`: added the same article-nav mobile hamburger. Did **not** touch the
  held WASM/r2-core provenance content.
- `built-by-a-fleet.html`: added the same article-nav mobile hamburger.
- `RESUME.md`: updated this durable handoff.
- Not part of this commit: `website`'s PWA/asset/index audit, already landed in
  `a63ce92` and `3e200ef`.
- Not part of the article-nav commit, but now landed: `website`'s article
  metadata pass in `about.html`, `how.html`, and `built-by-a-fleet.html`
  (`9143584`; referrer/icon/manifest tags, twitter image alt, `inLanguage`,
  theme-color sync, main landmark, reduced-motion tweak).

### website audit batch (commits `a63ce92`, `3e200ef`, `9143584`) — LIVE
- Completeness assets: branded 3-theme `404.html` (noindex; unmatched paths
  serve it with HTTP 404 — verified), `manifest.json` + `icon-192/512`,
  `apple-touch-icon.png` (180), `favicon.ico` (16/32/48), `.nojekyll`.
- Image optimization: og-image 201->150KB (dropped unused alpha on an opaque
  card), logo 67->43KB (lossless).
- index.html + all 3 article pages, parity pass: fonts.gstatic preconnect;
  unified italic-axis Google Fonts URL (fixed faux-italic); referrer policy;
  twitter:image:alt; JSON-LD inLanguage:en; theme-color + toggle aria-label
  synced to the active theme on load + toggle; favicon.ico/apple-touch/manifest
  wired in `<head>`.
- Landmarks: index `<main>` extended to wrap all sections (skip-link was
  skipping most of the page); article pages wrapped in a real `<main>` while
  keeping `<article>` for its CSS. og:type article->website on the 3 pages.
- mesh.js perf: DPR clamp to 1.5 + squared-distance reject in the O(n^2)
  repulsion loop (no visual change). sitemap lastmod refreshed.
- Page-specific: built-by-a-fleet breathe reduced-motion override now wins
  (!important); how.html diagram role=img moved onto the `<table>` so its two
  caption sentences re-enter the a11y tree.

### Open for Roy (deferred — design/content decisions, not changed)
- **Hero fade-word contrast**: index H1 "Disappears" fades to ~7% opacity
  (fails WCAG 1.4.3 on heading text) — signature aesthetic, left as-is. Option:
  raise the gradient's terminal opacity so it still fades but stays legible.
- **Footer wording**: inconsistent across pages ("...Source specifications and
  code available soon." vs the short form). Pick one to unify.
- **Self-host fonts**: currently every visitor's IP/UA hits Google Fonts, which
  sits oddly with the privacy positioning. Bigger change; recommended.

### Deferred technical (recommended, not yet done)
- Extract shared inline CSS into one cached `styles.css` (duplicated across 4
  pages). mesh.js per-frame gradient pre-baking (visual-risk; left for a
  careful pass). Meta CSP (limited value via `<meta>`; inline handlers need
  'unsafe-inline'). All low priority.

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
