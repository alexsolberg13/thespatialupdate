// The layout audit that `npm run check-reels` runs on every beat of every reel.
//
// This function is sent into the page by check_reels.js (so it must not use anything
// from outside itself) and returns the beat on screen's problems as
// [{ rule, text }] plus a few counts. It enforces the layout rules in
// src/reels/reel-frame.css (the zones, type sizes and limits are all read from the
// numbers defined there, never repeated here):
//
//   rule 1  header row    date tag and progress dots, one line, inside 15% to 19%
//   rule 2  map window    from 19% down to just above the legend (or the text block, on a beat
//                         with no legend), at least --window-min tall. The beat's subject sits
//                         fully inside it and inside the side margins; at most one small graphic
//   rule 3  text block    anchored to the bottom: its last line ends at 87% (the headline ends at
//                         84% on a beat with no supporting line; the headline always ends at or above
//                         84%) and it grows upward: kicker, headline (2 lines, 7 words), one supporting line (10 words),
//                         left-aligned. The only darkening is one gradient behind it: fully
//                         transparent a little above the legend, fully dark by the kicker, dark
//                         to the bottom of the stage, no lower edge
//   rule 4  legend        one row of at most 3 items directly above the kicker
//   rule 5  type sizes    headline 64, supporting line 36, kicker / legend / date 28; nothing under 28
//   rule 6  map labels    every label showing (the reel's own, and the basemap's place names) sits
//                         fully inside the map window and the side margins
//
// (The safe zone itself, including the blocked corner, is measured by TSUReel.measure().)

module.exports = function auditBeat() {
  const out = [];
  const add = (rule, text) => out.push({ rule, text });

  const W = 1080, H = 1920;
  const root = document.documentElement;
  const num = (n) => parseFloat(getComputedStyle(root).getPropertyValue(n)) || 0;
  const stage = document.getElementById("reel-stage");
  const sr = stage.getBoundingClientRect();
  const k = sr.width / W;
  const box = (r) => ({ x0: (r.left - sr.left) / k, y0: (r.top - sr.top) / k, x1: (r.right - sr.left) / k, y1: (r.bottom - sr.top) / k });
  const rectOf = (el) => box(el.getBoundingClientRect());
  const pc = (y) => (Math.round(y / H * 1000) / 10) + "%";
  window.TSUReel.sync();                       // re-measure the text block for the beat on screen
  const Z = window.TSUReel.zones();
  const safe = window.TSUReel.safe();
  const WIN = window.TSUReel.windowRect();
  const H1 = (v) => v / 100 * H;               // percent of the stage -> stage px
  const side = (o) => o.by + "px past the " + o.side;
  const clip = (t) => (t.length > 40 ? t.slice(0, 37) + "..." : t);
  const textOf = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
  const nameOf = (el) => {
    const c = (el.getAttribute("class") || "").split(/\s+/)[0];
    return el.id ? "#" + el.id : c ? "." + c : el.tagName.toLowerCase();
  };
  const shown = (n) => {
    for (let e = n.nodeType === 3 ? n.parentNode : n; e && e !== stage.parentNode; e = e.parentNode) {
      if (e.nodeType !== 1) continue;
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return false;
    }
    return true;
  };
  const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  const words = (t) => t.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  // Rendered lines of an element's text: distinct line tops.
  const lineCount = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const tops = [];
    Array.from(range.getClientRects()).forEach((r) => {
      if (r.width < 1) return;
      const t = (r.top - sr.top) / k;
      if (!tops.some((x) => Math.abs(x - t) < 8)) tops.push(t);
    });
    return tops.length;
  };

  // Every visible piece of text on the stage, with its line boxes (stage px).
  const stageText = [], mapText = [];
  const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT, null);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const p = n.parentNode;
    if (p.closest(".reel-guides, .cal-ignore") || !shown(n)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0).map(box);
    (p.closest(".reel-map") ? mapText : stageText).push({ node: n, el: p, rects, text: n.nodeValue.replace(/\s+/g, " ").trim() });
  }

  // ---- Rule 1: header row ------------------------------------------------------
  const header = stage.querySelector(".reel-header");
  const date = stage.querySelector(".reel-date"), dots = stage.querySelector(".reel-dots");
  if (!header || !dots) {
    add(1, "there is no header row (.reel-header holding the date tag and the .reel-dots).");
  } else {
    const items = [["date tag", date], ["progress dots", dots]].filter(([, e]) => e && shown(e)).map(([n, e]) => [n, rectOf(e)]);
    items.forEach(([n, r]) => {
      if (r.y0 < Z.header.top - 1) add(1, `the ${n} starts ${pc(r.y0)} down the screen; the header row starts at ${pc(Z.header.top)}.`);
      if (r.y1 > Z.header.bottom + 1) add(1, `the ${n} ends ${pc(r.y1)} down the screen, past the ${pc(Z.header.bottom)} bottom of the header row.`);
    });
    if (items.length === 2 && Math.abs((items[0][1].y0 + items[0][1].y1) / 2 - (items[1][1].y0 + items[1][1].y1) / 2) > 8)
      add(1, "the date tag and the progress dots are not on one line.");
    Array.from(header.children).forEach((c) => {
      if (c !== date && c !== dots) add(1, `the header row holds something besides the date tag and the dots (${nameOf(c)}).`);
    });
  }

  // ---- Rule 2: map window ---------------------------------------------------------
  const winMin = num("--window-min");
  if ((Z.win.bottom - Z.win.top) / H * 100 < winMin - 0.05)
    add(2, `the map window is only ${pc(Z.win.top)} to ${pc(Z.win.bottom)} (${Math.round((Z.win.bottom - Z.win.top) / H * 1000) / 10}% of the screen) because the text${Z.legend.on ? " and legend take" : " takes"} so much room; it must be at least ${winMin}% tall. Shorten the text.`);
  const subject = window.TSUReel.subjectBox();
  if (!subject) {
    add(2, "the beat does not say what its subject is (no `fit` points), so the check cannot confirm it is framed inside the map window.");
  } else {
    const o = window.TSUReel.overflow(subject, WIN, 1);
    if (o)
      add(2, `the subject of the beat is framed from ${pc(subject.y0)} to ${pc(subject.y1)} down the screen (${Math.round(subject.x0)} to ${Math.round(subject.x1)}px across); it runs ${side(o)} of the map window, which is ${pc(WIN.y0)} to ${pc(WIN.y1)} down the screen (just above the ${Z.legend.on ? "legend" : "text block"}) and inside the side margins (${Math.round(WIN.x0)} to ${Math.round(WIN.x1)}px).`);
  }
  const graphics = Array.from(stage.querySelectorAll(".reel-graphic, img, svg"))
    .filter((e) => !e.closest(".reel-map, .reel-guides, .cal-ignore") && !(e.parentElement && e.parentElement.closest(".reel-graphic")) && shown(e));
  if (graphics.length > 1)
    add(2, `${graphics.length} graphics are showing (${graphics.map(nameOf).join(", ")}); a beat may have at most one small graphic in the map window.`);
  const winArea = W * (Z.win.bottom - Z.win.top), maxArea = num("--graphic-max-area");
  graphics.forEach((g) => {
    const r = rectOf(g), name = nameOf(g);
    if (!g.classList.contains("reel-graphic"))
      add(2, `an image or drawing (${name}) is on screen but is not marked as the beat's graphic (class "reel-graphic"), so it cannot be placed in the map window.`);
    if (r.y0 < Z.win.top - 1 || r.y1 > Z.win.bottom + 1)
      add(2, `the graphic (${name}) runs from ${pc(r.y0)} to ${pc(r.y1)} down the screen; it must sit inside the map window, ${pc(Z.win.top)} to ${pc(Z.win.bottom)} on this beat.`);
    const share = (r.x1 - r.x0) * (r.y1 - r.y0) / winArea * 100;
    if (share > maxArea) add(2, `the graphic (${name}) covers ${Math.round(share)}% of the map window; a small graphic is at most ${maxArea}%.`);
    if (subject && overlaps(r, subject)) add(2, `the graphic (${name}) covers the subject of the beat; move it so it does not sit over what the map is showing.`);
  });
  const KNOWN = ["reel-map", "reel-scrim", "reel-header", "reel-legend", "reel-caption", "reel-graphic", "reel-guides"];
  Array.from(stage.children).forEach((c) => {
    if (!KNOWN.some((cls) => c.classList.contains(cls)))
      add(2, `the stage holds an extra element (${nameOf(c)}); only the map, the text-block scrim, the header row, the legend, the text block and one graphic belong on it.`);
  });
  const ZONES = ".reel-header, .reel-legend, .reel-caption, .reel-graphic";
  const stray = stageText.filter((t) => !t.el.closest(ZONES));
  if (stray.length) add(2, `text is on screen outside the header row, legend, text block and graphic ("${clip(stray[0].text)}").`);

  // ---- Rule 3: text block -------------------------------------------------------------
  const cap = stage.querySelector(".reel-caption");
  if (!cap) {
    add(3, "there is no text block (.reel-caption).");
  } else {
    const kicker = cap.querySelector(".reel-kicker"), title = cap.querySelector(".reel-title"), sub = cap.querySelector(".reel-sub");
    Array.from(cap.children).forEach((c) => {
      if (!["reel-kicker", "reel-title", "reel-sub"].some((cls) => c.classList.contains(cls)))
        add(3, `the text block holds something besides a kicker, a headline and one supporting line (${nameOf(c)}). No paragraphs.`);
    });
    if (cap.querySelectorAll(".reel-sub").length > 1) add(3, "the text block has more than one supporting line.");
    // Where the text sits.
    const mine = stageText.filter((t) => t.el.closest(".reel-caption"));
    if (mine.length) {
      const top = Math.min(...mine.flatMap((t) => t.rects.map((r) => r.y0)));
      const bottom = Math.max(...mine.flatMap((t) => t.rects.map((r) => r.y1)));
      // Anchored: the last line ends on the bottom line, whatever the amount of text.
      const boxBottom = rectOf(cap).y1;   // the block's own box: its last line box ends here (the glyphs sit a few px higher)
      if (Math.abs(boxBottom - Z.text.bottom) > 1) add(3, `the text block ends ${pc(boxBottom)} down the screen; its last line must end at ${pc(Z.text.bottom)} (the block is anchored to the bottom and grows upward).`);
      const titleEl = cap.querySelector(".reel-title"), headLim = H1(num("--headline-bottom"));
      if (titleEl && shown(titleEl) && rectOf(titleEl).y1 > headLim + 1)
        add(3, `the headline ends ${pc(rectOf(titleEl).y1)} down the screen; its last line must end at or above ${pc(headLim)}${Z.text.hasSub === false ? " (this beat has no supporting line, so the headline is the last line)" : ""}.`);
      if (top < Z.win.top + H1(winMin) - 1) add(3, `the text block starts ${pc(top)} down the screen, which leaves the map window less than ${winMin}% of the screen; shorten the text.`);
      const align = getComputedStyle(cap).textAlign;
      const left = W * safe.left / 100;
      if (!["left", "start"].includes(align) || mine.some((t) => t.rects.some((r) => r.x0 > left + 8)))
        add(3, "the text block is not left-aligned.");
    } else {
      add(3, "the text block is empty.");
    }
    if (kicker && shown(kicker) && lineCount(kicker) > 1) add(3, `the kicker ("${clip(textOf(kicker))}") runs onto a second line; it must be one line.`);
    if (title && shown(title)) {
      const w = words(textOf(title)), l = lineCount(title), maxW = num("--headline-max-words"), maxL = num("--headline-max-lines");
      if (w > maxW) add(3, `the headline ("${clip(textOf(title))}") is ${w} words; the limit is ${maxW}.`);
      if (l > maxL) add(3, `the headline ("${clip(textOf(title))}") runs to ${l} lines; the limit is ${maxL}.`);
    } else add(3, "the beat has no headline.");
    if (sub && shown(sub) && textOf(sub)) {
      const w = words(textOf(sub)), l = lineCount(sub), maxW = num("--support-max-words"), maxL = num("--support-max-lines");
      if (w > maxW) add(3, `the supporting line ("${clip(textOf(sub))}") is ${w} words; the limit is ${maxW}.`);
      if (l > maxL) add(3, `the supporting line ("${clip(textOf(sub))}") runs to ${l} lines, which makes it a paragraph; the limit is ${maxL}.`);
    }
  }
  // The darkening: one gradient (.reel-scrim) that follows the text on this beat, and nothing
  // else that darkens.
  const scrims = stage.querySelectorAll(".reel-scrim");
  if (scrims.length !== 1) {
    add(3, `the text block needs exactly one .reel-scrim darkening the map behind it; found ${scrims.length}.`);
  } else {
    const sc = window.TSUReel.scrimInfo(), lead = H1(num("--scrim-lead"));
    const legendTop = Z.text.top - H1(num("--legend-h"));   // where the legend is, or would be
    if (Math.abs(sc.top - (legendTop - lead)) > H1(0.3))
      add(3, `the gradient starts ${pc(sc.top)} down the screen; it must start fully transparent ${num("--scrim-lead")}% above the legend, at ${pc(legendTop - lead)} on this beat.`);
    if (sc.darkAt === null || sc.startAlpha === null)
      add(3, "the check could not read the gradient's colour stops, so it cannot confirm the darkening is fully transparent at the top and fully dark by the kicker.");
    else {
      if (sc.startAlpha !== 0) add(3, `the gradient does not start fully transparent (it starts at ${sc.startAlpha} opacity), so its upper edge would show.`);
      if (sc.darkAt > Z.text.top + H1(0.3)) add(3, `the gradient is not fully dark until ${pc(sc.darkAt)} down the screen; it must be fully dark by the top of the text block, ${pc(Z.text.top)}.`);
      if (sc.endAlpha < sc.maxAlpha - 0.005) add(3, "the gradient gets lighter again towards the bottom; it must stay dark all the way down.");
    }
    if (sc.bottom < H - 1) add(3, `the gradient ends ${pc(sc.bottom)} down the screen; it must stay dark all the way to the bottom of the stage (so no lower edge shows).`);
  }
  Array.from(stage.querySelectorAll("*")).forEach((e) => {
    if (e === stage || e.closest(".reel-map, .reel-guides, .reel-scrim, .cal-ignore") || !shown(e)) return;
    const cs = getComputedStyle(e), m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor);
    const alpha = m ? (m[1].split(",").length > 3 ? parseFloat(m[1].split(",")[3]) : 1) : 0;
    if (alpha <= 0 && cs.backgroundImage === "none") return;
    const r = rectOf(e), share = (r.x1 - r.x0) * (r.y1 - r.y0) / (W * H) * 100;
    if (share >= 5) add(3, `${nameOf(e)} covers ${Math.round(share)}% of the screen with a background; the map may be darkened only behind the text block.`);
  });

  // ---- Rule 4: legend -------------------------------------------------------------------
  const rows = Array.from(stage.querySelectorAll(".reel-leg-row")).filter(shown);
  const maxItems = num("--legend-max-items");
  if (rows.length > maxItems)
    add(4, `the legend shows ${rows.length} items (${rows.map((r) => `"${clip(textOf(r))}"`).join(", ")}); the limit is ${maxItems}.`);
  if (rows.length) {
    const rr = rows.map(rectOf), mids = rr.map((r) => (r.y0 + r.y1) / 2);
    if (Math.max(...mids) - Math.min(...mids) > 8) add(4, "the legend runs over more than one row; it must be one compact row.");
    rr.forEach((r, i) => {
      if (r.y0 < Z.legend.top - 1 || r.y1 > Z.legend.bottom + 1)
        add(4, `the legend item "${clip(textOf(rows[i]))}" sits from ${pc(r.y0)} to ${pc(r.y1)} down the screen; the legend belongs directly above the kicker, ${pc(Z.legend.top)} to ${pc(Z.legend.bottom)} on this beat.`);
    });
  }

  // ---- Rule 5: type sizes --------------------------------------------------------------
  const T = { headline: num("--type-headline"), support: num("--type-support"), small: num("--type-small") };
  const effSize = (p) => {
    const fs = parseFloat(getComputedStyle(p).fontSize);
    let q = p;
    while (q && !q.offsetWidth) q = q.parentElement;     // inline boxes: measure the nearest laid-out box
    const scale = q && q.offsetWidth ? q.getBoundingClientRect().width / q.offsetWidth : k;
    return fs * scale / k;
  };
  const wanted = [[".reel-title", T.headline, "headline"], [".reel-sub", T.support, "supporting line"],
                  [".reel-kicker", T.small, "kicker"], [".reel-leg-row", T.small, "legend"], [".reel-date", T.small, "date tag"]];
  const sized = {};
  stageText.concat(mapText).forEach((t) => {
    const size = effSize(t.el);
    const hit = wanted.find(([sel]) => t.el.closest(sel));
    const key = hit ? hit[2] : "text (" + nameOf(t.el) + ")";
    if (sized[key]) return;
    sized[key] = true;
    if (hit && Math.abs(size - hit[1]) > 0.6)
      add(5, `the ${hit[2]} is set at ${Math.round(size * 10) / 10}px; it must be ${hit[1]}px (sizes are set once, in reel-frame.css).`);
    else if (!hit && size < T.small - 0.6)
      add(5, `some text ("${clip(t.text)}") is ${Math.round(size * 10) / 10}px; nothing may be smaller than ${T.small}px.`);
  });

  // ---- Rule 6: map labels inside the map window and the side margins --------------------
  // The reel's own labels are fitted into the camera, so they must all be inside; the
  // basemap's place names are hidden by the frame when they would cross out of the window.
  const seenLabel = {};
  mapText.forEach((t) => {
    if (!t.el.closest(".reel-maplabel")) {
      if (!seenLabel[t.text]) add(6, `a map label ("${clip(t.text)}") is not marked class "reel-maplabel", so the frame cannot fit it into the map window.`);
      seenLabel[t.text] = true;
    }
  });
  window.TSUReel.ownLabels().forEach((l) => {
    const o = window.TSUReel.overflow(l, WIN, 1);
    if (o && !seenLabel[l.text]) {
      seenLabel[l.text] = true;
      add(6, `the map label "${clip(l.text)}" is showing from ${pc(l.y0)} to ${pc(l.y1)} down the screen and ${Math.round(l.x0)} to ${Math.round(l.x1)}px across; it runs ${side(o)} of the map window (${pc(WIN.y0)} to ${pc(WIN.y1)}, ${Math.round(WIN.x0)} to ${Math.round(WIN.x1)}px across).`);
    }
  });
  const basemap = window.TSUReel.labelsUnderUI();
  const names = Array.from(new Set(basemap)).map((n) => `"${clip(String(n))}"`);
  if (names.length)
    add(6, `${names.length} basemap place name${names.length === 1 ? " is" : "s are"} still showing outside the map window or the side margins (${names.slice(0, 4).join(", ")}${names.length > 4 ? ", and " + (names.length - 4) + " more" : ""}); they should be hidden.`);

  return { problems: out, stats: window.TSUReel.labelStats() };
};
