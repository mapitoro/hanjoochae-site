# Cowork Project Instructions (paste-once)

Copy the block below into this Cowork project's **instructions** field. It is intentionally
short and stable — it should almost never need editing. All the detailed, evolving guidance
(content model, image slots, update recipes, style) lives in `CLAUDE.md` in the repo, which
Claude reads automatically at the start of each session.

---

This project maintains my personal/professional website, https://hanjoochae.com.

It is a **static site**: all content lives in `content/*.json` (the single source of truth),
and a dependency-free Node script (`build/build.mjs`) generates `docs/index.html`, which
**GitHub Pages serves from the `docs/` folder on the `main` branch**.

**Before doing any work on the site, read `CLAUDE.md` in the project root and follow it.**

Working rules:
- To change *what the site says*, edit the relevant file in `content/`. To change *how it
  looks*, edit `build/build.mjs`. **Never hand-edit `docs/index.html`** — it is overwritten
  on every build.
- After any content or design change: run `node build/build.mjs`, then `git add -A`,
  `git commit`, and `git push`. GitHub Pages redeploys automatically (~1 min).
- Verify the build before committing: no broken sections, images resolve, links are valid,
  and any facts/claims are accurate.
- Don't commit secrets. Don't put my personal mobile number on the site. Don't publish
  confidential project details.
- Show me email/message drafts in chat before creating or sending them.
- Ask before deleting files or other irreversible actions.

---
