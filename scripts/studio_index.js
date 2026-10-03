// Builds the studio home page (the Home Screen web app's start page) from what exists:
//   Reels  every src/reels/*.html reel, newest first, each with "play", "check" and "script"
//          (the script page is built from src/reels/<slug>-script.md by scripts/reel_scripts.js)
//   Posts  every src/posts/<slug>/, newest first, each linking to its slides page
//   Tools  the calibration page
// Called by .eleventy.js after every build, which writes docs/studio/index.html from
// src/studio/index.html. Nothing to edit when you add a reel or a post: the lists are
// read from the folders, so nothing can be left off. It stops the build with a plain
// message if a post page has no way back to the studio, or the calibration page is gone.

const fs = require("fs");
const path = require("path");
const reelsLib = require("./reels_index.js");
const postsLib = require("./posts_lib.js");
const scriptsLib = require("./reel_scripts.js");

const ROOT = path.join(__dirname, "..");
const TEMPLATE = path.join(ROOT, "src", "studio", "index.html");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TOOLS = [{ file: "calibrate.html", name: "Calibration", note: "Rulers, safe area, stage edges and crop strips" }];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function when(d) { return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; }

function render() {
  const reels = reelsLib.reelFiles().map(reelsLib.readReel).sort((a, b) => b.date - a.date || a.name.localeCompare(b.name));
  if (!reels.length) throw new Error("No reels found in src/reels/, so the studio page would have an empty Reels section.");

  // One narration script page per reel; stops the build if a script is missing or does not match.
  const scripts = {};
  const scriptProblems = [];
  reels.forEach((r) => {
    try { scripts[r.name] = scriptsLib.render(r, scriptsLib.load(r)); } catch (e) { scriptProblems.push(e.message); }
  });
  if (scriptProblems.length) throw new Error(scriptProblems.join("\n"));

  const slugs = postsLib.postSlugs();
  if (!slugs.length) throw new Error("No posts found in src/posts/, so the studio page would have an empty Posts section.");
  const posts = slugs.map((slug) => {
    const html = fs.readFileSync(path.join(postsLib.POSTS_DIR, slug, "index.html"), "utf-8");
    if (!/href="\.\.\/\.\.\/studio\/index\.html"/.test(html))
      throw new Error(`Post "${slug}" has no way back to the studio. Add <a class="back" href="../../studio/index.html">&larr; Studio</a> (copy it from another post page).`);
    return postsLib.checkPost(slug).post;
  }).sort((a, b) => b.date - a.date || a.slug.localeCompare(b.slug));

  TOOLS.forEach((t) => {
    if (!fs.existsSync(path.join(ROOT, "src", "reels", t.file))) throw new Error(`The studio page lists the tool "${t.name}" but src/reels/${t.file} does not exist.`);
  });

  const reelRows = reels.map((r) =>
    `  <div class="card"><b>${esc(r.title)}</b><span>Published ${when(r.date)} · ${r.beats} beats</span>\n` +
    `    <div class="links"><a class="play" href="../reels/${esc(r.file)}">play</a><a class="check" href="../reels/${esc(r.file)}?check=1">check</a><a class="script" href="scripts/${esc(r.name)}.html">script</a></div></div>`).join("\n");
  const postRows = posts.map((p) =>
    `  <a class="card post" href="../posts/${esc(p.slug)}/index.html"><img src="../posts/${esc(p.slug)}/slides/01.png" alt="" width="84" height="105">` +
    `<div><b>${esc(p.title)}</b><span>Published ${when(p.date)} · ${p.slides} slides</span></div></a>`).join("\n");
  const toolRows = TOOLS.map((t) => `  <a class="card" href="../reels/${esc(t.file)}"><b>${esc(t.name)}</b><span>${esc(t.note)}</span></a>`).join("\n");

  const html = fs.readFileSync(TEMPLATE, "utf-8")
    .replace("  <!--REEL_ROWS-->", reelRows).replace("  <!--POST_ROWS-->", postRows).replace("  <!--TOOL_ROWS-->", toolRows);
  return { html, reels, posts, tools: TOOLS, scripts };
}

function build() {
  const out = render();
  const dir = path.join(ROOT, "docs", "studio");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), out.html, "utf-8");
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  Object.keys(out.scripts).forEach((name) => fs.writeFileSync(path.join(dir, "scripts", name + ".html"), out.scripts[name], "utf-8"));
  return out;
}

module.exports = { render, build };
