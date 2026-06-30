# hanjoochae.com

Personal/professional website for Han Joo Chae (채한주). A static site, generated from
structured JSON content by a tiny dependency-free Node script, hosted free on GitHub Pages.

The day-to-day workflow is: **ask Claude** (in this Cowork project) to add a paper / patent /
job / talk / image, or to tweak the design. Claude edits the source, rebuilds, and pushes.
You rarely touch anything by hand.

---

## Repository layout

```
Personal Website/
├─ content/                 # ← EDIT HERE: all site text/data (JSON, single source of truth)
│   ├─ profile.json  experience.json  education.json  projects.json
│   ├─ featured.json (Oncosoft + ROKIT case studies)  proof.json
│   ├─ publications.json  patents.json  talks.json  teaching.json
│   └─ awards.json  press.json
├─ build/build.mjs          # generator: content/*.json → docs/index.html (rarely touched)
├─ docs/                    # ← PUBLISHED SITE (auto-generated; GitHub Pages serves this)
│   ├─ index.html  CNAME  .nojekyll
│   └─ assets/img/  (web-optimized images & video)
├─ CLAUDE.md                # Claude's maintenance playbook (read every session)
├─ COWORK-PROJECT-INSTRUCTIONS.md    # paste-once text for the Cowork project field
├─ README.md                # this file
├─ .gitignore
├─ orig_sources/            # local-only masters: image/video originals + CV + INVENTORY.md — gitignored
└─ archive-weebly-*.zip     # compressed old Weebly export — gitignored (local backup)
```

Only `content/`, `build/`, `docs/`, and the markdown docs are committed to git.
`orig_sources/` (large originals + the CV master) and the archive zip stay on your machine and
are excluded from the repo. The CV is **not published** on the site (no download link) for
privacy. See `orig_sources/INVENTORY.md` for the master→shipped map.

---

## Build locally

Requires Node 18+ (no packages to install).

```bash
node build/build.mjs        # regenerates docs/index.html (+ CNAME, .nojekyll, copies CV)
```

Open `docs/index.html` in a browser to preview.

---

## One-time setup: publish on GitHub Pages (free)

You only do this once. After that, every `git push` updates the live site automatically.

**1. Create the repo on GitHub.** Go to github.com → New repository → name it e.g.
`hanjoochae-site` → Public → *don't* add a README/.gitignore (we already have them) → Create.

**2. Initialize git locally and push.** In Terminal, from this folder:

```bash
cd "/Users/hchae/Documents/Claude/Projects/Personal Website"
git init
git add -A
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/<your-username>/hanjoochae-site.git
git push -u origin main
```

(If prompted to authenticate, sign in to GitHub — easiest via the browser prompt, or use a
Personal Access Token as the password.)

**3. Turn on GitHub Pages.** In the repo: **Settings → Pages**
- **Source:** Deploy from a branch
- **Branch:** `main`  •  **Folder:** `/docs`  → **Save**

Your site goes live in ~1 minute at `https://<your-username>.github.io/hanjoochae-site/`.

**4. Connect your custom domain.** Still in **Settings → Pages**, set **Custom domain** to
`hanjoochae.com` and Save. (A `CNAME` file is already generated into `docs/`, so this sticks.)
Then add DNS records at your registrar (below). Once the certificate is issued (~15 min–24 h),
tick **Enforce HTTPS**.

---

## DNS setup

### hanjoochae.com (primary — GoDaddy)
In GoDaddy DNS, point the apex and `www` at GitHub Pages:

| Type  | Name | Value |
|-------|------|-------|
| A     | @    | 185.199.108.153 |
| A     | @    | 185.199.109.153 |
| A     | @    | 185.199.110.153 |
| A     | @    | 185.199.111.153 |
| CNAME | www  | `<your-username>.github.io` |

(Optional IPv6: AAAA `@` → `2606:50c0:8000::153`, `…8001::153`, `…8002::153`, `…8003::153`.)

### hchae.com (Wix — domain only) → redirect to hanjoochae.com
You don't need a second site. In the Wix domain panel, set up **domain forwarding / 301
redirect** from `hchae.com` (and `www.hchae.com`) to `https://hanjoochae.com`.

---

## Ongoing updates (the normal workflow)

Just tell Claude what changed, e.g. *"I published a new paper — here's the Scholar link"*,
*"I gave a talk at X in March 2026"*, *"swap my hero photo for this file"*, *"update my CV"*.
Claude follows `CLAUDE.md`, edits the right `content/*.json`, rebuilds, and (with your OK)
commits and pushes.

If you ever do it by hand:

```bash
# 1. edit the relevant file in content/
node build/build.mjs                 # 2. rebuild
git add -A && git commit -m "Update ..."   # 3. commit
git push                              # 4. publish (GitHub Pages redeploys automatically)
```

Detailed per-task recipes (new paper, new patent, job change, new talk, new image, CV update)
are in **`CLAUDE.md`**.

---

## License

© 2026 Han Joo Chae. All rights reserved.

No license is granted. This repository is public for transparency and hosting only; the
content, text, images, and CV may not be reused without permission.
