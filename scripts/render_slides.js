// npm run render-slides            (every post)
// npm run render-slides -- lake-powell   (one post)
//
// Opens each post's slides.html (src/posts/<slug>/) in a headless browser at
// 1080x1350, checks every slide, and saves each one as slides/NN.png, exactly
// 1080x1350. It fails (exit code 1) with a plain-English message naming the post,
// the slide and the element if:
//   - any text, label or legend runs past the 8% margin or off the slide,
//   - any text is smaller than 30 px, or two pieces of text overlap,
//   - a headline or line is longer than its limit (src/posts/slide-frame.css),
//   - the map's subject or a map label falls outside the map window,
//   - a line of slide text is not in slides.md (with its claim ID), or a line in
//     slides.md is not on a slide, or an ID is not in the post's dossier,
//   - the caption is over 150 words or differs from the one on the post page.
// Nothing is written to slides/ unless every slide of the post passes, so a failed
// run never leaves a mixture of old and new images.
//
// For looking at slides that fail: add  --preview-dir=<folder>  and every slide is also
// written there (never into the post).
//
// The maps are drawn from the story's own GeoJSON as SVG, so no network is needed.
// Uses the Chromium that Playwright installed if there is one, otherwise Microsoft
// Edge or Google Chrome already on the machine (REEL_BROWSER=<path> to force one).

const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright-core");
const lib = require("./posts_lib.js");

const SRC = path.join(__dirname, "..", "src");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
               ".geojson": "application/geo+json", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png" };

async function launch() {
  const tries = [{}, { channel: "msedge" }, { channel: "chrome" }];
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (pw && fs.existsSync(pw)) {
    for (const d of fs.readdirSync(pw).filter((n) => /^chromium-\d+$/.test(n)).sort().reverse()) {
      const exe = path.join(pw, d, "chrome-linux", "chrome");
      if (fs.existsSync(exe)) tries.push({ executablePath: exe });
    }
  }
  if (process.env.REEL_BROWSER) tries.unshift({ executablePath: process.env.REEL_BROWSER });
  let lastErr;
  for (const opts of tries) {
    try { return await chromium.launch(opts); } catch (e) { lastErr = e; }
  }
  throw new Error(
    "Could not start a browser to render the slides. Install Microsoft Edge or Google Chrome, or run:  npx playwright-core install chromium\n(" +
    String(lastErr && lastErr.message).split("\n")[0] + ")");
}

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split("?")[0]);
      const file = path.normalize(path.join(SRC, rel));
      if (!file.startsWith(SRC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end("not found"); return; }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
      res.end(fs.readFileSync(file));
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

const key = (kind, text) => kind + "\u0000" + text;

async function renderPost(browser, base, slug, previewDir) {
  const problems = [], pass = [];
  const checked = lib.checkPost(slug, { skipImages: true });
  checked.problems.forEach((p) => problems.push(`Post "${slug}": ${p}`));
  const n = checked.md.slides.length;
  const shots = [];

  for (let i = 1; i <= checked.post.slides; i++) {
    const page = await browser.newPage({ viewport: { width: lib.SLIDE_W, height: lib.SLIDE_H }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message || e)));
    try {
      await page.goto(`${base}/posts/${slug}/slides.html?slide=${i}`, { waitUntil: "load" });
      await page.waitForFunction("window.TSUSlide && window.TSUSlide.ready === true", null, { timeout: 30000 });
      const err = await page.evaluate("window.TSUSlide.error");
      const where = `Post "${slug}", slide ${i} of ${checked.post.slides}`;
      if (err) { problems.push(`${where}: ${err}`); continue; }
      if (errors.length) problems.push(`${where}: the page raised an error: ${errors[0]}`);
      const type = await page.evaluate(`window.TSUSlide.type(${i - 1})`);
      const found = await page.evaluate(`window.TSUSlide.audit(${i - 1})`);
      found.forEach((m) => problems.push(`${where} (${type}): ${m}`));

      // The slide's text against slides.md.
      const onSlide = await page.evaluate(`window.TSUSlide.texts(${i - 1})`);
      const md = (checked.md.slides[i - 1] || { entries: [] }).entries;
      const want = new Map();
      md.forEach((e) => want.set(key(e.kind, e.text), (want.get(key(e.kind, e.text)) || 0) + 1));
      onSlide.forEach((t) => {
        const k = key(t.kind, t.text), c = want.get(k) || 0;
        if (!c) problems.push(`${where} (${type}): the ${t.kind} "${t.text}" is not in slides.md (with its claim ID) for this slide.`);
        else want.set(k, c - 1);
      });
      want.forEach((c, k) => { if (c > 0) { const [kind, text] = k.split("\u0000"); problems.push(`${where} (${type}): slides.md has the ${kind} "${text}" but it is not on the slide.`); } });

      // Always shoot (a failing slide is only ever written to --preview-dir, never to the post).
      shots.push({ i, type, png: await page.screenshot({ clip: { x: 0, y: 0, width: lib.SLIDE_W, height: lib.SLIDE_H }, type: "png" }), texts: onSlide.length });
    } catch (e) {
      problems.push(`Post "${slug}", slide ${i}: did not load (${String(e.message).split("\n")[0]}).`);
    } finally { await page.close(); }
  }

  if (previewDir) {
    fs.mkdirSync(previewDir, { recursive: true });
    shots.forEach((s) => fs.writeFileSync(path.join(previewDir, `${slug}-${String(s.i).padStart(2, "0")}.png`), s.png));
  }
  if (!problems.length) {
    const dir = path.join(lib.POSTS_DIR, slug, "slides");
    fs.mkdirSync(dir, { recursive: true });
    fs.readdirSync(dir).filter((f) => /^\d+\.png$/.test(f)).forEach((f) => { if (+f.replace(".png", "") > checked.post.slides) fs.unlinkSync(path.join(dir, f)); });
    shots.forEach((s) => {
      const f = lib.slideFile(slug, s.i);
      fs.writeFileSync(f, s.png);
      const sz = lib.pngSize(f);
      if (!sz || sz.w !== lib.SLIDE_W || sz.h !== lib.SLIDE_H) problems.push(`Post "${slug}", slide ${s.i}: the saved image is ${sz ? sz.w + " x " + sz.h : "not a PNG"}, not ${lib.SLIDE_W} x ${lib.SLIDE_H}.`);
      else pass.push(`  ok    ${slug} slide ${s.i} of ${checked.post.slides} (${s.type}): ${s.texts} text lines inside the margin, saved slides/${String(s.i).padStart(2, "0")}.png at ${sz.w}x${sz.h}`);
    });
    // The caption and PNG checks, now that the images exist.
    lib.checkPost(slug).problems.forEach((p) => problems.push(`Post "${slug}": ${p}`));
  }
  return { problems, pass, slides: checked.post.slides, words: checked.words, title: checked.post.title };
}

(async () => {
  const previewArg = process.argv.slice(2).find((a) => a.startsWith("--preview-dir="));
  const previewDir = previewArg ? path.resolve(previewArg.split("=")[1]) : null;
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const slugs = lib.postSlugs().filter((s) => !only.length || only.includes(s));
  if (!slugs.length) { console.error(only.length ? `No post named ${only.join(", ")} in src/posts/.` : "No posts found in src/posts/."); process.exit(1); }

  let server, browser;
  try {
    server = await serve();
    browser = await launch();
    const base = `http://127.0.0.1:${server.address().port}`;
    const all = [];
    let slideCount = 0;
    for (const slug of slugs) {
      const r = await renderPost(browser, base, slug, previewDir);
      r.pass.forEach((l) => console.log(l));
      if (!r.problems.length) console.log(`  ok    ${slug}: caption ${r.words} words (limit ${lib.CAPTION_MAX_WORDS}), matches the post page`);
      all.push(...r.problems); slideCount += r.pass.length;
    }
    console.log(`render-slides: ${slideCount} slides saved from ${slugs.length} post(s).`);
    if (all.length) {
      console.error(`\nrender-slides found ${all.length} problem(s). Nothing was saved for a post with a problem:\n`);
      all.forEach((p) => console.error("  - " + p));
      console.error("\nFix these (shorten the wording, or change the slide text and slides.md together; never move the margin or the type sizes), then run again.");
      process.exitCode = 1;
    }
  } catch (e) {
    console.error("render-slides failed to run: " + e.message);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (server) server.close();
  }
})();
