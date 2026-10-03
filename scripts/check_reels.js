// npm run check-reels
//
// Opens every reel in src/reels/ in a headless browser at 1080x1920, steps
// through every beat, and fails (exit code 1) with a plain-English message
// naming the reel, the beat and the element if:
//   - any text, label, legend or logo crosses outside the safe area, or
//   - the beat breaks one of the layout rules 1 to 6 (header row, map window, text
//     block, legend, type sizes, map labels). Those rules are listed in
//     scripts/reel_audit.js; their numbers (zones, sizes, word limits) are defined
//     once in src/reels/reel-frame.css. In short: the text block ends at 87% and
//     grows upward, the legend sits directly above it, the darkening is a gradient
//     that follows the text, and the beat's subject and every map label showing sit
//     fully inside the map window (19% down to just above the legend) and the side
//     margins.
//
// Uses the Chromium that Playwright installed if there is one, otherwise the
// Microsoft Edge or Google Chrome already on the machine.
//
// Basemap: by default the reels load their real basemap (map library and tiles from the
// internet), so the check also proves that the basemap place names that would cross out of
// the map window are hidden. On a machine with no internet (or a blocked one, like the
// cloud sandbox) run it with REEL_BASEMAP=stub (PowerShell:  $env:REEL_BASEMAP="stub"; npm run check-reels)
// or `node scripts/check_reels.js --stub`. The map library then comes from node_modules
// and the basemap is an empty dark background with no network at all. Everything about the
// layout is still checked (the map projects, the camera frames each beat, the subject and the
// reel's own labels must sit inside the map window); the ONE thing that is not checked is the
// basemap's own place names, because a stub has none. The run says so, in the per-reel lines
// and in the summary, so a stubbed pass can never be mistaken for a full one.

const fs = require("fs");
const os = require("os");
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright-core");

const auditBeat = require("./reel_audit.js");

const REELS_DIR = path.join(__dirname, "..", "src", "reels");
const STUB = process.env.REEL_BASEMAP === "stub" || process.argv.includes("--stub");
const MAPLIBRE_DIST = path.join(__dirname, "..", "node_modules", "maplibre-gl", "dist");
const STUB_STYLE = JSON.stringify({ version: 8, name: "check-stub", sources: {},
  layers: [{ id: "stub-background", type: "background", paint: { "background-color": "#0b1320" } }] });

// Stub mode: serve the map library from node_modules and the basemap style as an empty
// dark background, and refuse every other request that would leave the machine, so the
// run needs no network and cannot hang on one.
async function stubNetwork(ctx) {
  await ctx.route(/^https?:/, (route) => {
    const u = route.request().url();
    const lib = /\/maplibre-gl@[^/]+\/dist\/(maplibre-gl\.(?:js|css))(?:\?|$)/.exec(u);
    if (lib) return route.fulfill({ path: path.join(MAPLIBRE_DIST, lib[1]), contentType: lib[1].endsWith(".js") ? "text/javascript" : "text/css" });
    if (/\/style\.json(?:\?|$)/.test(u)) return route.fulfill({ status: 200, contentType: "application/json", body: STUB_STYLE });
    return route.abort();
  });
}
async function newPage(browser, opts) {
  const ctx = await browser.newContext(opts);
  if (STUB) await stubNetwork(ctx);
  return ctx.newPage();
}
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

// ---- iPhone 15 Home Screen simulation -------------------------------------------
// The reel is loaded in an iframe that stands in for the viewport iOS gives a Home
// Screen web app: a 393x852pt screen, with the page's viewport starting under the
// 59pt status-bar inset and 793pt tall (852 - 59), and a 34pt home-indicator inset
// at the bottom. Inside the frame the page sees what it sees on the phone:
// innerHeight 793, screen.height 852, navigator.standalone true, no safe-area
// env() values. Every measurement is then taken in SCREEN points (frame offset +
// position inside the frame) and compared with the rules as percent of the stage
// where the stage should be: centred on the physical screen. A reel that assumes
// the viewport starts at the top of the screen lands 59pt too low and fails here.
const PHONE = { screenW: 393, screenH: 852, viewportH: 793, topInset: 59, bottomInset: 34 };

function inPhoneFrame() {
  const stage = document.getElementById("reel-stage");
  const R = TSUReel;
  const sr = stage.getBoundingClientRect(), k = sr.width / R.STAGE_W;
  const box = (nodes) => {
    let t = Infinity, b = -Infinity, any = false;
    for (const n of nodes) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const r = n.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      any = true; t = Math.min(t, r.top); b = Math.max(b, r.bottom);
    }
    return any ? { top: t, bottom: b } : null;
  };
  const q = (sel) => Array.from(stage.querySelectorAll(sel));
  // The same report the on-device ?check=1 panel shows (header row, map window, subject,
  // labels, legend, text block, gradient), measured relative to the stage.
  return {
    k, stageTop: sr.top, stageBottom: sr.bottom, stageH: sr.height,
    rows: R.deviceReport(),
    header: box(q(".reel-date, .reel-dots")),
    legend: box(q(".reel-leg-row.on")),
    text: box(q(".reel-kicker, .reel-title, .reel-sub"))
  };
}

async function deviceProblems(browser, file, name) {
  const out = [];
  const ctx = await browser.newContext({ viewport: { width: PHONE.screenW, height: PHONE.screenH }, deviceScaleFactor: 1 });
  if (STUB) await stubNetwork(ctx);
  await ctx.addInitScript((p) => {
    if (window === window.top) return;
    Object.defineProperty(navigator, "standalone", { get: () => true });
    Object.defineProperty(window.screen, "width", { get: () => p.screenW });
    Object.defineProperty(window.screen, "height", { get: () => p.screenH });
  }, PHONE);
  const page = await ctx.newPage();
  const harness = path.join(os.tmpdir(), "tsu-iphone-" + name + ".html");
  fs.writeFileSync(harness,
    '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000">' +
    `<iframe id="f" src="${pathToFileURL(path.join(REELS_DIR, file)).href}?audit=1" ` +
    `style="position:absolute;left:0;top:${PHONE.topInset}px;width:${PHONE.screenW}px;height:${PHONE.viewportH}px;border:0"></iframe>`, "utf-8");
  await page.goto(pathToFileURL(harness).href);
  const frame = page.frames().find((f) => f !== page.mainFrame());
  try {
    await frame.waitForFunction("window.TSUReel && window.TSUReel.ready", null, { timeout: 15000 });
    await frame.waitForFunction("window.TSUReel.mapReady()", null, { timeout: 30000 });
  } catch (e) {
    await ctx.close(); fs.unlinkSync(harness);
    return [`Reel "${name}": did not start in the iPhone Home Screen simulation.`];
  }
  const beats = await frame.evaluate("window.TSUReel.count");
  const picks = Array.from({ length: beats }, (_, i) => i);   // every beat: the text, legend and framing change on each
  const off = PHONE.topInset;      // where the frame's top sits on the screen
  for (const i of picks) {
    const label = `beat ${i + 1} of ${beats}`;
    await frame.evaluate((n) => window.TSUReel.jump(n), i);
    await frame.evaluate("window.TSUReel.settle()");
    await page.waitForTimeout(60);
    const m = await frame.evaluate(inPhoneFrame);
    // Where the stage should be on the physical screen, and where it is.
    const wantTop = (PHONE.screenH - m.stageH) / 2, haveTop = off + m.stageTop;
    const fail = (t) => out.push(`Reel "${name}", ${label}, iPhone Home Screen simulation: ${t}`);
    if (Math.abs(haveTop - wantTop) > 1)
      fail(`the stage is ${(haveTop - wantTop).toFixed(1)}pt ${haveTop > wantTop ? "too low" : "too high"} on the screen (strip above ${haveTop.toFixed(1)}pt, below ${(PHONE.screenH - off - m.stageBottom).toFixed(1)}pt; they should be equal).`);
    // The on-device report (percent of the stage, so the same on every screen): header
    // row, map window, subject, labels, legend, text block, gradient. The stage's place on
    // the screen is checked just above.
    m.rows.filter((r) => !r.pass && r.name !== "Stage on screen").forEach((r) =>
      fail(`${r.name}: wanted ${r.want}, got ${r.got}.`));
    // Nothing may reach the status-bar or home-indicator insets.
    [["header row", m.header], ["text block", m.text], ["legend", m.legend]].forEach(([what, b]) => {
      if (!b) return;
      if (off + b.top < PHONE.topInset) fail(`the ${what} runs under the status bar (top ${(off + b.top).toFixed(1)}pt, inset ${PHONE.topInset}pt).`);
      if (off + b.bottom > PHONE.screenH - PHONE.bottomInset) fail(`the ${what} runs into the home indicator area (bottom ${(off + b.bottom).toFixed(1)}pt, limit ${PHONE.screenH - PHONE.bottomInset}pt).`);
    });
  }
  await ctx.close();
  try { fs.unlinkSync(harness); } catch (e) {}
  return out;
}

async function checkReel(browser, file) {
  const name = file.replace(/\.html$/, "");
  const problems = [];
  const html = fs.readFileSync(path.join(REELS_DIR, file), "utf-8");
  const missing = [];
  if (!/rel="manifest"/.test(html)) missing.push("the web app manifest link");
  if (!/apple-mobile-web-app-capable/.test(html)) missing.push("the Apple full-screen meta tags");
  // One viewport meta tag, and it has viewport-fit=cover. A second tag without it
  // (lake-powell once had one) can drop a Home Screen page out of cover mode, so the
  // viewport starts under the status bar.
  const vps = html.replace(/<!--[\s\S]*?-->/g, "").match(/<meta\b[^>]*name=["']viewport["'][^>]*>/gi) || [];
  if (vps.length !== 1 || !/viewport-fit=cover/.test(vps[0]))
    problems.push(`Reel "${name}" must have exactly one <meta name="viewport"> and it must include viewport-fit=cover (found ${vps.length}); otherwise an iPhone in Home Screen mode can lay the page out below the status bar.`);
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

  const page = await newPage(browser, { viewport: { width: 1080, height: 1920 } });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(pathToFileURL(path.join(REELS_DIR, file)).href + "?audit=1", { waitUntil: "domcontentloaded" });

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
  // (The stub basemap has no place names, so zero basemap label layers is expected there.)
  if (!mapLoaded || !stats0 || (!stats0.layers && !STUB)) {
    problems.push(`Reel "${name}": the map did not load (${STUB ? "the stub basemap and the map library from node_modules" : "the basemap tiles come from the internet"}), so the map window (rule 2) and map labels (rule 6) could not be checked. ${STUB ? "Run npm install, then run again." : "Check the connection and run again, or run with REEL_BASEMAP=stub to check the layout without the internet (the basemap place names are then not checked)."}`);
  }

  // The viewer's zones: the blocked corner is the right 17% of the width from 45% of the
  // stage down; the text block's last line is at 87% and the headline ends at or above 84%
  // (Instagram's three-row caption stack starts at 84%, the two-row one at 89%).
  const zone = await page.evaluate("(function(){var s=window.TSUReel.safe(),r=getComputedStyle(document.documentElement);return {w:s.corner.w,h:s.corner.h,bottom:s.bottom,text:parseFloat(r.getPropertyValue('--text-bottom')),head:parseFloat(r.getPropertyValue('--headline-bottom'))};})()");
  if (zone.w !== 17 || zone.h !== 55 || zone.bottom !== 13 || zone.text !== 87 || zone.head !== 84) {
    problems.push(`Reel "${name}": reel-frame.css has the blocked corner at ${zone.w}% wide by ${zone.h}% tall, the bottom margin at ${zone.bottom}%, the text block ending at ${zone.text}% and the headline limit at ${zone.head}%; they must be 17% wide, 55% tall (from 45% down), 13%, 87% and 84%.`);
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
        ? `Reel "${name}", ${label}: the ${f.what} runs ${f.by}px into the blocked bottom-right corner (the right 17% of the width, from 45% of the stage down: where Instagram puts its buttons).`
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
  // iPhone 15 Home Screen simulation (see deviceProblems below).
  problems.push(...(await deviceProblems(browser, file, name)));

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
      (r.beats ? (STUB ? "; basemap STUBBED, basemap place names NOT checked" : `; ${r.hiddenLabels} basemap labels hidden under the header, legend or text`) : ""));
    all.push(...r.problems);
  }
  await browser.close();

  console.log(`check-reels: ${files.length} reels, ${all.length} problem${all.length === 1 ? "" : "s"}.` +
    (STUB ? "\n  NOTE: basemap was STUBBED (no network). Layout rules 1-5 and the framing of the subject and the reel's own labels (rules 2 and 6) were checked; the basemap's own place names (rule 6, basemap part) were NOT. Run without REEL_BASEMAP=stub on a machine with internet for the full check." : ""));
  if (all.length) {
    console.error("\nProblems found:\n");
    all.forEach((p) => console.error("  - " + p));
    console.error("\nFix these (shorten on-screen wording, reframe the beat or trim the legend; never move the safe area or the layout zones), then run again.");
    process.exit(1);
  }
})().catch((e) => { console.error("check-reels failed to run: " + e.message); process.exit(1); });
