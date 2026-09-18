# RESUME — Reality2 public website

## Current work — 18 September 2026

Website and standard-reader refresh prepared locally on `main`, based on the
user's request to align the site with `r2-standard` and retire old app promotion.
**Publication authorized by Roy:** improve the website as discussed and publish when done.
Use the current Git history and GitHub Pages deployment status to verify publication.
Roy remains the publication gate for future changes in `AGENTS.md`.

The user explicitly directed that the standard remain accessible by direct link,
without exposure in main-site navigation. They selected a curated current edition
with non-normative withheld/internal notes omitted and normative requirements
preserved. No main-site or introduction links enter `/standard/`; neither subsite
is added to the sitemap. The standard and introduction carry `noindex, nofollow`.
These are discovery controls, not authentication.

## Prepared changes

- Main pages explain the shared mesh, durable membership, scoped entanglement,
  local forwarding evidence and the distinction between authentication and privacy.
- Removed old live/beta demos, WASM-size and implementation-stack claims, and the
  planned-app listing. Notekeeper, R2 Hive and Anthill link to their public archives.
  Workshop is described separately: its public repository is not marked archived.
- Replaced the Notekeeper how-to with a protocol-design introduction. Existing
  routes and the homepage `#built` anchor remain usable.
- Improved small-screen cards/branding, heading contrast, theme resilience and
  content visibility without JavaScript.
- Refreshed the standard reading edition from source revision
  `006d57a43fb936039050b123da9e4663471a4b9c`, declared version 0.9.0. It is labelled
  a working draft, not a tagged release. Added ESP-NOW, BLE and LoRa bindings.
- Disclosed editorial omissions. Numbered requirements, provisional markers and
  code/test-vector blocks are retained. Private revision messages are excluded.
- Added page contents, heading permalinks, document/glossary/clause filters,
  readable typography, accessible scrolling tables/diagrams and print styling.
- Corrected misplaced clause anchors inherited from the source renderer.

## Verification

- 1,149 numbered clause paragraphs compared with the pinned source: no unexplained
  differences after disclosed editorial-only exclusions (FORMATS 6.2 and ESP-NOW
  7.1 included). All 20 code/test-vector blocks unchanged.
- Local HTML link/fragment checks, unique IDs, JSON-LD parsing and content hygiene
  passed. No public-page link exposes the standard.
- Browser checks at 320, 390, 768 and 1440 pixels passed. All 27 standard pages
  passed the final narrow-screen check after fixing one long test-vector value.
  Dark, light and high-contrast themes, filtering, keyboard menu dismissal,
  corrected clause targets, PDF output and no-JavaScript reading also passed.
  No page overflow or JavaScript errors remained.
- `tools/README.md` documents the repeatable curation and reading-aid workflow.
  Run `python3 tools/check-site.py` and `git diff --check` before publication.

## Standing gates

- Keep withheld language and specific pilot/community/customer names out of this
  public repository. Human language review is still required for any restoration.
- The ignored local reviewer packet and local-only history branch stay local.
  Do not stage or push either. Keep both automated publishing guards enabled.
- Use the Mariko brand for commercial product naming.
- Roy has explicitly authorized publication of this batch. That authorization does
  not lift any content-hygiene or withheld-language gate.
