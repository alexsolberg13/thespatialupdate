// Shared by `npm run render-slides` and the build (scripts/posts_index.js): reads a
// post's folder in src/posts/<slug>/ and checks the parts that need no browser.
//
// A post folder holds:
//   index.html   the post page (title, published date, slide count, caption)
//   slides.html  the slides as data, opened by render-slides (not published)
//   slides.md    every line of slide text with its claim ID, and the caption
//   slides/NN.png  the saved slides (1080x1350), written by render-slides
//
// Checks (each failure is a plain-English line naming the post):
//   - slides.md: every line has a claim ID that exists in dossiers/<slug>.md
//   - the caption in index.html is the caption in slides.md, at most 150 words
//   - slides/01.png ... NN.png exist and are exactly 1080x1350

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "src", "posts");
const DOSSIERS_DIR = path.join(ROOT, "dossiers");
const SLIDE_W = 1080, SLIDE_H = 1350, CAPTION_MAX_WORDS = 150;

function postSlugs() {
  return fs.readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(POSTS_DIR, d.name, "index.html")))
    .map((d) => d.name).sort();
}

function unesc(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, "&");
}
function squash(s) { return s.replace(/\s+/g, " ").trim(); }

// The post page: title, published date, number of slides, caption paragraphs.
function readPost(slug) {
  const html = fs.readFileSync(path.join(POSTS_DIR, slug, "index.html"), "utf-8");
  const t = /<title>([^<]*)<\/title>/.exec(html);
  const title = t && unesc(t[1]).replace(/^\s*Post\s*[:—-]\s*/, "").replace(/\s*·\s*The Spatial Update\s*$/, "").trim();
  if (!title) throw new Error(`Post "${slug}" has no <title>, so the posts index cannot name it.`);
  const d = /<meta\s+name="tsu-published"\s+content="(\d{4})-(\d{2})-(\d{2})"\s*>/.exec(html);
  if (!d) throw new Error(`Post "${slug}" has no published date. Add <meta name="tsu-published" content="YYYY-MM-DD"> to its <head>; the posts index orders posts by it.`);
  const date = new Date(Date.UTC(+d[1], +d[2] - 1, +d[3]));
  if (isNaN(date) || date.getUTCMonth() !== +d[2] - 1) throw new Error(`Post "${slug}" has an impossible published date (${d[0]}).`);
  const n = /<meta\s+name="tsu-slides"\s+content="(\d+)"\s*>/.exec(html);
  if (!n) throw new Error(`Post "${slug}" has no slide count. Add <meta name="tsu-slides" content="8"> (the number of slides) to its <head>.`);
  const cap = /<div id="caption">([\s\S]*?)<\/div>/.exec(html);
  const paras = cap ? Array.from(cap[1].matchAll(/<p>([\s\S]*?)<\/p>/g)).map((m) => squash(unesc(m[1].replace(/<[^>]*>/g, "")))) : [];
  return { slug, title, date, slides: +n[1], caption: paras.join("\n\n") };
}

// slides.md: "## Slide N — type" sections of "- **kind:** text [IDs]" lines, then
// "## Caption" (paragraphs of "- sentence [IDs]" lines separated by blank lines).
function parseSlidesMd(slug) {
  const file = path.join(POSTS_DIR, slug, "slides.md");
  if (!fs.existsSync(file)) throw new Error(`Post "${slug}" has no slides.md (the slide text with a claim ID beside each line).`);
  const lines = fs.readFileSync(file, "utf-8").split(/\r?\n/);
  const slides = [], caption = [], problems = [];
  let section = null, para = null;
  const entry = /^- (?:\*\*(\w+):\*\* )?(.+?) \[([^\]]+)\]\s*$/;
  lines.forEach((line, i) => {
    const h = /^## (Slide (\d+)\b.*|Caption.*)$/.exec(line);
    if (h) {
      para = null;
      if (h[2]) { section = "slide"; slides[+h[2] - 1] = { n: +h[2], entries: [] }; }
      else if (/^Caption/.test(h[1])) { section = "caption"; caption.push((para = [])); }
      else section = null;
      return;
    }
    if (/^## /.test(line)) { section = null; return; }
    if (/^---\s*$/.test(line) && section === "caption") { section = null; return; }
    if (section === "caption" && !line.trim()) { if (para && para.length) caption.push((para = [])); return; }
    const m = /^- /.test(line) && entry.exec(line);
    if (section === "slide") {
      const cur = slides[slides.length - 1];
      if (/^- /.test(line)) {
        if (!m || !m[1]) problems.push(`slides.md line ${i + 1}: "${line.slice(0, 60)}" has no claim ID in [brackets] or no kind (use "- **headline:** text [C3]").`);
        else cur.entries.push({ kind: m[1], text: squash(m[2]), ids: m[3].split(",").map((s) => s.trim()), line: i + 1 });
      }
    } else if (section === "caption" && /^- /.test(line)) {
      if (!m) problems.push(`slides.md line ${i + 1}: caption sentence "${line.slice(0, 60)}" has no claim ID in [brackets] (use [site] for words that make no claim).`);
      else { if (!para) caption.push((para = [])); para.push({ text: squash(m[2]), ids: m[3].split(",").map((s) => s.trim()), line: i + 1 }); }
    }
  });
  const paras = caption.filter((p) => p.length);
  return { slides: slides.filter(Boolean), caption: paras, captionText: paras.map((p) => p.map((s) => s.text).join(" ")).join("\n\n"), problems };
}

function dossierIds(slug) {
  const file = path.join(DOSSIERS_DIR, slug + ".md");
  if (!fs.existsSync(file)) throw new Error(`No source record at dossiers/${slug}.md, so claim IDs cannot be checked.`);
  const ids = new Set();
  fs.readFileSync(file, "utf-8").split(/\r?\n/).forEach((l) => { const m = /^\|\s*([CS]\d+)\s*\|/.exec(l); if (m) ids.add(m[1]); });
  return ids;
}

function pngSize(file) {
  const b = fs.readFileSync(file);
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function slideFile(slug, n) { return path.join(POSTS_DIR, slug, "slides", String(n).padStart(2, "0") + ".png"); }

// Everything that needs no browser. Returns an array of plain-English problems.
function checkPost(slug, opts) {
  opts = opts || {};
  const problems = [];
  const post = readPost(slug), md = parseSlidesMd(slug);
  problems.push(...md.problems);
  const ids = dossierIds(slug);
  const idOk = (id) => id === "site" || ids.has(id);
  md.slides.forEach((s) => s.entries.forEach((e) => e.ids.forEach((id) => {
    if (!idOk(id)) problems.push(`slides.md line ${e.line}: "${id}" is not a claim or source in dossiers/${slug}.md.`);
    if (id === "site" && !["brand", "follow", "kicker"].includes(e.kind)) problems.push(`slides.md line ${e.line}: [site] is only for the wordmark, the follow prompt and the "Sources" label, not a ${e.kind}.`);
  })));
  md.caption.forEach((p) => p.forEach((e) => e.ids.forEach((id) => { if (!idOk(id)) problems.push(`slides.md line ${e.line}: "${id}" is not a claim or source in dossiers/${slug}.md.`); })));

  if (md.slides.length !== post.slides) problems.push(`The post page says ${post.slides} slides but slides.md describes ${md.slides.length}.`);
  if (!post.caption) problems.push(`The post page has no caption (<div id="caption"> with one <p> per paragraph).`);
  const words = md.captionText.split(/\s+/).filter(Boolean).length;
  if (words > CAPTION_MAX_WORDS) problems.push(`The caption in slides.md is ${words} words; the limit is ${CAPTION_MAX_WORDS}.`);
  if (post.caption && post.caption !== md.captionText) problems.push(`The caption on the post page (index.html) is not the caption in slides.md. Copy the slides.md caption, without the [IDs], into <div id="caption"> as one <p> per paragraph.`);

  if (!opts.skipImages) {
    for (let n = 1; n <= post.slides; n++) {
      const f = slideFile(slug, n);
      if (!fs.existsSync(f)) { problems.push(`slides/${String(n).padStart(2, "0")}.png is missing; run  npm run render-slides.`); continue; }
      const sz = pngSize(f);
      if (!sz || sz.w !== SLIDE_W || sz.h !== SLIDE_H) problems.push(`slides/${String(n).padStart(2, "0")}.png is ${sz ? sz.w + " x " + sz.h : "not a PNG"}, not ${SLIDE_W} x ${SLIDE_H}; run  npm run render-slides.`);
    }
  }
  return { post, md, problems, words };
}

module.exports = { POSTS_DIR, SLIDE_W, SLIDE_H, CAPTION_MAX_WORDS, postSlugs, readPost, parseSlidesMd, dossierIds, checkPost, slideFile, pngSize };
