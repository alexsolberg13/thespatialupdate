/* The Spatial Update: shared reel frame (behaviour).
 *
 * Loaded by every reel after reel-frame.css. Handles: fitting the 1080x1920
 * stage to the screen, the map's fixed scale, tap/keyboard navigation, the
 * ?guides=1 overlay, fullscreen, hold-to-exit, and the layout measurement that
 * `npm run check-reels` uses. The safe zone is NOT defined here; it is read from
 * the --safe-* and --corner-* numbers in reel-frame.css.
 *
 * A reel calls TSUReel.bind({ count, step, jump }) once it is ready.
 */
(function () {
  "use strict";

  var STAGE_W = 1080, STAGE_H = 1920;
  // The map is rendered at this scale: a 1080x1920 stage shows the same
  // geography a 298x530 phone preview did, so zoom levels keep their meaning.
  var MAP_SCALE = STAGE_W / 298;

  var params = new URLSearchParams(window.location.search);
  var root = document.documentElement;
  var stage = document.getElementById("reel-stage");
  var hooks = null;

  function cssNum(name) {
    return parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;
  }

  // The safe zone, in percent of the stage, read from reel-frame.css: four
  // margins, plus a blocked corner at the bottom right (corner.w % of the width,
  // corner.h % of the height).
  function safe() {
    return { top: cssNum("--safe-top"), bottom: cssNum("--safe-bottom"),
             left: cssNum("--safe-left"), right: cssNum("--safe-right"),
             corner: { w: cssNum("--corner-w"), h: cssNum("--corner-h") } };
  }

  // ---- The physical screen -----------------------------------------------------
  // In full-screen Home Screen mode iOS reports a viewport (innerHeight / 100vh)
  // about 59 points shorter than the screen, so centring on the viewport leaves
  // the stage too high. When running as a Home Screen app we therefore centre on
  // the physical screen (screen.height, in points) instead. In a normal browser
  // window screen.height is the monitor, not the window, so there we use the
  // window. ?screen=393x852 forces a screen size (used by the reel check).
  function screenSize() {
    var w = window.innerWidth, h = window.innerHeight, source = "window";
    var forced = /^(\d+)x(\d+)$/.exec(params.get("screen") || "");
    var standalone = window.navigator.standalone === true ||
      (window.matchMedia && (matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches));
    var sw = (window.screen && window.screen.width) || 0, sh = (window.screen && window.screen.height) || 0;
    var pw = Math.min(sw, sh), ph = Math.max(sw, sh);   // portrait order, whatever the rotation
    if (forced) { pw = +forced[1]; ph = +forced[2]; }
    if ((forced || standalone) && Math.abs(pw - w) <= 2 && ph >= h) { h = ph; source = forced ? "forced" : "screen"; }
    return { w: w, h: h, source: source, standalone: !!standalone, viewportH: window.innerHeight, screenH: ph };
  }

  // ---- Fit the stage to the screen, centred on the whole screen -----------------
  var mapBox = null, lastScreen = null;
  function fit() {
    var sc = screenSize();
    lastScreen = sc;
    var s = Math.min(sc.w / STAGE_W, sc.h / STAGE_H);
    root.style.setProperty("--reel-scale", String(s));
    root.style.setProperty("--reel-cy", (sc.h / 2) + "px");   // centre of the physical screen
    document.body.style.height = sc.h + "px";                 // draw all the way to the bottom
    layoutMap(s, sc);
    if (window.TSUReel && TSUReel.onFit) TSUReel.onFit();
  }
  // The map covers the whole screen (stage plus any strips), centred on the stage.
  function layoutMap(s, sc) {
    if (!mapBox) return;
    var w = Math.max(STAGE_W, sc.w / s), h = Math.max(STAGE_H, sc.h / s);
    mapBox.style.width = (w / MAP_SCALE) + "px";
    mapBox.style.height = (h / MAP_SCALE) + "px";
    mapBox.style.left = ((STAGE_W - w) / 2) + "px";
    mapBox.style.top = ((STAGE_H - h) / 2) + "px";
  }
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", fit);
  window.addEventListener("load", fit);
  // iOS can report the viewport late or change it after launch: re-fit shortly after.
  setTimeout(fit, 300); setTimeout(fit, 1200);
  fit();

  // Where the stage actually sits, in points: screen height, viewport height, and
  // the strip above and below the stage (for the calibration readout).
  function metrics() {
    var sc = lastScreen || screenSize();
    var r = stage.getBoundingClientRect();
    return { screenH: sc.screenH, viewportH: sc.viewportH, usedH: sc.h, source: sc.source, standalone: sc.standalone,
             above: r.top, below: sc.h - r.bottom };
  }

  // ---- Chrome injected into the stage ------------------------------------------
  function el(tag, cls, parent, text) {
    var e = document.createElement(tag);
    e.className = cls;
    if (text) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  var guides = null;
  var SVGNS = "http://www.w3.org/2000/svg";
  function buildGuides() {
    guides = el("div", "reel-guides", stage);
    el("div", "reel-guide-block reel-guide-top", guides);
    el("div", "reel-guide-block reel-guide-bottom", guides);
    el("div", "reel-guide-block reel-guide-left", guides);
    el("div", "reel-guide-block reel-guide-right", guides);
    el("div", "reel-guide-block reel-guide-corner", guides);
    el("div", "reel-guide-crop reel-guide-crop-top", guides);
    el("div", "reel-guide-crop reel-guide-crop-bottom", guides);

    // The safe area outline: a rectangle with the bottom-right corner cut out.
    var s = safe();
    var L = STAGE_W * s.left / 100, R = STAGE_W * (1 - s.right / 100);
    var T = STAGE_H * s.top / 100, B = STAGE_H * (1 - s.bottom / 100);
    var cx = STAGE_W * (1 - s.corner.w / 100), cy = STAGE_H * (1 - s.corner.h / 100);
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "reel-guide-outline");
    svg.setAttribute("viewBox", "0 0 " + STAGE_W + " " + STAGE_H);
    var poly = document.createElementNS(SVGNS, "polygon");
    poly.setAttribute("points", [[L, T], [R, T], [R, cy], [cx, cy], [cx, B], [L, B]].map(function (p) { return p[0] + "," + p[1]; }).join(" "));
    poly.setAttribute("fill", "none"); poly.setAttribute("stroke", "#3ecfb2");
    poly.setAttribute("stroke-width", "4"); poly.setAttribute("stroke-dasharray", "18 12");
    svg.appendChild(poly);
    guides.appendChild(svg);

    var t = el("div", "reel-guide-label", guides, "Blocked " + s.top + "%");
    t.style.left = "50%"; t.style.top = "20px"; t.style.transform = "translateX(-50%)";
    var b = el("div", "reel-guide-label", guides, "Blocked " + s.bottom + "%");
    b.style.left = "50%"; b.style.bottom = "20px"; b.style.transform = "translateX(-50%)";
    var c = el("div", "reel-guide-label", guides, "IG buttons");
    c.style.left = cx + "px"; c.style.top = (cy + 20) + "px";
  }

  function setGuides(on) {
    document.body.classList.toggle("reel-guides-on", on);
  }

  function buildChrome() {
    buildGuides();
    // Invisible tap zones over the whole screen. Nothing else is ever drawn.
    var left = el("div", "reel-tap-l", document.body);
    var right = el("div", "reel-tap-r", document.body);
    left.addEventListener("click", function () { go(-1); });
    right.addEventListener("click", function () { go(1); });

    // Hold a finger down for a second (anywhere) to go back to the reels index.
    var timer = null;
    function arm() { disarm(); timer = setTimeout(function () { window.location.href = "index.html"; }, 1000); }
    function disarm() { if (timer) { clearTimeout(timer); timer = null; } }
    [left, right].forEach(function (z) {
      z.addEventListener("touchstart", arm, { passive: true });
      ["touchend", "touchmove", "touchcancel"].forEach(function (ev) { z.addEventListener(ev, disarm, { passive: true }); });
      z.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    });
  }

  function go(dir) { if (hooks) hooks.step(dir); }

  function enterFull() {
    var r = root.requestFullscreen;
    if (r) { try { r.call(root); } catch (e) {} }
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { go(1); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { go(-1); e.preventDefault(); }
    else if (e.key === "f" || e.key === "F") { enterFull(); }
    else if (e.key === "Escape" || e.key === "Backspace") { window.location.href = "index.html"; }
    else if (e.key === "g" || e.key === "G") { setGuides(!document.body.classList.contains("reel-guides-on")); }
  });

  // ---- The map: fixed size, fixed scale -----------------------------------------
  // Returns MapLibre options. The map container is laid out at stage size / MAP_SCALE,
  // scaled up by MAP_SCALE, and drawn with a matching pixel ratio, so the map's
  // centre and zoom frame the same area on every screen and stay crisp.
  function mapOptions(container, extra) {
    container.classList.add("reel-map");
    container.style.transform = "scale(" + MAP_SCALE + ")";
    mapBox = container;
    fit();
    var o = { container: container, interactive: false, attributionControl: false,
              fadeDuration: 0, pixelRatio: MAP_SCALE };
    for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
    return o;
  }

  // ---- Beat indicator dots -------------------------------------------------------
  function dots(container, count) {
    var els = [];
    for (var i = 0; i < count; i++) els.push(el("span", "", container));
    function style(k, i) {
      if (k === i) return "width:58px;height:18px;border-radius:11px;background:#c8a84e;transition:all .3s;";
      if (k <  i)  return "width:18px;height:18px;border-radius:50%;background:rgba(200,168,78,.55);transition:all .3s;";
      return "width:18px;height:18px;border-radius:50%;background:rgba(228,224,218,.22);transition:all .3s;";
    }
    return { set: function (i) { els.forEach(function (s, k) { s.setAttribute("style", style(k, i)); }); } };
  }

  // ---- Layout measurement (used by npm run check-reels) --------------------------
  var NAMES = [
    ["reel-kicker", "kicker line"], ["reel-title", "title"], ["reel-sub", "subtitle"],
    ["reel-date", "date badge"], ["reel-dots", "beat dots"], ["reel-leg-row", "legend row"],
    ["reel-legend", "legend"], ["reel-caption", "caption"], ["reel-logo", "logo"]
  ];

  function describe(node) {
    for (var e = node; e && e !== stage; e = e.parentNode) {
      if (!e.classList) continue;
      for (var i = 0; i < NAMES.length; i++) {
        if (e.classList.contains(NAMES[i][0])) {
          var t = (e.textContent || "").replace(/\s+/g, " ").trim();
          return NAMES[i][1] + (t ? ' ("' + (t.length > 50 ? t.slice(0, 47) + "..." : t) + '")' : "");
        }
      }
    }
    var p = node.nodeType === 3 ? node.parentNode : node;
    var tx = (p.textContent || "").replace(/\s+/g, " ").trim();
    return "<" + p.tagName.toLowerCase() + (p.id ? " #" + p.id : p.className ? " ." + String(p.className).split(" ")[0] : "") + ">" +
           (tx ? ' ("' + (tx.length > 50 ? tx.slice(0, 47) + "..." : tx) + '")' : "");
  }

  function shown(node) {
    for (var e = node.nodeType === 3 ? node.parentNode : node; e && e !== stage.parentNode; e = e.parentNode) {
      if (e.nodeType !== 1) continue;
      var cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return false;
    }
    return true;
  }

  // Returns [{ what, side, by }]: every visible piece of text, label, legend or
  // logo that crosses outside the safe zone, in stage pixels.
  function measure() {
    var s = safe();
    var lim = { top: STAGE_H * s.top / 100, bottom: STAGE_H * (1 - s.bottom / 100),
                left: STAGE_W * s.left / 100, right: STAGE_W * (1 - s.right / 100) };
    // The blocked corner: x beyond cornerX AND y beyond cornerY.
    var cornerX = STAGE_W * (1 - s.corner.w / 100), cornerY = STAGE_H * (1 - s.corner.h / 100);
    var sr = stage.getBoundingClientRect();
    var k = sr.width / STAGE_W;
    var found = [], seen = {};

    function add(label, side, by) {
      var key = label + "|" + side;
      if (seen[key]) return;
      seen[key] = true;
      found.push({ what: label, side: side, by: Math.round(by) });
    }

    function test(node, r) {
      if (!r.width && !r.height) return;
      var box = { top: (r.top - sr.top) / k, bottom: (r.bottom - sr.top) / k,
                  left: (r.left - sr.left) / k, right: (r.right - sr.left) / k };
      var tol = 1, label = describe(node);
      [["top", lim.top - box.top], ["bottom", box.bottom - lim.bottom],
       ["left", lim.left - box.left], ["right", box.right - lim.right]]
        .forEach(function (c) { if (c[1] > tol) add(label, c[0], c[1]); });
      // Into the blocked bottom-right corner (the Instagram button column).
      if (box.right > cornerX + tol && box.bottom > cornerY + tol) add(label, "corner", box.right - cornerX);
    }

    // Every text line, wherever it is in the stage (map and guides excepted).
    var w = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT, null);
    for (var n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      var p = n.parentNode;
      if (p.closest(".reel-map, .reel-guides, .cal-ignore")) continue;
      if (!shown(n)) continue;
      var range = document.createRange();
      range.selectNodeContents(n);
      var rects = range.getClientRects();
      for (var i = 0; i < rects.length; i++) test(n, rects[i]);
    }
    // Boxes: date badge, dots, legend, logos and images (not the map).
    var boxes = stage.querySelectorAll(".reel-date, .reel-dots, .reel-legend, .reel-caption, .reel-logo, img, svg");
    Array.prototype.forEach.call(boxes, function (b) {
      if (b.closest(".reel-map, .reel-guides, .cal-ignore") || !shown(b)) return;
      test(b, b.getBoundingClientRect());
    });
    return found;
  }

  // ---- Public API ---------------------------------------------------------------
  window.TSUReel = {
    STAGE_W: STAGE_W, STAGE_H: STAGE_H, MAP_SCALE: MAP_SCALE,
    safe: safe, metrics: metrics, mapOptions: mapOptions, dots: dots, measure: measure,
    SHOW_DATE: params.get("date") !== "off",
    // A reel calls this once. count = number of beats; step(dir) moves with the
    // map animation; jump(i) goes straight to beat i; mapReady() is optional.
    bind: function (h) {
      hooks = h;
      this.count = h.count;
      this.step = h.step;
      this.jump = h.jump;
      this.mapReady = h.mapReady || function () { return true; };
      this.ready = true;
    },
    setCounter: function () {}   // nothing is shown during playback
  };

  if (params.get("check") === "1") document.body.classList.add("reel-check");
  buildChrome();
  setGuides(params.get("guides") === "1");
})();
