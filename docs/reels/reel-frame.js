/* The Spatial Update: shared reel frame (behaviour).
 *
 * Loaded by every reel after reel-frame.css. Handles: fitting the 1080x1920
 * stage to the screen, the map's fixed scale, tap/keyboard navigation, the
 * ?guides=1 overlay, fullscreen, hold-to-exit, and the layout measurement that
 * `npm run check-reels` uses. The safe zone is NOT defined here; it is read from
 * the four --safe-* numbers in reel-frame.css.
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

  // The safe zone, in percent of the stage, read from reel-frame.css.
  function safe() {
    return { top: cssNum("--safe-top"), bottom: cssNum("--safe-bottom"),
             left: cssNum("--safe-left"), right: cssNum("--safe-right") };
  }

  // ---- Fit the stage to the screen, centred -----------------------------------
  var mapBox = null;
  function fit() {
    var s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    root.style.setProperty("--reel-scale", String(s));
    layoutMap(s);
  }
  // The map covers the whole screen (stage plus any strips), centred on the stage.
  function layoutMap(s) {
    if (!mapBox) return;
    var w = Math.max(STAGE_W, window.innerWidth / s), h = Math.max(STAGE_H, window.innerHeight / s);
    mapBox.style.width = (w / MAP_SCALE) + "px";
    mapBox.style.height = (h / MAP_SCALE) + "px";
    mapBox.style.left = ((STAGE_W - w) / 2) + "px";
    mapBox.style.top = ((STAGE_H - h) / 2) + "px";
  }
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", fit);
  fit();

  // ---- Chrome injected into the stage ------------------------------------------
  function el(tag, cls, parent, text) {
    var e = document.createElement(tag);
    e.className = cls;
    if (text) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  var guides = null;
  function buildGuides() {
    guides = el("div", "reel-guides", stage);
    el("div", "reel-guide-block reel-guide-top", guides);
    el("div", "reel-guide-block reel-guide-bottom", guides);
    el("div", "reel-guide-block reel-guide-left", guides);
    el("div", "reel-guide-block reel-guide-right", guides);
    el("div", "reel-guide-outline", guides);
    el("div", "reel-guide-crop reel-guide-crop-top", guides);
    el("div", "reel-guide-crop reel-guide-crop-bottom", guides);
    var s = safe();
    var t = el("div", "reel-guide-label", guides, "Blocked " + s.top + "%");
    t.style.left = "50%"; t.style.top = "20px"; t.style.transform = "translateX(-50%)";
    var b = el("div", "reel-guide-label", guides, "Blocked " + s.bottom + "%");
    b.style.left = "50%"; b.style.bottom = "20px"; b.style.transform = "translateX(-50%)";
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
    layoutMap(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
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
    var sr = stage.getBoundingClientRect();
    var k = sr.width / STAGE_W;
    var found = [], seen = {};

    function test(node, r) {
      if (!r.width && !r.height) return;
      var box = { top: (r.top - sr.top) / k, bottom: (r.bottom - sr.top) / k,
                  left: (r.left - sr.left) / k, right: (r.right - sr.left) / k };
      var tol = 1, label = describe(node);
      [["top", lim.top - box.top, "top"], ["bottom", box.bottom - lim.bottom, "bottom"],
       ["left", lim.left - box.left, "left"], ["right", box.right - lim.right, "right"]]
        .forEach(function (c) {
          if (c[1] > tol) {
            var key = label + "|" + c[0];
            if (seen[key]) return;
            seen[key] = true;
            found.push({ what: label, side: c[2], by: Math.round(c[1]) });
          }
        });
    }

    // Every text line, wherever it is in the stage (map and guides excepted).
    var w = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT, null);
    for (var n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      var p = n.parentNode;
      if (p.closest(".reel-map, .reel-guides")) continue;
      if (!shown(n)) continue;
      var range = document.createRange();
      range.selectNodeContents(n);
      var rects = range.getClientRects();
      for (var i = 0; i < rects.length; i++) test(n, rects[i]);
    }
    // Boxes: date badge, dots, legend, logos and images (not the map).
    var boxes = stage.querySelectorAll(".reel-date, .reel-dots, .reel-legend, .reel-caption, .reel-logo, img, svg");
    Array.prototype.forEach.call(boxes, function (b) {
      if (b.closest(".reel-map, .reel-guides") || !shown(b)) return;
      test(b, b.getBoundingClientRect());
    });
    return found;
  }

  // ---- Public API ---------------------------------------------------------------
  window.TSUReel = {
    STAGE_W: STAGE_W, STAGE_H: STAGE_H, MAP_SCALE: MAP_SCALE,
    safe: safe, mapOptions: mapOptions, dots: dots, measure: measure,
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
