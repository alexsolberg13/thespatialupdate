// Builds the posts section of the site from the posts that exist in src/posts/<slug>/:
//   docs/posts/index.html           the posts index, newest first (from src/posts/index.html)
//   docs/posts/<slug>/index.html    each post page, copied unchanged
//   docs/posts/<slug>/slides/NN.png each saved slide, copied unchanged
// Called by .eleventy.js after every build. It stops the build with a plain-English
// message (scripts/posts_lib.js) if a post's caption differs from slides.md, a claim
// ID is not in the dossier, or a slide image is missing or not 1080x1350. The slide
// sources (slides.html, slides.md) and the frame are working files and are not
// published; only the post page and its PNGs are.

const fs = require("fs");
const path = require("path");
const lib = require("./posts_lib.js");

const OUT = path.join(__dirname, "..", "docs", "posts");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function render() {
  const slugs = lib.postSlugs();
  if (slugs.length === 0) throw new Error("No posts found in src/posts/, so the posts index would be empty.");
  const bad = [];
  const posts = slugs.map((slug) => {
    const r = lib.checkPost(slug);
    r.problems.forEach((p) => bad.push(`Post "${slug}": ${p}`));
    return r.post;
  }).sort((a, b) => b.date - a.date || a.slug.localeCompare(b.slug));
  if (bad.length) throw new Error("A post is not ready to publish:\n  - " + bad.join("\n  - "));
  const rows = posts.map((p) => {
    const when = `${p.date.getUTCDate()} ${MONTHS[p.date.getUTCMonth()]} ${p.date.getUTCFullYear()}`;
    return `  <a class="row" href="${esc(p.slug)}/index.html"><img src="${esc(p.slug)}/slides/01.png" alt="" width="84" height="105">` +
           `<div><b>${esc(p.title)}</b><span>Published ${when} · ${p.slides} slides</span></div></a>`;
  }).join("\n");
  const tpl = fs.readFileSync(path.join(lib.POSTS_DIR, "index.html"), "utf-8");
  return { html: tpl.replace("  <!--POST_ROWS-->", rows), posts };
}

function build() {
  const { html, posts } = render();
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "index.html"), html, "utf-8");
  posts.forEach((p) => {
    const dir = path.join(OUT, p.slug, "slides");
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(path.join(lib.POSTS_DIR, p.slug, "index.html"), path.join(OUT, p.slug, "index.html"));
    for (let n = 1; n <= p.slides; n++) fs.copyFileSync(lib.slideFile(p.slug, n), path.join(dir, String(n).padStart(2, "0") + ".png"));
  });
  return posts;
}

module.exports = { render, build };
