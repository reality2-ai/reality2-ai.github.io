# Website checks and standard reading edition

`standard/` is intended for readers given a direct link. Do not add it to the
homepage, introduction, main-site navigation, or sitemap. Its HTML carries
`noindex, nofollow`; this discourages indexing and is not access control.

The standard source renderer is maintained in `r2-standard`. Render a pinned
source revision **outside this public repository** and review its output before
importing anything. A raw export can contain non-normative material unsuitable
for this repository. Repository publishing gates still apply.

The current reading edition uses source revision
`006d57a43fb936039050b123da9e4663471a4b9c` (declared version 0.9.0), as a working
draft rather than a tagged release.

From this repository, given an already-rendered source directory:

```sh
python3 tools/curate-standard.py /tmp/standard-raw /tmp/standard-reviewed \
  --revision FULL_SOURCE_COMMIT --version DECLARED_SOURCE_VERSION
python3 tools/prepare-standard.py /tmp/standard-reviewed
```

Review the curated output and compare its numbered requirements and code/test
vector blocks with the source before copying HTML and `standard.css` into
`standard/`. The curator removes selected source notes and editorial attributions,
retains provisional markers, and replaces private revision-message history with
edition notes. Two inline editorial details in FORMATS 6.2 and the status
commentary in the ESP-NOW binding's 7.1 are also curated; protocol requirements
remain intact. The disclosure appears on every document page.

`prepare-standard.py` adds static contents links, accessible table wrappers,
page labels, indexing exclusions and the shared reading assets. It is idempotent.
Keep `standard/reader.css` and `standard/reader.js`: they are website assets, not
files from the source renderer. The text and contents links work without JavaScript;
filtering, active-section tracking and print controls progressively enhance them.

Run `python3 tools/check-site.py` for local link/fragment integrity, duplicate IDs,
metadata parsing, direct-link boundaries and the existing content-hygiene pattern.
This checks tracked and new unignored files. It supplements, never replaces, CI
and the pre-push hook. Browser checks should cover narrow screens, all themes,
filters, clause targets and printing. Content publication requires Roy's approval.
