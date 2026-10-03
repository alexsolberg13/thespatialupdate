#!/usr/bin/env node
// `npm run check-voice`: fails, in plain English, if any published text contains a phrase
// from the "Never list" in VOICE.md. Run first by `npm run build`.
//
// What it reads (everything a viewer or reader sees):
//   reels   the on-screen text of every beat (date, kicker, title, sub in `var BEATS`) and the
//           visible text of the reel page, plus the narration in src/reels/<slug>-script.md
//   posts   every line of slide text and the caption in src/posts/<slug>/slides.md, and the
//           caption on the post page
// The list is read from VOICE.md every time, so extending it there is all it takes.
// Website story prose is not scanned here; the independent voice pass covers it.

"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const VOICE = path.join(ROOT, "VOICE.md");
const REELS_DIR = path.join(ROOT, "src", "reels");

// A phrase also matches with a plain ending, so "delve" catches "delves" and "delved".
const ENDINGS = "(?:s|es|d|ed|ing)?";

function norm(s) {
  return s.replace(/[\u2018\u2019\u02bc]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2010-\u2012]/g, "-").replace(/\s+/g, " ").trim();
}

// The lines under the "Never list" heading in VOICE.md, up to the next heading ("Harvey's edits").
function readNeverList() {
  if (!fs.existsSync(VOICE)) throw new Error("VOICE.md is missing from the repo root, so the voice check has no Never list to read.");
  const lines = fs.readFileSync(VOICE, "utf-8").replace(/\r\n/g, "\n").split("\n");
  const head = (l) => norm(l.replace(/^#+\s*/, "")).toLowerCase();
  const start = lines.findIndex((l) => head(l) === "never list");
  if (start < 0) throw new Error('VOICE.md has no "Never list" heading, so the voice check has no list to read. Put a line "Never list" back above the phrases.');
  let end = lines.findIndex((l, i) => i > start && head(l) === "harvey's edits");
  if (end < 0) end = lines.length;
  let body = lines.slice(start + 1, end);
  const intro = body.findIndex((l) => /one phrase per line/i.test(l));
  if (intro >= 0) body = body.slice(intro + 1);
  const phrases = body.map((l) => norm(l.replace(/^[-*]\s+/, ""))).filter(Boolean);
  if (!phrases.length) throw new Error('The "Never list" in VOICE.md has no phrases (one phrase per line, under the line that says so), so the voice check would pass everything.');
  return phrases;
}

function matcher(phrase) {
  const esc = phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+").replace(/-/g, "[- ]");
  return { phrase, re: new RegExp("(?<![a-z0-9])" + esc + ENDINGS + "(?![a-z0-9])", "i") };
}

function readBeats(html) {
  const m = /var BEATS = (\[[\s\S]*?\n {2}\]);/.exec(html);
  if (!m) return null;
  try { return vm.runInNewContext(m[1]); } catch (e) { return null; }
}

function visibleText(html) {
  return html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, " ");
}

// Every piece of text to check: { where, text }.
function collect() {
  const items = [];
  const counts = { reels: 0, scripts: 0, posts: 0 };

  const { parseScript } = require("./reel_scripts.js");
  const reelFiles = fs.readdirSync(REELS_DIR).filter((f) => f.endsWith(".html") && f !== "index.html" && f !== "calibrate.html").sort();
  for (const f of reelFiles) {
    const name = f.replace(/\.html$/, "");
    const html = fs.readFileSync(path.join(REELS_DIR, f), "utf-8");
    const beats = readBeats(html);
    if (!beats) throw new Error(`Could not read the beats (var BEATS = [...]) from reel "${name}", so the voice check cannot read its on-screen text.`);
    counts.reels++;
    beats.forEach((b, i) => ["date", "kicker", "title", "sub"].forEach((k) => {
      if (b[k]) items.push({ where: `reel ${name}, beat ${i + 1}, on-screen ${k} (src/reels/${f})`, text: String(b[k]) });
    }));
    const body = /<body[\s\S]*<\/body>/i.exec(html);
    if (body) visibleText(body[0]).split(/\n/).map(norm).filter(Boolean).forEach((t) => items.push({ where: `reel ${name}, page text (src/reels/${f})`, text: t }));

    const sf = path.join(REELS_DIR, name + "-script.md");
    if (!fs.existsSync(sf)) throw new Error(`Reel "${name}" has no narration script (src/reels/${name}-script.md), so the voice check cannot read it.`);
    counts.scripts++;
    parseScript(fs.readFileSync(sf, "utf-8"), name).forEach((b) => items.push({ where: `script ${name}, beat ${b.n} narration (src/reels/${name}-script.md)`, text: b.narration.join(" ").replace(/\[\s*(?:C\d+|NEW)(?:\s*[,;]\s*(?:C\d+|NEW))*\s*\]/g, " ") }));
  }

  const posts = require("./posts_lib.js");
  for (const slug of posts.postSlugs()) {
    counts.posts++;
    const md = posts.parseSlidesMd(slug);
    md.slides.forEach((s) => s.entries.forEach((e) => items.push({ where: `post ${slug}, slide ${s.n}, ${e.kind} (src/posts/${slug}/slides.md line ${e.line})`, text: e.text })));
    md.caption.forEach((p) => p.forEach((e) => items.push({ where: `post ${slug}, caption (src/posts/${slug}/slides.md line ${e.line})`, text: e.text })));
    items.push({ where: `post ${slug}, caption on the post page (src/posts/${slug}/index.html)`, text: posts.readPost(slug).caption });
  }
  return { items, counts };
}

function run() {
  const phrases = readNeverList();
  const matchers = phrases.map(matcher);
  const { items, counts } = collect();
  if (!items.length) throw new Error("The voice check found no on-screen text, scripts, slide text or captions to read, so it would pass everything. Is it running from the repo?");
  const hits = [];
  for (const it of items) {
    const t = norm(it.text);
    for (const m of matchers) if (m.re.test(t)) hits.push({ ...it, phrase: m.phrase, text: t });
  }
  console.log(`[voice] read ${phrases.length} phrases from the Never list in VOICE.md; checked ${items.length} pieces of text in ${counts.reels} reel(s), ${counts.scripts} script(s) and ${counts.posts} post(s).`);
  if (hits.length) {
    console.error(`\n[voice] FAILED: ${hits.length} place(s) use a phrase from the Never list in VOICE.md.\n`);
    hits.forEach((h) => console.error(`  - ${h.where}\n    uses "${h.phrase}": ${h.text}\n`));
    console.error("Rewrite each line without the phrase (keep every number, date and claim), or, if the phrase should be allowed, remove it from the Never list in VOICE.md.");
    return 1;
  }
  console.log("[voice] 0 problems.");
  return 0;
}

if (require.main === module) {
  try { process.exit(run()); } catch (e) { console.error("\n[voice] " + e.message); process.exit(1); }
}
module.exports = { readNeverList, matcher, run };
