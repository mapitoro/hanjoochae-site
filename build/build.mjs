#!/usr/bin/env node
/**
 * Static site generator for hanjoochae.com
 * Reads content/*.json (source of truth) and renders a single, self-contained
 * docs/index.html. No external build dependencies — just Node.
 *
 * Usage:  node build/build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT = join(ROOT, "content");
const OUT = join(ROOT, "docs");

const load = (name) => JSON.parse(readFileSync(join(CONTENT, name), "utf8"));
const profile = load("profile.json");
const experience = load("experience.json");
const education = load("education.json");
const projects = load("projects.json");
const featured = load("featured.json");
const proof = load("proof.json");
const publications = load("publications.json");
const patents = load("patents.json");
const talks = load("talks.json");
const teaching = load("teaching.json");
const awards = load("awards.json");
const press = load("press.json");

// ---------- helpers ----------
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtYM = (ym) => {
  if (!ym || ym === "present") return "Present";
  const [y, m] = String(ym).split("-");
  return m ? `${MONTHS[parseInt(m, 10)]} ${y}` : y;
};
const dateRange = (s, e) => `${fmtYM(s)} — ${fmtYM(e)}`;

// resolve an image slot by basename, accepting any common extension
const IMG_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".JPG", ".JPEG", ".PNG", ".WEBP"];
const resolveImg = (path) => {
  if (!path) return null;
  if (existsSync(join(OUT, path))) return path;
  const slash = path.lastIndexOf("/");
  const dir = path.slice(0, slash + 1);
  const base = path.slice(slash + 1).replace(/\.[^.]+$/, "");
  for (const ext of IMG_EXTS) {
    const cand = dir + base + ext;
    if (existsSync(join(OUT, cand))) return cand;
  }
  return null;
};

// image slot: render <img> if a matching file exists in docs/, else a labeled placeholder
const media = (path, label, kind, opts = {}) => {
  const resolved = resolveImg(path);
  const fit = opts.fit === "contain" ? " fit-contain" : "";
  const inner = resolved
    ? `<img src="${esc(resolved)}" alt="${esc(label)}" loading="lazy" />`
    : `<div class="ph-inner"><span class="ph-mark">◳</span><span class="ph-label">${esc(label)}</span></div>`;
  return `<div class="media ${kind}${fit}${resolved ? "" : " is-ph"}">${inner}</div>`;
};

// self-hosted video slot (mp4 in docs/). loop+autoplay+muted for short demos; controls+poster for full clips.
const localVideo = (path, kind, opts = {}) => {
  if (!path || !existsSync(join(OUT, path))) return "";
  const a = [];
  if (opts.autoplay) { a.push("autoplay", "muted", "loop", 'preload="auto"'); }
  else { a.push("controls", "muted", 'preload="none"'); }
  a.push("playsinline");
  if (opts.poster && resolveImg(opts.poster)) a.push(`poster="${esc(resolveImg(opts.poster))}"`);
  return `<div class="media ${kind} is-video"><video ${a.join(" ")}><source src="${esc(path)}" type="video/mp4" /></video></div>`;
};

const ytId = (url = "") => {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return m ? m[1] : null;
};
const videoEmbed = (url, label) => {
  const id = ytId(url);
  if (id) {
    return `<div class="media m-wide"><iframe src="https://www.youtube.com/embed/${id}" title="${esc(label)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  }
  return null;
};

// ---------- nav ----------
const navItems = [
  ["about", "About"],
  ["impact", "Impact"],
  ["ventures", "Ventures"],
  ["experience", "Experience"],
  ["speaking", "Speaking"],
  ["research", "Research"],
  ["contact", "Contact"],
];

// ---------- hero ----------
const heroLinks = `
  ${profile.cv ? `<a class="btn btn-primary" href="${esc(profile.cv)}">Download CV</a>` : ""}
  <a class="btn${profile.cv ? "" : " btn-primary"}" href="${esc(profile.links.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
  <a class="btn" href="${esc(profile.links.scholar)}" target="_blank" rel="noopener">Scholar</a>
  <a class="btn" data-email href="#">Email</a>`;

const stats = profile.highlights
  .map((h) => `<div class="stat"><div class="stat-value">${esc(h.value)}</div><div class="stat-label">${esc(h.label)}</div></div>`)
  .join("");

const keywords = profile.keywords.map((k) => `<span class="chip">${esc(k)}</span>`).join("");

// ---------- proof band ----------
const wordmarks = (arr) => arr.map((x) => `<span class="wm">${esc(x)}</span>`).join("");
const proofBand = `
  <div class="proof">
    <div class="proof-group"><span class="proof-k">Partnered with</span><div class="wm-list">${wordmarks(proof.partners)}</div></div>
    <div class="proof-group"><span class="proof-k">Spoke at</span><div class="wm-list">${wordmarks(proof.spokeAt)}</div></div>
    <div class="proof-group"><span class="proof-k">Featured in</span><div class="wm-list">${wordmarks(proof.featuredIn)}</div></div>
  </div>`;

// ---------- education ----------
const eduHtml = education
  .map((e) => `<div class="edu-item">
      <div class="edu-school">${esc(e.school)}</div>
      <div class="edu-degree">${esc(e.degree)}</div>
      ${e.detail ? `<div class="edu-detail">${esc(e.detail)}</div>` : ""}
      <div class="edu-years">${esc(e.start)}–${esc(e.end)}</div>
    </div>`)
  .join("");

// ---------- featured impact (array of case studies) ----------
const renderCase = (c) => {
  const fMetrics = c.metrics.map((m) => `<div class="fmetric"><div class="fmetric-v">${esc(m.value)}</div><div class="fmetric-l">${esc(m.label)}</div></div>`).join("");
  const fBlocks = c.blocks.map((b) => `<div class="fblock"><div class="fblock-k">${esc(b.label)}</div><p>${esc(b.text)}</p></div>`).join("");
  const fGallery = (c.gallery || []).map((g) => `<figure>${media(g.image, g.caption, "m-tile")}<figcaption>${esc(g.caption)}</figcaption></figure>`).join("");
  const fLinks = (c.links || []).map((l) => `<a class="btn btn-sm" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("");
  const fHero = videoEmbed(c.heroVideo, c.title) || media(c.heroImage, `${c.org} — overview`, "m-wide", { fit: c.heroFit });
  const certs = (c.certifications && c.certifications.length)
    ? `<div class="certs"><span class="certs-k">Regulatory clearances</span><div class="cert-chips">${c.certifications.map((x) => `<span class="cert">${esc(x.region)}<b>${esc(x.date)}</b></span>`).join("")}</div></div>`
    : "";
  // case video: short demo (autoplay loop) > full clip (controls+poster) > YouTube embed
  let vid = "";
  if (c.demoVideo) vid = localVideo(c.demoVideo, "m-wide", { autoplay: true });
  if (!vid && c.localVideo) vid = localVideo(c.localVideo, "m-wide", { poster: c.poster });
  if (!vid && c.video) vid = videoEmbed(c.video, c.title);
  const cap = c.demoCaption || c.videoCaption || "";
  const caseVideo = vid ? `<div class="case-video">${cap ? `<div class="side-label">${esc(cap)}</div>` : ""}${vid}</div>` : "";
  const partners = (c.partners && c.partners.length) ? `<div class="f-partners">${wordmarks(c.partners)}</div>` : `<div></div>`;
  return `<div class="case${c.current ? " case-current" : ""}">
    <div class="f-head">
      <div class="f-label">${esc(c.label)}</div>
      <h3 class="f-title">${esc(c.title)}</h3>
      <div class="f-org">${esc(c.org)} · ${esc(c.role)} · ${esc(c.years)}</div>
      <p class="f-lead">${esc(c.lead)}</p>
    </div>
    ${fHero}
    <div class="fmetrics">${fMetrics}</div>
    ${certs}
    <div class="fblocks">${fBlocks}</div>
    ${caseVideo}
    ${fGallery ? `<div class="fgallery">${fGallery}</div>` : ""}
    <div class="f-foot">${partners}<div class="f-links">${fLinks}</div></div>
  </div>`;
};
const featuredHtml = featured.map(renderCase).join("");

// ---------- ventures (current medical-AI) ----------
const ventures = projects.filter((p) => p.featured);
const roots = projects.filter((p) => !p.featured);
const ventureCard = (p) => `<article class="vcard-h">
    ${media(p.image, `${p.org} — product`, "m-card", { fit: p.fit })}
    <div class="vcard-body">
      <div class="vcard-cat">${esc(p.category)}</div>
      <h3>${esc(p.title)}</h3>
      <div class="vcard-meta">${esc(p.org)} · ${esc(p.year)}</div>
      <p>${esc(p.blurb)}</p>
      <div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
    </div>
  </article>`;
const venturesHtml = ventures.map(ventureCard).join("");
const rootsHtml = roots
  .map((p) => `<div class="root-item"><div><h3>${esc(p.title)}</h3><div class="root-meta">${esc(p.org)} · ${esc(p.year)}</div></div><p>${esc(p.blurb)}</p></div>`)
  .join("");

// ---------- experience ----------
const expHtml = experience
  .map((x) => `<div class="exp-item${x.current ? " current" : ""}">
      <div class="exp-head"><h3>${esc(x.role)}</h3><span class="exp-dates">${esc(dateRange(x.start, x.end))}</span></div>
      <div class="exp-org">${esc(x.company)} · <span>${esc(x.location)}</span></div>
      <ul>${x.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
    </div>`)
  .join("");

// ---------- speaking ----------
const talksHtml = talks
  .map((t) => `<li><span class="li-date">${esc(fmtYM(t.date))}</span><span>${esc(t.event)}</span></li>`)
  .join("");
const teachingHtml = teaching
  .map((t) => `<li><span class="li-date">${esc(t.year)}</span><span>${esc(t.title)} <em>— ${esc(t.org)}</em></span></li>`)
  .join("");
const speakingMedia = videoEmbed(profile.speakingVideo, "Invited talk") || media(profile.speakingPhoto, "Speaking on stage — conference photo", "m-wide");

// ---------- research ----------
const pubsHtml = publications
  .map((p) => `<li class="pub"><span class="pub-year">${esc(p.year)}</span>
      <div class="pub-body"><div class="pub-title">${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.title)}</a>` : esc(p.title)}</div>
      <div class="pub-authors">${esc(p.authors)}</div>
      <div class="pub-venue">${esc(p.venue)} <span class="pub-type">${esc(p.type)}</span>${p.projectPage ? ` <a class="pub-extra" href="${esc(p.projectPage)}" target="_blank" rel="noopener">Project page ↗</a>` : ""}</div></div></li>`)
  .join("");
const patentsHtml = patents
  .map((p) => {
    const span = p.firstYear === p.lastYear ? `${p.lastYear}` : `${p.firstYear}–${p.lastYear}`;
    const grants = p.count > 1 ? `<span class="patent-count">${p.count} grants</span>` : "";
    return `<li class="patent"><span class="patent-id">${esc(p.id)}</span><span class="patent-title">${esc(p.title)}${grants}</span><span class="patent-year">${esc(span)}</span></li>`;
  })
  .join("");
const totalGrants = patents.reduce((s, p) => s + (p.count || 1), 0);

// ---------- awards / news / press ----------
const awardsHtml = awards
  .map((a) => `<li class="award"><span class="award-year">${esc(a.year)}</span><div><div class="award-title">${esc(a.title)}</div><div class="award-detail">${esc(a.detail)}</div></div></li>`)
  .join("");
const pressHtml = press
  .map((p) => `<li class="press-item"><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a>
      <div class="press-meta">${esc(p.outlet)}${p.date ? ` · ${esc(p.date)}` : ""}</div>${p.note ? `<div class="press-note">${esc(p.note)}</div>` : ""}</li>`)
  .join("");

const jsonLd = {
  "@context": "https://schema.org", "@type": "Person", name: profile.name,
  jobTitle: profile.title, worksFor: { "@type": "Organization", name: profile.company },
  url: profile.links.website,
  sameAs: [profile.links.linkedin, profile.links.scholar], description: profile.summary,
};
// email is not written as plaintext anywhere in the HTML (anti-harvesting); it is
// base64-encoded and assembled by JS at runtime into mailto links / text.
const emailB64 = Buffer.from(profile.email, "utf8").toString("base64");

// ---------- page ----------
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(profile.name)} — ${esc(profile.title)}, ${esc(profile.company)}</title>
<meta name="description" content="${esc(profile.summary.slice(0, 155))}" />
<meta name="author" content="${esc(profile.name)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(profile.name)} — ${esc(profile.title)}" />
<meta property="og:description" content="${esc(profile.tagline)}" />
<meta property="og:url" content="${esc(profile.links.website)}" />
<meta name="twitter:card" content="summary" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,500;6..72,600&family=Noto+Serif+KR:wght@500;600&display=swap" rel="stylesheet" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
:root{
  --ink:#0b1623; --ink-2:#33445a; --muted:#64748b; --line:#e6eaf0;
  --bg:#ffffff; --bg-soft:#f6f8fb; --accent:#0e7490; --accent-deep:#0b5566;
  --max:1080px; --radius:14px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  color:var(--ink);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:var(--max);margin:0 auto;padding:0 24px}
section{padding:72px 0;border-top:1px solid var(--line)}
h2{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:0 0 28px;font-weight:600}
h3{margin:0;font-size:18px;font-weight:600;color:var(--ink)}
p{color:var(--ink-2);margin:0 0 14px}

/* media slots */
.media{position:relative;overflow:hidden;border-radius:var(--radius);background:var(--bg-soft);border:1px solid var(--line)}
.media img,.media iframe,.media video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0}
.media.fit-contain{aspect-ratio:auto;background:#fff;display:flex;align-items:center;justify-content:center;padding:12px 20px}
.media.fit-contain img{position:static;width:100%;height:auto;max-height:100%;display:block;object-fit:contain}
.media.is-video video{background:#000}
.m-wide{aspect-ratio:16/9}
.m-card{aspect-ratio:16/10}
.m-tile{aspect-ratio:4/3}
.m-portrait{aspect-ratio:4/5}
.is-ph .ph-inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
  background:linear-gradient(135deg,#eef4f7,#e2ecf0 60%,#dce8ee);color:var(--accent-deep)}
.ph-mark{font-size:26px;opacity:.5}
.ph-label{font-size:12.5px;color:var(--accent-deep);opacity:.8;max-width:80%;text-align:center;letter-spacing:.01em}

/* nav */
header.nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.85);backdrop-filter:saturate(160%) blur(10px);border-bottom:1px solid var(--line)}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:60px}
.brand{font-weight:600}
.nav-links{display:flex;gap:20px}
.nav-links a{color:var(--ink-2);font-size:14px;font-weight:500}
.nav-links a:hover{color:var(--accent);text-decoration:none}

/* hero */
.hero{padding:84px 0 56px;border-top:none}
.hero-grid{display:grid;grid-template-columns:1.5fr .9fr;gap:48px;align-items:center}
.eyebrow{color:var(--accent);font-weight:600;font-size:14px;letter-spacing:.04em;margin-bottom:16px}
.hero h1{font-family:"Newsreader",Georgia,serif;font-weight:600;font-size:clamp(38px,6vw,60px);line-height:1.05;letter-spacing:-.01em;margin:0 0 6px;color:var(--ink)}
.name-ko{font-family:"Noto Serif KR",serif;font-weight:500;font-size:clamp(17px,2vw,21px);color:var(--muted);letter-spacing:.04em;margin:0 0 18px}
.hero .pov{font-size:clamp(18px,2.3vw,21px);color:var(--ink-2);max-width:620px;margin:0 0 28px}
.btns{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:38px}
.btn{display:inline-flex;align-items:center;padding:10px 18px;border:1px solid var(--line);border-radius:999px;font-size:14px;font-weight:500;color:var(--ink);background:#fff;transition:.15s}
.btn:hover{border-color:var(--accent);color:var(--accent);text-decoration:none}
.btn-primary{background:var(--accent);border-color:var(--accent);color:#fff}
.btn-primary:hover{background:var(--accent-deep);border-color:var(--accent-deep);color:#fff}
.btn-sm{padding:7px 13px;font-size:13px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.stat{background:var(--bg-soft);border:1px solid var(--line);border-radius:var(--radius);padding:18px 16px}
.stat-value{font-family:"Newsreader",serif;font-size:26px;font-weight:600;color:var(--accent-deep);line-height:1}
.stat-label{font-size:12.5px;color:var(--muted);margin-top:7px}
.hero-portrait .media{max-width:340px;margin-left:auto}

/* proof band */
.proof{display:flex;flex-direction:column;gap:16px}
.proof-group{display:grid;grid-template-columns:118px 1fr;align-items:start;gap:14px}
.proof-k{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding-top:8px}
.wm-list{display:flex;flex-wrap:wrap;gap:8px;min-width:0}
.wm{font-family:"Newsreader",serif;font-size:16px;font-weight:600;color:var(--ink);background:var(--bg-soft);border:1px solid var(--line);border-radius:8px;padding:5px 12px}

/* about */
.about-grid{display:grid;grid-template-columns:1.6fr 1fr;gap:48px}
.about-lead{font-size:18px;color:var(--ink-2)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.chip{font-size:13px;background:var(--bg-soft);border:1px solid var(--line);color:var(--ink-2);padding:6px 12px;border-radius:999px}
.side-label{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:14px;font-weight:600}
.edu-item{padding:14px 0;border-bottom:1px solid var(--line)}
.edu-item:last-child{border-bottom:none}
.edu-school{font-weight:600}
.edu-degree{font-size:14px;color:var(--ink-2)}
.edu-detail{font-size:13px;color:var(--muted)}
.edu-years{font-size:13px;color:var(--muted);margin-top:2px}

/* featured impact */
#impact{background:var(--bg-soft)}
.f-label{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.f-title{font-family:"Newsreader",serif;font-size:clamp(24px,3.4vw,34px);font-weight:600;margin:10px 0 6px;line-height:1.12}
.f-org{font-size:14px;color:var(--accent-deep);font-weight:500}
.f-lead{font-size:19px;color:var(--ink-2);max-width:760px;margin:16px 0 28px}
.fmetrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin:26px 0}
.fmetric{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:18px 16px}
.fmetric-v{font-family:"Newsreader",serif;font-size:25px;font-weight:600;color:var(--accent-deep);line-height:1}
.fmetric-l{font-size:12.5px;color:var(--muted);margin-top:7px}
.fblocks{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin:8px 0 30px}
.fblock-k{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.fblock p{font-size:14.5px}
.fgallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;margin-bottom:26px}
.fgallery figure{margin:0}
.fgallery figcaption{font-size:12.5px;color:var(--muted);margin-top:8px}
.f-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;align-items:center}
.f-partners{display:flex;gap:8px;flex-wrap:wrap}
.f-links{display:flex;gap:10px;flex-wrap:wrap}
.case + .case{margin-top:50px;padding-top:46px;border-top:1px solid var(--line)}
.case-current .f-label{color:#0a7d52}
.case-video{margin:6px 0 30px}
.certs{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:0 0 26px}
.certs-k{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.cert-chips{display:flex;flex-wrap:wrap;gap:8px}
.cert{display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:999px;padding:5px 12px}
.cert b{font-family:"Newsreader",serif;color:var(--accent-deep);font-weight:600}

/* ventures */
.vcard-h{display:grid;grid-template-columns:minmax(240px,.8fr) 1.2fr;background:#fff;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;margin-bottom:20px}
.vcard-h .media{border:0;border-radius:0;aspect-ratio:auto;min-height:230px}
.vcard-body{padding:26px;display:flex;flex-direction:column;justify-content:center}
.vcard-cat{font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--accent)}
.vcard-h h3{margin:9px 0 4px;font-size:19px}
.vcard-meta{font-size:13px;color:var(--muted);margin-bottom:10px}
.vcard-body p{font-size:14.5px;margin-bottom:14px}
.tags{display:flex;flex-wrap:wrap;gap:6px}
.tag{font-size:11px;background:var(--bg-soft);border:1px solid var(--line);color:var(--ink-2);padding:4px 9px;border-radius:6px}
.roots{margin-top:26px;border-top:1px dashed var(--line);padding-top:22px}
.root-item{display:grid;grid-template-columns:.8fr 1.6fr;gap:24px;align-items:start}
.root-meta{font-size:13px;color:var(--muted);margin-top:3px}
.root-item p{font-size:14px}

/* experience */
.exp-item{padding:22px 0 22px 22px;border-left:2px solid var(--line);position:relative}
.exp-item::before{content:"";position:absolute;left:-7px;top:28px;width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid var(--line)}
.exp-item.current::before{background:var(--accent);border-color:var(--accent)}
.exp-head{display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap}
.exp-dates{font-size:13px;color:var(--muted);white-space:nowrap}
.exp-org{font-size:14px;color:var(--accent-deep);font-weight:500;margin:2px 0 6px}
.exp-org span{color:var(--muted);font-weight:400}
.exp-item ul{margin:8px 0 0;padding-left:18px}
.exp-item li{color:var(--ink-2);margin-bottom:6px}

/* speaking */
.speak-media{max-width:760px;margin:0 0 8px}
.col-list{list-style:none;margin:0;padding:0}
.col-list.cols{column-count:2;column-gap:46px}
.col-list.cols li{break-inside:avoid;-webkit-column-break-inside:avoid}
.col-list li{display:flex;gap:14px;padding:10px 0;border-bottom:1px solid var(--line);font-size:14px;color:var(--ink-2)}
.li-date{color:var(--muted);min-width:74px;white-space:nowrap;font-size:13px}
.col-list em{color:var(--muted);font-style:normal}
.speak-sub{margin:30px 0 14px}

/* writing */
.posts{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.post{background:var(--bg-soft);border:1px solid var(--line);border-radius:var(--radius);padding:22px;display:flex;flex-direction:column}
.post-date{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.post h3{font-size:17px;margin-bottom:8px}
.post p{font-size:14px}
.post-link{margin-top:auto;font-weight:600;font-size:14px}
.post-soon{margin-top:auto;font-size:13px;color:var(--muted)}

/* research */
.pub-list,.patent-list{list-style:none;margin:0;padding:0}
.pub{display:flex;gap:18px;padding:15px 0;border-bottom:1px solid var(--line)}
.pub-year{font-family:"Newsreader",serif;font-size:16px;color:var(--accent-deep);min-width:46px;font-weight:600}
.pub-title{font-weight:600;color:var(--ink);font-size:15px}
.pub-authors{font-size:13px;color:var(--muted);margin:2px 0}
.pub-venue{font-size:13px;color:var(--ink-2)}
.pub-type{font-size:11px;color:var(--accent);border:1px solid var(--line);border-radius:5px;padding:1px 7px;margin-left:6px}
.pub-extra{font-size:12px;font-weight:500;margin-left:8px;white-space:nowrap}
.note-link{margin-top:18px;font-size:14px}
.patents-wrap{margin-top:36px}
.patent{display:grid;grid-template-columns:128px 1fr 92px;gap:14px;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--line);font-size:13.5px}
.patent-id{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--accent-deep);font-size:12.5px}
.patent-title{color:var(--ink-2)}
.patent-count{display:inline-block;margin-left:8px;padding:1px 7px;border:1px solid var(--line);border-radius:10px;font-size:11px;color:var(--muted);white-space:nowrap;vertical-align:middle}
.patent-year{color:var(--muted);text-align:right;white-space:nowrap}

/* awards / news / press */
.award{display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--line);list-style:none}
.award:last-child{border-bottom:none}
.award-year{font-family:"Newsreader",serif;font-weight:600;color:var(--accent-deep);min-width:46px}
.award-title{font-weight:600;font-size:14.5px}
.award-detail{font-size:13.5px;color:var(--muted)}
.news-item{display:flex;gap:20px;padding:18px 0;border-bottom:1px solid var(--line)}
.news-date{font-size:13px;color:var(--muted);min-width:84px;padding-top:2px}
.news-body h3{font-size:16px}
.news-body p{font-size:14px;margin:4px 0 0}
.press-list{list-style:none;margin:0;padding:0}
.press-item{padding:14px 0;border-bottom:1px solid var(--line)}
.press-item>a{font-weight:600}
.press-meta{font-size:13px;color:var(--muted);margin-top:2px}
.press-note{font-size:13px;color:var(--ink-2);margin-top:4px}

/* contact / footer */
.contact-card{background:var(--bg-soft);border:1px solid var(--line);border-radius:var(--radius);padding:40px;text-align:center}
.contact-card h2{margin-bottom:10px}
.contact-card .big{font-family:"Newsreader",serif;font-size:26px;font-weight:600;color:var(--ink);margin-bottom:20px}
footer{padding:36px 0;color:var(--muted);font-size:13px;text-align:center;border-top:1px solid var(--line)}

@media (max-width:860px){
  .hero{padding:56px 0 44px}
  .hero-grid,.about-grid{grid-template-columns:1fr;gap:28px}
  .hero-portrait{order:-1}.hero-portrait .media{max-width:240px;margin:0}
  .fblocks{grid-template-columns:1fr}
  .fgallery{grid-template-columns:1fr 1fr;gap:14px}
  .col-list.cols{column-count:1}
  .vcard-h{grid-template-columns:1fr}
  .vcard-h .media{aspect-ratio:16/10;min-height:0}
  .fmetrics,.stats{grid-template-columns:repeat(2,1fr)}
  .root-item{grid-template-columns:1fr;gap:6px}
  .nav-links{display:none}
}
@media (max-width:560px){
  .hero{padding:40px 0 32px}
  section{padding:52px 0}
  .wrap{padding:0 18px}
  .f-lead{font-size:17px}
  .f-title{font-size:24px}
  .fgallery{gap:10px}
  .fgallery figcaption{font-size:11.5px}
  .fmetric-v{font-size:22px}
  .patent{grid-template-columns:1fr;gap:2px}.patent-year{text-align:left}
  .proof-group{grid-template-columns:1fr;gap:6px}
  .proof-k{padding-top:0}
  .contact-card{padding:28px 22px}
  .contact-card .big{font-size:21px;word-break:break-word}
  .news-item{gap:14px}
  .award-year,.pub-year{min-width:40px}
}
</style>
</head>
<body>
<header class="nav">
  <div class="wrap nav-inner">
    <a class="brand" href="#top">${esc(profile.name)}</a>
    <nav class="nav-links">${navItems.map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join("")}</nav>
  </div>
</header>

<a id="top"></a>
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <div class="eyebrow">${esc(profile.title)} · ${esc(profile.company)}</div>
      <h1>${esc(profile.name)}</h1>
      ${profile.nameKo ? `<div class="name-ko">${esc(profile.nameKo)}</div>` : ""}
      <p class="pov">${esc(profile.pov)}</p>
      <div class="btns">${heroLinks}</div>
      <div class="stats">${stats}</div>
    </div>
    <div class="hero-portrait">${media(profile.photo, "Professional portrait", "m-portrait")}</div>
  </div>
</section>

<section id="proof" style="padding:36px 0">
  <div class="wrap">${proofBand}</div>
</section>

<section id="about">
  <div class="wrap">
    <h2>About</h2>
    <div class="about-grid">
      <div><p class="about-lead">${esc(profile.summary)}</p><div class="chips">${keywords}</div></div>
      <div><div class="side-label">Education</div>${eduHtml}</div>
    </div>
  </div>
</section>

<section id="impact">
  <div class="wrap">
    <h2>Impact</h2>
    ${featuredHtml}
  </div>
</section>

<section id="ventures">
  <div class="wrap">
    <h2>Ventures &amp; Research</h2>
    ${venturesHtml}
    <div class="roots"><div class="side-label">Research roots</div>${rootsHtml}</div>
  </div>
</section>

<section id="experience">
  <div class="wrap"><h2>Experience</h2>${expHtml}</div>
</section>

<section id="speaking">
  <div class="wrap">
    <h2>Speaking &amp; Teaching</h2>
    <div class="speak-media">${speakingMedia}</div>
    <div class="side-label speak-sub">Invited talks</div>
    <ul class="col-list cols">${talksHtml}</ul>
    <div class="side-label speak-sub">Teaching</div>
    <ul class="col-list cols">${teachingHtml}</ul>
  </div>
</section>

<section id="research">
  <div class="wrap">
    <h2>Research &amp; Patents</h2>
    <ul class="pub-list">${pubsHtml}</ul>
    <p class="note-link">Full list on <a href="${esc(profile.links.scholar)}" target="_blank" rel="noopener">Google Scholar →</a></p>
    <div class="patents-wrap">
      <div class="side-label">Granted patents — ${patents.length} invention families · ${totalGrants} grants</div>
      <ul class="patent-list">${patentsHtml}</ul>
    </div>
  </div>
</section>

<section id="awards">
  <div class="wrap"><h2>Awards &amp; Honors</h2><ul class="pub-list">${awardsHtml}</ul></div>
</section>

<section id="press">
  <div class="wrap"><h2>Press &amp; Media</h2><ul class="press-list">${pressHtml}</ul></div>
</section>

<section id="contact">
  <div class="wrap">
    <div class="contact-card">
      <h2>Contact</h2>
      <div class="big" data-email-text>Email me</div>
      <div class="btns" style="justify-content:center;margin-bottom:0">
        <a class="btn btn-primary" data-email href="#">Email me</a>
        <a class="btn" href="${esc(profile.links.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
        <a class="btn" href="${esc(profile.links.scholar)}" target="_blank" rel="noopener">Google Scholar</a>
      </div>
    </div>
  </div>
</section>

<footer><div class="wrap">© <span id="yr"></span> ${esc(profile.name)} · ${esc(profile.location)}</div></footer>
<script>
document.getElementById("yr").textContent=new Date().getFullYear();
(function(){try{var e=atob("${emailB64}");
document.querySelectorAll("[data-email]").forEach(function(a){a.setAttribute("href","mailto:"+e);});
document.querySelectorAll("[data-email-text]").forEach(function(el){el.textContent=e;});
}catch(_){}})();
</script>
</body>
</html>`;

// ---------- write ----------
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
const ASSETS = join(OUT, "assets");
if (!existsSync(ASSETS)) mkdirSync(ASSETS, { recursive: true });
if (!existsSync(join(ASSETS, "img"))) mkdirSync(join(ASSETS, "img"), { recursive: true });

writeFileSync(join(OUT, "index.html"), html, "utf8");
writeFileSync(join(OUT, "CNAME"), "hanjoochae.com\n", "utf8");
writeFileSync(join(OUT, ".nojekyll"), "", "utf8");

// Only publish a downloadable CV if profile.cv is set (kept off by default for privacy).
// To re-enable: set "cv": "assets/Han-Joo-Chae-CV.pdf" in profile.json and drop the PDF in orig_sources/.
if (profile.cv) {
  const cvCandidates = [
    join(ROOT, "orig_sources", "CV-Han Joo Chae-GTM-2026.05.pdf"),
    join(ROOT, "orig_sources", "Han-Joo-Chae-CV.pdf"),
    join(ROOT, "CV-Han Joo Chae-GTM-2026.05.pdf"), // legacy fallback
  ];
  for (const src of cvCandidates) {
    if (existsSync(src)) { copyFileSync(src, join(ASSETS, "Han-Joo-Chae-CV.pdf")); break; }
  }
}

console.log("Built docs/index.html");
console.log(`  ${publications.length} publications · ${patents.length} patents · ${experience.length} roles · ${ventures.length} ventures`);
