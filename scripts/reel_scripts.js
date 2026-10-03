// Narration scripts on the studio page. Reads src/reels/<slug>-script.md and builds
// docs/studio/scripts/<slug>.html (a teleprompter-style page) for every reel, called from
// scripts/studio_index.js on every build.
//
// What is read from a script file: each beat block
//     **Beat 3 - the map**
//     *(on screen: "Seven states, two lakes"; ...)*
//     > the narration, one or more lines
// Everything else (the intro, timing guide, tighter cut, fact-check notes, the claim IDs
// like [C7], and the beat's name and on-screen notes) stays in the file and is NOT put on the
// page. The headline shown is the reel's own on-screen title (read from the reel), so the
// script's "(on screen: ...)" notes may drift after on-screen text is shortened without
// breaking the page.
//
// The build stops, in plain English, if a reel has no script, if the script's beats do not
// match the reel's beats (number of beats, numbering, narration present), or if a beat has no narration.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const REELS_DIR = path.join(ROOT, "src", "reels");
const TEMPLATE = path.join(ROOT, "src", "studio", "script.html");
const WPM = 150; // spoken words per minute used for the read-time estimate

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const words = (t) => (t.match(/\S+/g) || []).length;
const CLAIM_TAG = /\[\s*(?:C\d+|NEW)(?:\s*[,;]\s*(?:C\d+|NEW))*\s*\]/g;

function readTime(w) {
  const sec = Math.round((w / WPM) * 60);
  return sec < 60 ? `${sec} sec` : `${Math.floor(sec / 60)} min ${String(sec % 60).padStart(2, "0")} sec`;
}

function parseScript(md, name) {
  const file = `src/reels/${name}-script.md`;
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const beats = [];
  let cur = null, inQuote = false;
  for (const line of lines) {
    const h = /^\*\*Beat\s+(\d+)\b[^*]*\*\*\s*$/.exec(line);
    if (h) { cur = { n: +h[1], onscreen: "", narration: [] }; beats.push(cur); inQuote = false; continue; }
    if (/^(---|#{1,6}\s)/.test(line)) { cur = null; continue; }   // a rule or heading ends the beats
    if (!cur) continue;
    const o = /^\*\(\s*on screen:\s*(.*)\)\*\s*$/.exec(line);
    if (o) { const q = /["“]([^"”]*)["”]/.exec(o[1]); cur.onscreen = q ? q[1] : ""; continue; }
    const q = /^>\s?(.*)$/.exec(line);
    if (q) { cur.narration.push(q[1]); continue; }
  }
  beats.forEach((b) => {
    b.text = b.narration.join(" ").replace(CLAIM_TAG, "").replace(/\s+/g, " ").trim();
    if (/\[[^\]]*\bC\d+\b/.test(b.text)) throw new Error(`Script ${file}, Beat ${b.n}: a claim ID is still in the narration in a form the page cannot hide. Write IDs as [C7] or [C3, C5] at the end of a sentence.`);
  });
  return beats;
}

// Checks one reel's script against the reel; returns { beats } or throws a plain message.
function load(reel) {
  const file = `src/reels/${reel.name}-script.md`;
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) throw new Error(`Reel "${reel.name}" has no narration script. Add ${file} (copy the layout of another reel's script: one "**Beat N ...**" block per beat, with an "(on screen: ...)" line and the narration after a ">"). The studio page needs it.`);
  const beats = parseScript(fs.readFileSync(full, "utf-8"), reel.name);
  if (beats.length !== reel.beats)
    throw new Error(`The script for reel "${reel.name}" has ${beats.length} beat${beats.length === 1 ? "" : "s"} but the reel has ${reel.beats}. Make ${file} have one "**Beat N ...**" block for each beat of the reel, in the reel's order.`);
  const problems = [];
  beats.forEach((b, i) => {
    if (b.n !== i + 1) problems.push(`the ${i + 1}${["st", "nd", "rd"][i] || "th"} beat block is labelled "Beat ${b.n}"; beats must be numbered 1, 2, 3 ... in order`);
    if (!b.text) problems.push(`Beat ${i + 1} has no narration (a line starting with ">")`);
  });
  if (problems.length) throw new Error(`The script for reel "${reel.name}" does not match the reel (${file}):\n    - ` + problems.join("\n    - "));
  return beats.map((b, i) => ({ n: i + 1, headline: reel.beatList[i].title, text: b.text, words: words(b.text) }));
}

function render(reel, beats) {
  const total = beats.reduce((a, b) => a + b.words, 0);
  const rows = beats.map((b) =>
    `  <section class="beat">\n    <div class="head"><span class="num">Beat ${b.n}</span><span class="meta">${b.words} words · ${readTime(b.words)}</span></div>\n` +
    `    <h2>${esc(b.headline)}</h2>\n    <p class="say">${esc(b.text)}</p>\n  </section>`).join("\n");
  const full = beats.map((b) => `Beat ${b.n}: ${b.headline}\n${b.text}`).join("\n\n");
  const copy = `${reel.title}\n\n${full}\n`;
  return fs.readFileSync(TEMPLATE, "utf-8")
    .replace(/<!--TITLE-->/g, esc(reel.title))
    .replace("<!--TOTALS-->", `${beats.length} beats · ${total} words · about ${readTime(total)} read aloud`)
    .replace("  <!--BEATS-->", rows)
    .replace("<!--COPY_TEXT-->", esc(copy).replace(/\n/g, "&#10;"))
    .replace("<!--WPM-->", String(WPM));
}

module.exports = { load, render, parseScript, readTime, WPM };
