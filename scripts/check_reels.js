// npm run check-reels
//
// Opens every reel in src/reels/ in a headless browser at 1080x1920, steps
// through every beat, and fails (exit code 1) with a plain-English message
// naming the reel, the beat and the element if:
//   - any text, label, legend or logo crosses outside the safe area, or
//   - the beat breaks one of the layout rules 1 to 6 (header row, map window, text
//     block, legend, type sizes, map labels). Those rules are listed in
//     scripts/reel_audit.js; their numbers (zones, sizes, word limits) are defined
//     once in src/reels/reel-frame.css.
//
// Uses the Chromium that Playwright installed if there is one, otherwise the
// Microsoft Edge or Google Chrome already on the machine.

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright-core");

const auditBeat = require("./reel_audit.js");

const REELS_DIR = path.join(__dirname, "..", "src", "reels");
const RULES = { 1: "header row", 2: "map window", 3: "text block", 4: "legend", 5: "type sizes", 6: "map labels" };
// calibrate.html (rulers) is not a reel. index.html is built, not stored here.
const NOT_REELS = ["calibrate.html", "index.html"];

async function launch() {
  const tries = [{}, { channel: "msedge" }, { channel: "chrome" }];
  if (process.env.REEL_BROWSER) tries.unshift({ executablePath: process.env.REEL_BROWSER });
  let lastErr;
  for (const opts of tries) {
    try { return await chromium.launch(opts); } catch (e) { lastErr = e; }
  }
  throw new Error(
    "Could not start a browser to check the reels. Install Microsoft Edge or " +
    "Google Chrome, or run:  npx playwright-core install chromium\n(" +
    String(lastErr && lastErr.message).split("\n")[0] + ")"
  );
}

async function checkReel(browser, file) {
  const name = file.replace(/\.html$/, "");
  const problems = [];
  const html = fs.readFileSync(path.join(REELS_DIR, file), "utf-8");
  const missing = [];
  if (!/rel="manifest"/.test(html)) missing.push("the web app manifest link");
  if (!/apple-mobile-web-app-capable/.test(html)) missing.push("the Apple full-screen meta tags");
  if (missing.length) problems.push(`Reel "${name}" is missing ${missing.join(" and ")} (copy them from another reel), so it won't run full screen from the Home Screen.`);
  // The shared frame: reel-frame.css and reel-frame.js must really be loaded by
  // the page (a mention in a comment does not count), and the reel must use the
  // frame's stage. Checked first, because without it nothing below means anything.
  const live = html.replace(/<!--[\s\S]*?-->/g, "");
  const frameProblems = [];
  if (!/<link\b[^>]*href=["']reel-frame\.css["']/i.test(live)) frameProblems.push('<link href="reel-frame.css" rel="stylesheet"> in its <head>');
  if (!/<script\b[^>]*src=["']reel-frame\.js["']/i.test(live)) frameProblems.push('<script src="reel-frame.js"></script> after its markup');
  if (!/id=["']reel-stage["']/.test(live)) frameProblems.push('the <div class="reel-stage" id="reel-stage"> that holds everything on screen');
  if (frameProblems.length) {
    return { name, beats: 0, problems: problems.concat([`Reel "${name}" does not use the shared reel frame. It is missing ${frameProblems.join("; ")}. Every reel must load the frame (copy the markup from revolution-wind.html) so its text stays inside the safe area.`]) };
  }

  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(pathToFileURL(path.join(REELS_DIR, file)).href + "?check=1", { waitUntil: "domcontentloaded" });

  try {
    await page.waitForFunction("window.TSUReel && window.TSUReel.ready", null, { timeout: 15000 });
  } catch (e) {
    await page.close();
    return { name, beats: 0, problems: [`Reel "${name}" never started (it did not call TSUReel.bind). ${pageErrors[0] || ""}`.trim()] };
  }
  const beats = await page.evaluate("window.TSUReel.count");

  // The map has to load: rules 2 and 6 are about where the map's subject and its place
  // names fall, and cannot be checked without it. (Never pass quietly without it.)
  let mapLoaded = true;
  await page.waitForFunction("window.TSUReel.mapReady()", null, { timeout: 30000 }).catch(() => { mapLoaded = false; });
  const stats0 = mapLoaded ? await page.evaluate("window.TSUReel.labelStats()") : null;
  if (!mapLoaded || !stats0 || !stats0.layers) {
    problems.push(`Reel "${name}": the map did not load (the basemap tiles come from the internet), so the map window (rule 2) and map labels (rule 6) could not be checked. Check the connection and run again.`);
  }

  let hiddenLabels = 0;
  for (let i = 0; i < beats; i++) {
    const label = i === 0 ? "beat 1 of " + beats + " (the cold open)" : "beat " + (i + 1) + " of " + beats;
    await page.evaluate((n) => window.TSUReel.jump(n), i);
    await page.evaluate("window.TSUReel.settle()");   // wait for the map and its labels to settle
    await page.waitForTimeout(60);
    const found = await page.evaluate("window.TSUReel.measure()");
    for (const f of found) {
      problems.push(f.side === "corner"
        ? `Reel "${name}", ${label}: the ${f.what} runs ${f.by}px into the blocked bottom-right corner (where Instagram puts its buttons).`
        : `Reel "${name}", ${label}: the ${f.what} runs ${f.by}px past the ${f.side} edge of the safe area.`);
    }
    const audit = await page.evaluate(auditBeat);
    for (const p of audit.problems) problems.push(`Reel "${name}", ${label}: ${p.text} (rule ${p.rule}, ${RULES[p.rule]})`);
    hiddenLabels = audit.stats.hidden;
  }
  // On an iPhone 15 (1179x2556, taller than 9:16) the stage must sit centred on
  // the whole screen and the map must run on into the strips above and below.
  await page.setViewportSize({ width: 1179, height: 2556 });
  await page.waitForTimeout(100);
  const geo = await page.evaluate(() => {
    const st = document.getElementById("reel-stage").getBoundingClientRect();
    const m = document.querySelector(".reel-map");
    const mr = m ? m.getBoundingClientRect() : null;
    return { stageMid: (st.top + st.bottom) / 2, stageH: st.height, vh: innerHeight,
             mapTop: mr && mr.top, mapBottom: mr && mr.bottom, vw: innerWidth, mapL: mr && mr.left, mapR: mr && mr.right };
  });
  if (Math.abs(geo.stageMid - geo.vh / 2) > 2) problems.push(`Reel "${name}": on an iPhone-sized screen (1179x2556) the stage is not centred vertically.`);
  if (geo.mapTop !== null && (geo.mapTop > 1 || geo.mapBottom < geo.vh - 1 || geo.mapL > 1 || geo.mapR < geo.vw - 1))
    problems.push(`Reel "${name}": on an iPhone-sized screen the map does not reach the top and bottom of the screen.`);
  await page.setViewportSize({ width: 1080, height: 1920 });
  // Home Screen mode on an iPhone 15: iOS reports a viewport ~59pt shorter than the
  // 393x852pt screen. The stage must be centred on the physical screen anyway, so
  // the strip above it equals the strip below it.
  const ph = await browser.newPage({ viewport: { width: 393, height: 793 } });
  await ph.goto(pathToFileURL(path.join(REELS_DIR, file)).href + "?check=1&screen=393x852", { waitUntil: "domcontentloaded" });
  await ph.waitForFunction("window.TSUReel && window.TSUReel.ready", null, { timeout: 15000 }).catch(() => {});
  const mt = await ph.evaluate("window.TSUReel && window.TSUReel.metrics && window.TSUReel.metrics()");
  await ph.close();
  if (!mt || Math.abs(mt.above - mt.below) > 1)
    problems.push(`Reel "${name}": with a viewport 59pt shorter than the screen (as in iPhone Home Screen mode) the stage is not centred on the physical screen` +
      (mt ? ` (strip above ${mt.above.toFixed(1)}pt, below ${mt.below.toFixed(1)}pt).` : "."));

  // Also exercise the real Next control once, so a broken step() is caught.
  await page.evaluate(() => window.TSUReel.jump(0));
  await page.evaluate(() => window.TSUReel.step(1));
  await page.close();
  return { name, beats, problems, pageErrors, hiddenLabels };
}

(async () => {
  const files = fs.readdirSync(REELS_DIR).filter((f) => f.endsWith(".html") && !NOT_REELS.includes(f)).sort();
  if (files.length === 0) {
    console.error("check-reels: found 0 reels in src/reels/. That is not expected.");
    process.exit(1);
  }
  const all = [];
  // The reels index is built from the reels in src/reels/ (scripts/reels_index.js).
  // Make sure it builds, and that the built copy in docs/ is not stale.
  try {
    const built = require("./reels_index.js").render();
    const out = path.join(__dirname, "..", "docs", "reels", "index.html");
    if (fs.existsSync(out) && fs.readFileSync(out, "utf-8") !== built.html)
      all.push("docs/reels/index.html is out of date with the reels in src/reels/. Run npm run build.");
    console.log(`  ok    reels index: lists all ${built.reels.length} reels, newest first`);
  } catch (e) { all.push(e.message); }
  const browser = await launch();
  for (const f of files) {
    const r = await checkReel(browser, f);
    console.log(`  ${r.problems.length ? "FAIL" : "ok  "}  ${r.name}: ${r.beats} beats checked against rules 1-6` +
      (r.beats ? `; ${r.hiddenLabels} basemap labels hidden under the header, legend or text` : ""));
    all.push(...r.problems);
  }
  await browser.close();

  console.log(`check-reels: ${files.length} reels, ${all.length} problem${all.length === 1 ? "" : "s"}.`);
  if (all.length) {
    console.error("\nProblems found:\n");
    all.forEach((p) => console.error("  - " + p));
    console.error("\nFix these (shorten on-screen wording, reframe the beat or trim the legend; never move the safe area or the layout zones), then run again.");
    process.exit(1);
  }
})().catch((e) => { console.error("check-reels failed to run: " + e.message); process.exit(1); });
