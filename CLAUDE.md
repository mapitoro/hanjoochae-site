# Personal Website — Claude Playbook

This is Han Joo Chae's personal/professional website (https://hanjoochae.com).
Claude maintains it. This file tells you how. **Read it fully before editing.**

## Core principle: content and design are separate

- **Content lives in `content/*.json`** — this is the single source of truth.
- **Design/layout lives in `build/build.mjs`** (HTML template + inline CSS).
- The site is **generated**, not hand-edited. Never edit `docs/index.html` directly —
  it is overwritten on every build.

To change *what the site says* → edit a JSON file in `content/`.
To change *how it looks* → edit `build/build.mjs`.

## Repository layout

```
content/      JSON content (source of truth) — edit here
build/        build.mjs generator
docs/         BUILD OUTPUT, served by GitHub Pages (/docs on main) — never hand-edit
orig_sources/ local-only master media (image/video originals + CV master) + INVENTORY.md; gitignored
archive-weebly-*.zip   compressed old Weebly export; gitignored (local backup)
COWORK-PROJECT-INSTRUCTIONS.md   paste-once text for the Cowork project field
```

Committed to git: `content/`, `build/`, `docs/`, and the markdown docs. `orig_sources/` and
the archive zip are gitignored (kept locally only). The CV is **not published** on the site
(no download link) for privacy — the master stays in `orig_sources/` and is sent on request.
When adding a new image, optimize it (P3→sRGB, long edge ≤1600px) and write the result into
`docs/assets/img/` — that's what ships. See `orig_sources/INVENTORY.md` for the master→shipped
mapping.

## How to build

```bash
node build/build.mjs
```

This regenerates `docs/index.html` (+ `CNAME`, `.nojekyll`, and copies the CV into
`docs/assets/`). No dependencies, no `npm install` — plain Node.

## How to deploy

The site is served by **GitHub Pages from the `docs/` folder** on the `main` branch.
After editing content and rebuilding, commit and push:

```bash
node build/build.mjs
git add -A
git commit -m "Update <what changed>"
git push
```

GitHub Pages redeploys automatically within ~1 minute. See `README.md` for one-time
setup (repo, Pages settings, custom domain DNS).

## Content model (`content/`)

| File | What it holds |
|------|---------------|
| `profile.json` | Name, title, company, tagline, `pov` (hero statement), `summary`, email, links, highlight stats, keywords, `photo`, `speakingPhoto`, `speakingVideo` (YouTube URL → embeds) |
| `featured.json` | **Array** of flagship case-study modules, rendered top-to-bottom in the Impact section. Keep the **current** role first (`"current": true`) so the site leads with where Han Joo works now. Each case: `label` (eyebrow, e.g. "Now · Current Role"), `title`, `org`, `role`, `years`, `lead`, `blocks` (Problem/Approach/Impact), `metrics`, optional `certifications` (region+date chips), optional `gallery` (image+caption), optional `video` (YouTube URL → embedded below gallery), `partners`, `links`, `heroImage`/`heroVideo` |
| `proof.json` | Credibility band: `partners`, `spokeAt`, `featuredIn` (rendered as wordmark chips) |
| `experience.json` | Career roles (newest first). Dates as `YYYY-MM`; use `"present"` + `"current": true` for the current role |
| `education.json` | Degrees |
| `projects.json` | Ventures & research below Impact. `"featured": true` → image card (e.g. Kai Health); `false` → compact text under "Research roots" (no visuals — keeps research understated). Oncosoft & ROKIT live in `featured.json`, not here |
| `publications.json` | Papers (newest first); optional `link` (DOI/IEEE) makes the title a link |
| `patents.json` | Granted patents (newest first) |
| `talks.json` | Invited talks. Date as `YYYY-MM` |
| `teaching.json` | Teaching engagements |
| `awards.json` | Awards & honors |
| `press.json` | Press / media coverage with external URLs |

(Earlier `perspectives.json` and `news.json` sections were removed — recreate them and re-add their sections to `build/build.mjs` only if that content is revived.)

After editing any file, **always run the build** so `docs/` reflects the change.

## Images & video (`docs/assets/img/`)

Image fields in the JSON point at files under `docs/assets/img/`. **If the file is
missing, the build renders a labeled placeholder** (no broken images) — so the layout
always looks intentional. Drop the real file at the path and rebuild to swap it in.

| Slot (path) | Where it appears | Suggested |
|-------------|------------------|-----------|
| `assets/img/profile.jpg` | Hero portrait | Clean headshot, ~4:5 |
| `assets/img/oncosoft-pipeline.jpg` | Oncosoft case hero | Wide 16:9 platform/workflow graphic |
| `assets/img/oncosoft-studio.jpg` | Oncosoft gallery | OncoStudio product screenshot |
| `assets/img/oncosoft-booth.jpg` | Oncosoft gallery | Conference booth / commercial presence |
| `assets/img/rokit-hero.jpg` | ROKIT case hero | Wide 16:9 — tablet wound-capture shot |
| `assets/img/rokit-modeling.jpg` | ROKIT gallery | Wound scan + 3D model |
| `assets/img/rokit-patch.jpg` | ROKIT gallery | 3D-printed patch |
| `assets/img/rokit-application.jpg` | ROKIT gallery | Patch application in OR |
| `assets/img/kai.jpg` | Kai Health venture card | Vita Embryo product UI, ~16:10 |
| `assets/img/speaking.jpg` | Speaking section | 16:9 stage photo (or set `profile.speakingVideo` to a YouTube URL) |

Keep images web-sized (long edge ≤ ~1600px). Any YouTube URL in a `*Video` field is
auto-embedded; otherwise the matching image/placeholder is used.

**Video in a case (`featured.json`):**
- `heroFit: "contain"` — show the hero image whole, with padding (use for diagrams/screenshots like the Oncosoft pipeline, so it isn't cropped).
- `demoVideo: "assets/img/x.mp4"` — short loop, rendered autoplay + muted + loop (e.g. the OncoStudio screen capture).
- `localVideo` + `poster` + `videoCaption` — longer clip, rendered with controls and a poster image (e.g. the ROKIT procedure).
- `video` — a YouTube URL (embedded as a fallback if no local video).

Self-hosted `.mp4` files live in `docs/assets/img/`. Compress before committing
(H.264, ~1280px wide, a few MB) with ffmpeg, e.g.
`ffmpeg -i in.mp4 -vf scale=1280:-2 -c:v libx264 -crf 28 -preset veryfast -movflags +faststart out.mp4`.
GitHub Pages serves mp4 fine; keep files small (single-digit MB) for fast loads.


## Standard update procedures

When the user asks for any of the following, follow these steps. Always confirm the
parsed details with the user before committing if anything is ambiguous.

### "I published a new paper" / "update my publications"
1. If given a Google Scholar link, fetch it and find papers not already in
   `publications.json` (profile's Scholar: see `profile.json` → `links.scholar`).
2. Add new entries to the **top** of `publications.json` with
   `authors`, `year`, `title`, `venue`, `type` ("Conference" | "Journal").
3. Optionally add a `news.json` entry announcing it.
4. Build, commit, push.

### "I have a new patent"
1. Add to the top of `patents.json`: `{ "id", "year", "title" }`.
2. Build, commit, push.

### "I changed jobs" / "I got promoted"
1. In `experience.json`: set the previous current role's `"end"` to the end month
   and remove `"current": true`. Add the new role at the **top** with
   `"end": "present"` and `"current": true`.
2. Update `profile.json` → `title`, `company`, and `summary` if needed.
3. Add a `news.json` entry.
4. Build, commit, push.

### "My CV is updated"
1. Drop the new CV PDF into `orig_sources/` (local master; **not published**).
2. Reconcile any new facts into the relevant `content/*.json` files so the site stays in
   sync with the CV.
3. Build, commit, push.

(The CV is intentionally **not** offered as a public download — privacy. To re-enable a
download button, set `"cv": "assets/Han-Joo-Chae-CV.pdf"` in `profile.json` with the PDF in
`orig_sources/`; the build then copies and links it.)

### "I gave a talk" / "add a press mention"
- Talk → add to `talks.json`. Press mention → `press.json`.
- Build, commit, push.

## Style & voice guidance
- The positioning is **medical-AI executive** (CTO / Head of Global Business), not
  "researcher." Lead with leadership, commercial impact, and regulated global launches;
  research credentials support that story.
- Keep copy concise, factual, and metric-driven. Avoid hype adjectives.
- English is the primary site language.
- Do not publish confidential project details (e.g., internal Samsung projects that were
  never made public). When in doubt, ask before adding.

## Things NOT to do
- Don't edit `docs/index.html` by hand.
- Don't put the personal mobile number (or other private contact details) on the site.
- Don't commit secrets.
