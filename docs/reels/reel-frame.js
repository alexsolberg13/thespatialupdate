/* The Spatial Update: shared reel frame (behaviour).
 *
 * Loaded by every reel after reel-frame.css. Handles: fitting the 1080x1920
 * stage to the screen, the map's fixed scale, tap/keyboard navigation, the
 * ?guides=1 overlay, fullscreen, hold-to-exit, the camera that frames each beat's
 * subject inside the map window, the hiding of map labels that fall under the
 * header / legend / text block, and the measurements `npm run check-reels` uses.
 * The safe zone and the layout zones are NOT defined here; they are read from the
 * --safe-*, --corner-*, --header-*, --window-*, --legend-* and --text-* numbers
 * in reel-frame.css.
 *
 * A reel calls TSUReel.bind({ count, step, jump, map, beat }) once it is ready,
 * and, once its map style has loaded, TSUReel.attachMap(map) and
 * TSUReel.solveAll(map, BEATS).
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

  // The layout zones, in stage pixels from the top, read from reel-frame.css.
  function zones() {
    var H = STAGE_H / 100;
    return {
      header: { top: cssNum("--header-top") * H, bottom: cssNum("--header-bottom") * H },
      win:    { top: cssNum("--window-top") * H, bottom: cssNum("--window-bottom") * H },
      legend: { top: cssNum("--legend-top") * H, bottom: cssNum("--legend-bottom") * H },
      text:   { top: cssNum("--text-top") * H,   bottom: cssNum("--text-bottom") * H }
    };
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

    // The layout bands: a dashed line at the top of each, and one at the very bottom
    // of the text block.
    var z = zones();
    function band(name, a, b) { return name + " " + cssNum(a) + "-" + cssNum(b) + "%"; }
    [[z.header.top, band("Header row", "--header-top", "--header-bottom")],
     [z.win.top, band("Map window", "--window-top", "--window-bottom")],
     [z.legend.top, band("Legend", "--legend-top", "--legend-bottom")],
     [z.text.top, band("Text block", "--text-top", "--text-bottom")], [z.text.bottom, ""]
    ].forEach(function (b) {
      var line = el("div", "reel-guide-zone", guides);
      line.style.top = b[0] + "px";
      if (b[1]) el("span", "", line, b[1]);
    });
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

  // ---- The camera: frame each beat's subject inside the map window ------------------
  // A beat gives `fit` (the points that make up its subject, [lng, lat]) and `z` (the
  // closest zoom it may use). solveCamera finds the largest zoom <= z at which the
  // subject fits inside the map window (19% to 58% down, inside the side margins,
  // minus FIT_MARGIN all round and any padL / padR stage pixels the reel reserves for
  // its graphic), and centres the subject in the window, not on the screen. The result
  // is stored on the beat as beat.cam = { center, zoom }; the reel flies to it.
  var FIT_MARGIN = 60;     // stage px kept clear above and below the subject inside the window
  var FIT_MARGIN_X = 40;   // ... and beside it, inside the side margins

  function mercY(lat) { return Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)); }
  function mercLat(y) { return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180 / Math.PI; }

  // Map pixels (what map.project returns) <-> stage pixels. The map container is
  // centred on the stage and scaled by MAP_SCALE.
  function toStage(map, p) {
    var c = map.getContainer();
    return { x: STAGE_W / 2 + (p.x - c.clientWidth / 2) * MAP_SCALE,
             y: STAGE_H / 2 + (p.y - c.clientHeight / 2) * MAP_SCALE };
  }
  function toMap(map, x, y) {
    var c = map.getContainer();
    return [c.clientWidth / 2 + (x - STAGE_W / 2) / MAP_SCALE,
            c.clientHeight / 2 + (y - STAGE_H / 2) / MAP_SCALE];
  }
  function pointsBox(map, pts) {
    var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    pts.forEach(function (ll) {
      var p = toStage(map, map.project(ll));
      b.x0 = Math.min(b.x0, p.x); b.x1 = Math.max(b.x1, p.x);
      b.y0 = Math.min(b.y0, p.y); b.y1 = Math.max(b.y1, p.y);
    });
    return b;
  }

  function solveCamera(map, beat) {
    var pts = beat.fit && beat.fit.length ? beat.fit : [beat.c];
    var s = safe(), Z = zones();
    var x0 = STAGE_W * s.left / 100 + FIT_MARGIN_X + (beat.padL || 0);
    var x1 = STAGE_W * (1 - s.right / 100) - FIT_MARGIN_X - (beat.padR || 0);
    var y0 = Z.win.top + FIT_MARGIN, y1 = Z.win.bottom - FIT_MARGIN;
    var tx = (x0 + x1) / 2, ty = (y0 + y1) / 2;      // where the subject's centre should land

    var lngs = pts.map(function (p) { return p[0]; }), lats = pts.map(function (p) { return p[1]; });
    var mid = [(Math.min.apply(null, lngs) + Math.max.apply(null, lngs)) / 2,
               mercLat((mercY(Math.min.apply(null, lats)) + mercY(Math.max.apply(null, lats))) / 2)];

    // Put the subject's centre on (tx, ty) at zoom z; return the camera and the box.
    function place(z) {
      var center = mid;
      for (var k = 0; k < 5; k++) {
        map.jumpTo({ center: center, zoom: z });
        var b = pointsBox(map, pts);
        var dx = tx - (b.x0 + b.x1) / 2, dy = ty - (b.y0 + b.y1) / 2;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) break;
        var ll = map.unproject(toMap(map, STAGE_W / 2 - dx, STAGE_H / 2 - dy));
        center = [ll.lng, ll.lat];
      }
      map.jumpTo({ center: center, zoom: z });
      return { center: center, zoom: z, box: pointsBox(map, pts) };
    }
    function fits(r) { return r.box.x1 - r.box.x0 <= x1 - x0 + 0.5 && r.box.y1 - r.box.y0 <= y1 - y0 + 0.5; }

    var best = place(beat.z);
    if (!fits(best)) {
      var lo = 0.3, hi = beat.z; best = null;
      for (var i = 0; i < 18; i++) {
        var m = (lo + hi) / 2, r = place(m);
        if (fits(r)) { best = r; lo = m; } else { hi = m; }
      }
      if (!best) best = place(lo);
    }
    return { center: best.center, zoom: best.zoom };
  }

  // Solve every beat once the style is loaded; leaves the camera where it was.
  function solveAll(map, beats) {
    var keep = { center: map.getCenter(), zoom: map.getZoom() };
    LB.suspended = true;
    beats.forEach(function (b) { b.cam = solveCamera(map, b); });
    map.jumpTo(keep);
    LB.suspended = false;
  }

  // The projected box (stage px) of the current beat's subject, for the check.
  function subjectBox() {
    var m = hooks && hooks.map && hooks.map(), b = hooks && hooks.beat && hooks.beat();
    if (!m || !b || !b.fit || !b.fit.length) return null;
    return pointsBox(m, b.fit);
  }

  // ---- Map labels under the header row, the legend or the text block -----------------
  // Two kinds of label: ones a reel draws itself (HTML, class .reel-maplabel) and the
  // basemap's own place names (drawn inside the map canvas). Both are hidden wherever
  // they fall under a band that holds text. The basemap's are found with
  // queryRenderedFeatures and filtered out by name once the camera has settled; they
  // are faded out while the camera moves so none slide under the text.
  var LB = { map: null, layers: [], hidden: {}, touched: {}, token: 0, busy: null,
             suspended: false, hiddenCount: 0, unnamed: 0, passes: 0 };

  // The bands (stage px from the top) that hold text this beat.
  function uiBands() {
    var Z = zones(), bands = [Z.header, Z.text];
    if (document.querySelector(".reel-legend .reel-leg-row.on")) bands.push(Z.legend);
    return bands;
  }

  function hideHtmlLabels() {
    var bands = uiBands(), sr = stage.getBoundingClientRect(), k = sr.width / STAGE_W;
    var labels = stage.querySelectorAll(".reel-maplabel");
    for (var i = 0; i < labels.length; i++) {
      var r = labels[i].getBoundingClientRect();
      if (!r.width && !r.height) continue;
      var top = (r.top - sr.top) / k, bottom = (r.bottom - sr.top) / k;
      var under = bands.some(function (b) { return bottom > b.top && top < b.bottom; });
      labels[i].classList.toggle("reel-label-hidden", under);
    }
  }

  function labelIds() { return LB.layers.map(function (l) { return l.id; }); }

  function fadeBasemapLabels(out) {
    LB.layers.forEach(function (l) {
      try { LB.map.setPaintProperty(l.id, "text-opacity", out ? 0 : l.opacity); } catch (e) {}
    });
  }

  // Legacy-style filter: the layer's own filter plus "not one of the hidden names".
  function filterFor(l) {
    var h = LB.hidden[l.id], parts = l.filter ? [l.filter] : [];
    if (h) ["name", "name_en"].forEach(function (key) {
      var names = Object.keys(h[key] || {});
      if (names.length) parts.push(["!in", key].concat(names));
    });
    return parts.length === 0 ? null : parts.length === 1 ? parts[0] : ["all"].concat(parts);
  }
  function applyFilters() {
    LB.layers.forEach(function (l) {
      if (LB.touched[l.id]) { try { LB.map.setFilter(l.id, filterFor(l)); } catch (e) {} }
    });
  }
  function resetFilters() {
    if (!Object.keys(LB.touched).length) return;
    LB.hidden = {};
    applyFilters();
    LB.touched = {};
  }

  // Basemap labels now showing inside the bands. Returns [{ layer, name, key }].
  function basemapUnder() {
    var m = LB.map, out = [];
    if (!m || !LB.layers.length) return out;
    var cw = m.getContainer().clientWidth;
    uiBands().forEach(function (b) {
      var feats = m.queryRenderedFeatures([[0, toMap(m, 0, b.top)[1]], [cw, toMap(m, 0, b.bottom)[1]]], { layers: labelIds() });
      feats.forEach(function (f) { out.push({ layer: f.layer.id, props: f.properties || {} }); });
    });
    return out;
  }

  function hidePass() {
    var changed = false;
    basemapUnder().forEach(function (f) {
      var key = f.props.name_en != null ? "name_en" : f.props.name != null ? "name" : null;
      if (!key) { LB.unnamed++; return; }
      var h = LB.hidden[f.layer] || (LB.hidden[f.layer] = { name: {}, name_en: {} });
      // Hide it by both of its names so a layer that shows the other one drops it too.
      var added = false;
      ["name", "name_en"].forEach(function (k) {
        var v = f.props[k];
        if (v != null && !h[k][v]) { h[k][v] = 1; added = true; }
      });
      if (added) { LB.touched[f.layer] = true; LB.hiddenCount++; changed = true; }
    });
    if (changed) applyFilters();
    return changed;
  }

  function whenIdle() {
    return new Promise(function (resolve) {
      var done = false, m = LB.map;
      function fin() { if (!done) { done = true; resolve(); } }
      m.once("idle", fin);
      m.triggerRepaint();
      setTimeout(fin, 10000);   // never hang on a slow network
    });
  }

  function settleLabels(token) {
    var n = 0;
    function pass() {
      return whenIdle().then(function () {
        if (token !== LB.token) return;                      // the camera moved again
        LB.passes++;
        if (hidePass() && ++n < 6) return pass();              // hiding one can reveal another
        fadeBasemapLabels(false);
        hideHtmlLabels();
      });
    }
    return pass();
  }

  function startSettle() {
    if (!LB.map || LB.suspended) return LB.busy || Promise.resolve();
    var token = ++LB.token;
    LB.busy = settleLabels(token);
    return LB.busy;
  }

  // Resolves once the labels for the current camera have settled (used by the check).
  function settle() {
    if (!LB.map) return Promise.resolve();
    return startSettle().then(function () { hideHtmlLabels(); });
  }

  function attachMap(map) {
    LB.map = map;
    LB.layers = map.getStyle().layers
      .filter(function (l) { return l.type === "symbol" && l.layout && l.layout["text-field"]; })
      .map(function (l) {
        var o = map.getPaintProperty(l.id, "text-opacity");
        return { id: l.id, filter: l.filter || null, opacity: o == null ? 1 : o };
      });
    map.on("movestart", function () {
      if (LB.suspended) return;
      LB.token++;                                          // abandon any settle in progress
      fadeBasemapLabels(true);
      resetFilters();
    });
    map.on("moveend", startSettle);
    map.on("render", hideHtmlLabels);
    startSettle();
  }

  function labelStats() {
    return { layers: LB.layers.length, hidden: LB.hiddenCount, unnamed: LB.unnamed, passes: LB.passes,
             loaded: !!LB.map && LB.map.loaded() };
  }
  function labelsUnderUI() {
    return basemapUnder().map(function (f) { return f.props.name_en || f.props.name || ("(" + f.layer + ")"); });
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
    ["reel-legend", "legend"], ["reel-graphic", "graphic"], ["reel-caption", "caption"], ["reel-logo", "logo"]
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
    var boxes = stage.querySelectorAll(".reel-date, .reel-dots, .reel-legend, .reel-graphic, .reel-caption, .reel-logo, img, svg");
    Array.prototype.forEach.call(boxes, function (b) {
      if (b.closest(".reel-map, .reel-guides, .cal-ignore") || !shown(b)) return;
      test(b, b.getBoundingClientRect());
    });
    return found;
  }

  // ---- Public API ---------------------------------------------------------------
  window.TSUReel = {
    STAGE_W: STAGE_W, STAGE_H: STAGE_H, MAP_SCALE: MAP_SCALE,
    safe: safe, zones: zones, metrics: metrics, mapOptions: mapOptions, dots: dots, measure: measure,
    // Camera and labels (see the sections above). A reel calls attachMap(map) and
    // solveAll(map, BEATS) once its style has loaded; the rest is for the check.
    attachMap: attachMap, solveAll: solveAll, solveCamera: solveCamera, settle: settle,
    subjectBox: subjectBox, labelsUnderUI: labelsUnderUI, labelStats: labelStats,
    SHOW_DATE: params.get("date") !== "off",
    // A reel calls this once. count = number of beats; step(dir) moves with the
    // map animation; jump(i) goes straight to beat i; mapReady() is optional;
    // map() returns the MapLibre map and beat() the current beat (with its `fit`).
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
