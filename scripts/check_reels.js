// npm run check-reels
//
// Opens every reel in src/reels/ in a headless browser at 1080x1920, steps
// through every beat, and fails (exit code 1) with a plain-English message
// naming the reel, the beat and the element if any text, label, legend or logo
// crosses outside the safe area defined in src/reels/reel-frame.css.
//
// Uses the Chromium that Playwright installed if there is one, otherwise the
// Microsoft Edge or Google Chrome already on the machine.

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright-core");

const REELS_DIR = path.join(__dirname, "..", "src", "reels");
// calibrate.html is the ruler page, not a reel.
const NOT_REELS = ["calibrate.html"];

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
  if (!/reel-frame\.css/.test(html) || !/reel-frame\.js/.test(html)) {
    return { name, beats: 0, problems: [`Reel "${name}" does not load the shared frame (reel-frame.css and reel-frame.js). Every reel must use it.`] };
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

  // Give the map a moment to load, but never hang on it: the text layout under
  // test does not depend on the map.
  await page.waitForFunction("window.TSUReel.mapReady()", null, { timeout: 8000 }).catch(() => {});

  for (let i = 0; i < beats; i++) {
    await page.evaluate((n) => window.TSUReel.jump(n), i);
    await page.waitForTimeout(60);
    const found = await page.evaluate("window.TSUReel.measure()");
    for (const f of found) {
      const label = i === 0 ? "beat 1 of " + beats + " (the cold open)" : "beat " + (i + 1) + " of " + beats;
      problems.push(`Reel "${name}", ${label}: the ${f.what} runs ${f.by}px past the ${f.side} edge of the safe area.`);
    }
  }
  // Also exercise the real Next control once, so a broken step() is caught.
  await page.evaluate(() => window.TSUReel.jump(0));
  await page.evaluate(() => window.TSUReel.step(1));
  await page.close();
  return { name, beats, problems, pageErrors };
}

(async () => {
  const files = fs.readdirSync(REELS_DIR).filter((f) => f.endsWith(".html") && !NOT_REELS.includes(f)).sort();
  if (files.length === 0) {
    console.error("check-reels: found 0 reels in src/reels/. That is not expected.");
    process.exit(1);
  }
  const browser = await launch();
  const all = [];
  for (const f of files) {
    const r = await checkReel(browser, f);
    console.log(`  ${r.problems.length ? "FAIL" : "ok  "}  ${r.name}: ${r.beats} beats checked`);
    all.push(...r.problems);
  }
  await browser.close();

  console.log(`check-reels: ${files.length} reels, ${all.length} problem${all.length === 1 ? "" : "s"}.`);
  if (all.length) {
    console.error("\nText is outside the safe area:\n");
    all.forEach((p) => console.error("  - " + p));
    console.error("\nShorten the wording or fix the layout in src/reels/reel-frame.css, then run again.");
    process.exit(1);
  }
})().catch((e) => { console.error("check-reels failed to run: " + e.message); process.exit(1); });
