# AGENTS.md — Onboarding for AI agents in `reality2-ai.github.io`

This is the entry point for any AI agent (Claude Code, Codex, Cursor, …) working in this
repository. **Read this first, then `RESUME.md`** for live working state.

> **Orientation in one paragraph.** This is the **public Reality2 website** — the source that
> deploys to **reality2.ai** via GitHub Pages. It is a public GitHub repository: **everything you
> commit here is world-readable**, immediately and permanently. Treat every change as a publishing
> decision. Keep strictly to **public website facts**. Do not import internal project state, roadmap
> detail, pilot/customer specifics, device internals, or fleet mechanics into this repo.

## 1. Publishing gates — hard rules, no exceptions

Anything committed here can be read by anyone, and git history outlives any later edit. Before you
write or commit content, clear it against every gate below:

- **No pilot or community names in public content.** The first pilot deployment — its location, the
  community, any partner or customer name — stays **unnamed**. Refer to such work only in generic,
  abstract terms.
- **Withheld cultural-language content is a human publish-gate — NOT AI-substitutable.** Some
  cultural-language content, and some place/community naming, is deliberately withheld from this
  public repo pending review by a **qualified human reviewer from the relevant community**. Do
  **not** generate, translate, approve, or restore such content for the public pages on your own
  judgement; it is kept in local-only files and never committed here. When in doubt, use the English
  equivalent and leave the withheld content parked for review.
- **Public brand is Mariko.** The public-facing commercial brand is **Mariko**. Use it for
  public product naming.
- **Scrub git history before any visibility flip.** If content moves from private to public, the git
  *history* — not just the current HEAD — must be scrubbed of withheld terms and sensitive names.
  A squash-to-public is the normal shape; never publish unreviewed history.
- **Roy is the publish gate.** Public-content decisions are Roy's to make. Surface them and stop;
  never self-approve a publish, a merge, or a visibility change.

## 2. Machine-enforced guards — expect them, don't fight them

This repo has automated content-hygiene guards. They are deliberate; do not disable or work around them.

- **CI:** `.github/workflows/content-hygiene.yml` fails any push/PR whose tracked files contain a
  withheld term. The match pattern is base64-encoded inside the workflow *on purpose* — the guard
  must not itself publish the terms. Decode locally to review; there is no allowlist by design.
- **Local pre-push hook** (untracked, per-worktree) blocks pushing withheld terms, any `*local-history*`
  ref, and matching commit messages/patches. A blocked push is the guard doing its job — **stop and
  escalate**, do not brute-force past it.

If a push you believe is legitimate is blocked, STOP and report to the supervisor with the commit
sha. A guarded push is completed only with Roy's explicit, per-change authorization.

## 3. Authority — where R2 facts come from

The canonical source of truth for all Reality2 behaviour and terminology is **`../r2-specifications`**.
This repo *presents* Reality2 to the public; it does not define it. When a public claim depends on a
technical fact, verify it against the specs rather than inventing or paraphrasing from memory.

## 4. Working principles

- **Citation discipline.** Don't fabricate facts, figures, or product claims. If it isn't grounded in
  the specs or already-public material, don't publish it.
- **The cheaper honest move.** If you're unsure whether something is safe to publish, leave it out
  and ask. Un-publishing is expensive; not-yet-publishing is free.
- **Autonomy stop.** STOP before committing anything that touches a gate in §1, and surface it to Roy.
- **Shared worktree.** A companion agent may edit this same working tree. Use **named `git add`
  only** (never `git add -A`/`.`), coordinate file ownership, and **re-Read a file immediately before
  editing** it — the tree may have changed under you.

## 5. Deploy & layout

- **Deploy:** GitHub Pages builds from **`main`**, served at **reality2.ai** (CNAME; the
  `reality2-ai.github.io` host 301s there). A push to `main` auto-deploys in ~1 minute.
- **Working state** lives in **`RESUME.md`** — read it for the current branch, task, and any parked
  or gated work before you start.
