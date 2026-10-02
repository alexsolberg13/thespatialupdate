// Builds the reels index (the Home Screen web app's start page) from the reels
// that exist in src/reels/, newest first. Called by .eleventy.js after every
// build, which writes the result to docs/reels/index.html.
//
// A reel is any src/reels/*.html except calibrate.html. For each one it reads:
//   - the name, from <title> ("Story Beat Reel: X . The Spatial Update")
//   - the published date, from <meta name="tsu-published" content="YYYY-MM-DD">
//   - the number of beats, by reading the BEATS list in the reel's script
// and throws a plain-English error if any of that is missing, so a reel can
// never be left off the index or listed wrongly.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const REELS_DIR = path.join(__dirname, "..", "src", "reels");
const TEMPLATE = path.join(__dirname, "reels-index-template.html");
// Pages in src/reels/ that are not reels. (index.html is built, not stored here.)
const NOT_REELS = ["calibrate.html", "index.html"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function reelFiles() {
  return fs.readdirSync(REELS_DIR).filter((f) => f.endsWith(".html") && !NOT_REELS.includes(f)).sort();
}

function readReel(file) {
  const name = file.replace(/\.html$/, "");
  const html = fs.readFileSync(path.join(REELS_DIR, file), "utf-8");

  const t = /<title>([^<]*)<\/title>/.exec(html);
  const title = t && t[1].replace(/^\s*Story Beat Reel\s*[:—-]\s*/, "").replace(/\s*·\s*The Spatial Update\s*$/, "").trim();
  if (!title) throw new Error(`Reel "${name}" has no <title>, so the reels index cannot name it.`);

  const d = /<meta\s+name="tsu-published"\s+content="(\d{4})-(\d{2})-(\d{2})"\s*>/.exec(html);
  if (!d) throw new Error(`Reel "${name}" has no published date. Add <meta name="tsu-published" content="YYYY-MM-DD"> to its <head> (copy it from another reel); the reels index needs it to list reels newest first.`);
  const date = new Date(Date.UTC(+d[1], +d[2] - 1, +d[3]));
  if (isNaN(date) || date.getUTCMonth() !== +d[2] - 1) throw new Error(`Reel "${name}" has an impossible published date (${d[0]}).`);

  const m = /var BEATS = (\[[\s\S]*?\n {2}\]);/.exec(html);
  let beats = 0;
  try { beats = vm.runInNewContext(m[1]).length; } catch (e) { /* reported below */ }
  if (!beats) throw new Error(`Could not read the list of beats (var BEATS = [...]) from reel "${name}", so the reels index cannot count them.`);

  return { file, name, title, date, beats };
}

function render() {
  const files = reelFiles();
  if (files.length === 0) throw new Error("No reels found in src/reels/, so the reels index would be empty.");
  const reels = files.map(readReel).sort((a, b) => b.date - a.date || a.name.localeCompare(b.name));
  const rows = reels.map((r) => {
    const when = `${r.date.getUTCDate()} ${MONTHS[r.date.getUTCMonth()]} ${r.date.getUTCFullYear()}`;
    return `  <a class="row" href="${esc(r.file)}"><b>${esc(r.title)}</b><span>Published ${when} · ${r.beats} beats</span></a>`;
  }).join("\n");
  return { html: fs.readFileSync(TEMPLATE, "utf-8").replace("  <!--REEL_ROWS-->", rows), reels };
}

module.exports = { render, reelFiles };
