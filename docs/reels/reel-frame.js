/* The Spatial Update: shared reel frame (behaviour).
 *
 * Loaded by every reel after reel-frame.css. Handles: fitting the 1080x1920
 * stage to the screen, the map's fixed scale, tap/keyboard navigation, the
 * ?guides=1 overlay, fullscreen, hold-to-exit, the text-block layout (the block is
 * anchored to the bottom, so its top, the legend, the scrim and the bottom of the
 * map window are measured per beat and published as --cap-top), the camera that
 * frames each beat's subject and labels inside the map window, the hiding of
 * basemap place names that would cross out of the map window, and the measurements
 * `npm run check-reels` uses. The safe zone and the layout numbers are NOT defined
 * here; they are read from the --safe-*, --corner-*, --header-*, --window-top,
 * --text-bottom, --legend-h and --scrim-* numbers in reel-frame.css.
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

  // ---- The layout: anchored text block, legend, map window ----------------------
  // The text block ends at --text-bottom and grows upward, so its top depends on the
  // beat's text. layout() measures it (stage px from the top) and derives the rest:
  // the legend is the row directly above it (only when a legend row is showing), and
  // the map window runs from --window-top down to just above the legend, or just above
  // the text block on a beat with no legend.
  function layout() {
    var H = STAGE_H / 100, sr = stage.getBoundingClientRect(), k = sr.width / STAGE_W || 1;
    // The block ends at --text-bottom; with no supporting line the headline is the last
    // line and it ends at --headline-bottom instead (the CSS moves the block to match).
    var cap = stage.querySelector(".reel-caption");
    var sub = cap && cap.querySelector(".reel-sub");
    var hasSub = !!(sub && (sub.textContent || "").trim());
    var textBottom = cssNum(hasSub ? "--text-bottom" : "--headline-bottom") * H, capTop = textBottom;
    if (cap) {
      var r = cap.getBoundingClientRect();
      if (r.width || r.height) capTop = (r.top - sr.top) / k;
    }
    var legendH = cssNum("--legend-h") * H;
    var legendOn = !!stage.querySelector(".reel-legend .reel-leg-row.on");
    return { capTop: capTop, textBottom: textBottom, hasSub: hasSub, legendH: legendH, legendOn: legendOn,
             winTop: cssNum("--window-top") * H,
             winBottom: legendOn ? capTop - legendH : capTop };
  }

  // The layout zones, in stage pixels from the top. win.bottom, legend and text.top
  // follow the text of the beat on screen.
  function zones() {
    var H = STAGE_H / 100, L = layout();
    return {
      header: { top: cssNum("--header-top") * H, bottom: cssNum("--header-bottom") * H },
      win:    { top: L.winTop, bottom: L.winBottom },
      legend: { top: L.capTop - L.legendH, bottom: L.capTop, on: L.legendOn },
      text:   { top: L.capTop, bottom: L.textBottom, hasSub: L.hasSub }
    };
  }

  // The map window as a rectangle (stage px): 19% to just above the legend, inside the
  // left and right margins. Everything a beat is about, and every map label it shows,
  // must sit inside it.
  function windowRect() {
    var s = safe(), Z = zones();
    return { x0: STAGE_W * s.left / 100, x1: STAGE_W * (1 - s.right / 100), y0: Z.win.top, y1: Z.win.bottom };
  }

  // Publish the top of the text block (% of the stage): the legend, the scrim and the
  // guides are positioned from it in CSS. Cheap, and safe to call as often as needed.
  var lastCapTop = null;
  function syncLayout() {
    var L = layout(), pct = L.capTop / (STAGE_H / 100);
    if (lastCapTop === null || Math.abs(pct - lastCapTop) > 0.001) {
      root.style.setProperty("--cap-top", String(pct));
      lastCapTop = pct;
    }
    drawBands();
    return L;
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
    return { w: w, h: h, source: source, standalone: !!standalone, viewportH: window.innerHeight, screenH: ph,
             top: h > window.innerHeight ? viewportTop(standalone, ph) : 0 };
  }

  // Where the top of the page's viewport sits on the physical screen, in points.
  // With viewport-fit=cover the viewport starts at the very top of the screen (0),
  // and the frame reports a non-zero top inset. If a Home Screen app is NOT in
  // cover mode (for instance a second viewport meta tag dropped viewport-fit), iOS
  // lays the page out below the status bar: the viewport is shorter than the screen
  // and starts that far down, so a page that assumes it starts at the top lands that
  // far too low. The probe sits outside the stage; nothing in the stage uses it.
  function viewportTop(standalone, screenH) {
    if (!standalone) return 0;
    var probe = document.createElement("div");
    probe.style.cssText = "position:fixed;left:0;top:0;width:0;visibility:hidden;padding-top:env(safe-area-inset-top)";
    document.body.appendChild(probe);
    var inset = probe.offsetHeight;
    document.body.removeChild(probe);
    return inset > 0 ? 0 : Math.max(0, screenH - window.innerHeight);
  }

  // ---- Fit the stage to the screen, centred on the whole screen -----------------
  var mapBox = null, lastScreen = null;
  function fit() {
    var sc = screenSize();
    lastScreen = sc;
    var s = Math.min(sc.w / STAGE_W, sc.h / STAGE_H);
    root.style.setProperty("--reel-scale", String(s));
    root.style.setProperty("--reel-cy", (sc.h / 2) + "px");   // centre of the physical screen
    // The body is the whole physical screen: it starts sc.top points above the
    // viewport's top edge (0 unless the page is laid out below the status bar).
    document.body.style.top = (-sc.top) + "px";
    document.body.style.height = sc.h + "px";                 // draw all the way to the bottom
    layoutMap(s, sc);
    syncLayout();
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
             above: r.top + sc.top, below: sc.h - r.bottom - sc.top, viewportTop: sc.top };
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

    drawBands();
  }

  // The layout bands: a dashed line at the top of each, and one at the very bottom of
  // the text block. They move with the text, so they are redrawn whenever the layout is
  // measured (only while the guides are showing).
  var bandLines = [], bandKey = "";
  function drawBands() {
    if (!guides || !document.body.classList.contains("reel-guides-on")) return;
    var z = zones(), P = function (n) { return Math.round(n / STAGE_H * 1000) / 10; };
    var lines = [[z.header.top, "Header row " + P(z.header.top) + "-" + P(z.header.bottom) + "%"],
                 [z.win.top, "Map window " + P(z.win.top) + "-" + P(z.win.bottom) + "%"]];
    if (z.win.bottom > z.win.top) lines.push([z.win.bottom, z.legend.on ? "Legend " + P(z.legend.top) + "-" + P(z.legend.bottom) + "%" : "(no legend)"]);
    lines.push([z.text.top, "Text block " + P(z.text.top) + "-" + P(z.text.bottom) + "%"], [z.text.bottom, ""]);
    var key = JSON.stringify(lines.map(function (l) { return [Math.round(l[0]), l[1]]; }));
    if (key === bandKey) return;
    bandKey = key;
    bandLines.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
    bandLines = lines.map(function (b) {
      var line = el("div", "reel-guide-zone", guides);
      line.style.top = b[0] + "px";
      if (b[1]) el("span", "", line, b[1]);
      return line;
    });
  }

  function setGuides(on) {
    document.body.classList.toggle("reel-guides-on", on);
    drawBands();
  }

  // The way back to the studio home page. Playback never shows it (hold a finger down for
  // a second instead); the visible link below appears only in ?check=1 and ?guides=1.
  var HOME_URL = "../studio/index.html";

  function buildChrome() {
    buildGuides();
    // Invisible tap zones over the whole screen. Nothing else is ever drawn.
    var left = el("div", "reel-tap-l", document.body);
    var right = el("div", "reel-tap-r", document.body);
    left.addEventListener("click", function () { go(-1); });
    right.addEventListener("click", function () { go(1); });

    // Hold a finger down for a second (anywhere) to go back to the studio home page.
    var timer = null;
    function arm() { disarm(); timer = setTimeout(function () { window.location.href = HOME_URL; }, 1000); }
    function disarm() { if (timer) { clearTimeout(timer); timer = null; } }
    if (params.get("check") === "1" || params.get("guides") === "1") {
      var home = el("a", "reel-home", document.body, "\u2190 Studio");
      home.href = HOME_URL;
    }
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
    else if (e.key === "Escape" || e.key === "Backspace") { window.location.href = HOME_URL; }
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
  // closest zoom it may use). solveCamera finds the largest zoom <= z at which
  //   - the subject, AND
  //   - every label of the reel's own that shows on that beat (.reel-maplabel)
  // fit inside the map window (19% down to just above the legend, or the text block when
  // there is no legend), inside the side margins, minus FIT_MARGIN all round and any
  // padL / padR stage pixels the reel reserves for its graphic, and centres all of it in
  // the window, not on the screen. The window depends on the beat's text, so each beat
  // is solved with its own text and legend on screen (solveAll steps through them).
  // The result is stored on the beat as beat.cam = { center, zoom }; the reel flies to it.
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

  // The reel's own map labels (.reel-maplabel) showing right now, as [{ text, x0, y0,
  // x1, y1 }] in stage px. A label is showing when it and its parents are displayed
  // and not faded out.
  function ownLabels() {
    var sr = stage.getBoundingClientRect(), k = sr.width / STAGE_W || 1, out = [];
    var els = stage.querySelectorAll(".reel-maplabel");
    for (var i = 0; i < els.length; i++) {
      if (!shown(els[i])) continue;
      var r = els[i].getBoundingClientRect();
      if (!r.width && !r.height) continue;
      out.push({ text: (els[i].textContent || "").replace(/\s+/g, " ").trim(),
                 x0: (r.left - sr.left) / k, y0: (r.top - sr.top) / k,
                 x1: (r.right - sr.left) / k, y1: (r.bottom - sr.top) / k });
    }
    return out;
  }

  // The subject's points plus every label showing, as one box (stage px).
  function framedOf(map, pts) {
    var b = pointsBox(map, pts);
    ownLabels().forEach(function (l) {
      b.x0 = Math.min(b.x0, l.x0); b.x1 = Math.max(b.x1, l.x1);
      b.y0 = Math.min(b.y0, l.y0); b.y1 = Math.max(b.y1, l.y1);
    });
    return b;
  }

  function solveCamera(map, beat) {
    var pts = beat.fit && beat.fit.length ? beat.fit : [beat.c];
    var W = windowRect();
    var x0 = W.x0 + FIT_MARGIN_X + (beat.padL || 0);
    var x1 = W.x1 - FIT_MARGIN_X - (beat.padR || 0);
    var y0 = W.y0 + FIT_MARGIN, y1 = W.y1 - FIT_MARGIN;
    var tx = (x0 + x1) / 2, ty = (y0 + y1) / 2;      // where the framed area's centre should land

    var lngs = pts.map(function (p) { return p[0]; }), lats = pts.map(function (p) { return p[1]; });
    var mid = [(Math.min.apply(null, lngs) + Math.max.apply(null, lngs)) / 2,
               mercLat((mercY(Math.min.apply(null, lats)) + mercY(Math.max.apply(null, lats))) / 2)];

    // Put the framed area's centre on (tx, ty) at zoom z; return the camera and the box.
    function place(z) {
      var center = mid;
      for (var k = 0; k < 6; k++) {
        map.jumpTo({ center: center, zoom: z });
        var b = framedOf(map, pts);
        var dx = tx - (b.x0 + b.x1) / 2, dy = ty - (b.y0 + b.y1) / 2;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) break;
        var ll = map.unproject(toMap(map, STAGE_W / 2 - dx, STAGE_H / 2 - dy));
        center = [ll.lng, ll.lat];
      }
      map.jumpTo({ center: center, zoom: z });
      return { center: center, zoom: z, box: framedOf(map, pts) };
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

  // Solve every beat once the style is loaded. Each beat is put on screen first (the
  // reel's own jump(i), which sets its text, legend and labels), because the map window
  // and the labels to fit depend on them. Leaves the camera and the beat where they were.
  function solveAll(map, beats) {
    var keep = { center: map.getCenter(), zoom: map.getZoom() };
    var back = hooks && hooks.beat ? beats.indexOf(hooks.beat()) : -1;
    LB.suspended = true;
    document.body.classList.add("reel-solving");   // no fades: labels and legend rows are at their final state
    beats.forEach(function (b, i) {
      if (hooks && hooks.jump) hooks.jump(i);
      syncLayout();
      b.cam = solveCamera(map, b);
    });
    if (hooks && hooks.jump && back >= 0) hooks.jump(back);
    map.jumpTo(keep);
    syncLayout();
    document.body.classList.remove("reel-solving");
    LB.suspended = false;
  }

  // The projected box (stage px) of the current beat's subject, for the check.
  function subjectBox() {
    var m = hooks && hooks.map && hooks.map(), b = hooks && hooks.beat && hooks.beat();
    if (!m || !b || !b.fit || !b.fit.length) return null;
    return pointsBox(m, b.fit);
  }
  // The subject plus every label showing: what the camera centres in the map window.
  function framedBox() {
    var m = hooks && hooks.map && hooks.map(), b = hooks && hooks.beat && hooks.beat();
    if (!m || !b || !b.fit || !b.fit.length) return null;
    return framedOf(m, b.fit);
  }

  // ---- Basemap labels outside the map window --------------------------------------------
  // Every map label shown on a beat must sit fully inside the map window and the side
  // margins. A reel's own labels are fitted into the camera (above). The basemap's place
  // names (drawn inside the map canvas) cannot be moved, so any that touch the ground the
  // map window does not own are hidden: the header row and everything above the window,
  // the legend and the text block below it, and the left and right margins. They are
  // found with queryRenderedFeatures and filtered out by name once the camera has
  // settled; they are faded out while the camera moves so none slide into view.
  var LB = { map: null, layers: [], hidden: {}, touched: {}, token: 0, busy: null,
             suspended: false, hiddenCount: 0, unnamed: 0, passes: 0 };

  // The four pieces of the stage (stage px, running on past the stage) that are not map
  // window: above it, below it, left of it, right of it.
  function outsideWindow() {
    var W = windowRect(), big = 100000;
    return [{ x0: -big, y0: -big, x1: big, y1: W.y0 },
            { x0: -big, y0: W.y1, x1: big, y1: big },
            { x0: -big, y0: -big, x1: W.x0, y1: big },
            { x0: W.x1, y0: -big, x1: big, y1: big }];
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

  // Basemap labels now showing outside the map window. Returns [{ layer, props }].
  function basemapUnder() {
    var m = LB.map, out = [];
    if (!m || !LB.layers.length) return out;
    var c = m.getContainer(), cw = c.clientWidth, ch = c.clientHeight;
    var clamp = function (v, hi) { return Math.max(0, Math.min(hi, v)); };
    outsideWindow().forEach(function (r) {
      var a = toMap(m, r.x0, r.y0), b = toMap(m, r.x1, r.y1);
      var x0 = clamp(a[0], cw), y0 = clamp(a[1], ch), x1 = clamp(b[0], cw), y1 = clamp(b[1], ch);
      if (x1 <= x0 || y1 <= y0) return;
      var feats = m.queryRenderedFeatures([[x0, y0], [x1, y1]], { layers: labelIds() });
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
        if (hidePass() && ++n < 8) return pass();              // hiding one can reveal another
        fadeBasemapLabels(false);
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
    syncLayout();
    return startSettle();
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
    ["reel-legend", "legend"], ["reel-graphic", "graphic"], ["reel-maplabel", "map label"], ["reel-caption", "caption"], ["reel-logo", "logo"]
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

  // ---- Framing helpers (shared by the on-device check and npm run check-reels) -------
  // How far a box (stage px) sticks out of the map window or the side margins:
  // { side, by } for the worst side, or null when it sits fully inside. tol is in px.
  function overflow(box, W, tol) {
    if (!box) return null;
    tol = tol == null ? 1 : tol;
    var c = [["top", W.y0 - box.y0], ["bottom", box.y1 - W.y1], ["left", W.x0 - box.x0], ["right", box.x1 - W.x1]]
      .filter(function (x) { return x[1] > tol; })
      .sort(function (a, b) { return b[1] - a[1]; });
    return c.length ? { side: c[0][0], by: Math.round(c[0][1]) } : null;
  }

  // The gradient: where the scrim sits (stage px) and where it first reaches full
  // darkness, read from the gradient the browser actually computed.
  function scrimInfo() {
    var sc = stage.querySelector(".reel-scrim");
    if (!sc) return null;
    var sr = stage.getBoundingClientRect(), k = sr.width / STAGE_W || 1, r = sc.getBoundingClientRect();
    var info = { top: (r.top - sr.top) / k, bottom: (r.bottom - sr.top) / k, darkAt: null, startAlpha: null, endAlpha: null };
    var bg = getComputedStyle(sc).backgroundImage, re = /rgba?\(([^)]+)\)\s*([\d.]+)(px|%)/g, m, stops = [];
    while ((m = re.exec(bg))) {
      var parts = m[1].split(",").map(parseFloat);
      stops.push({ a: parts.length > 3 ? parts[3] : 1, pos: m[3] === "px" ? parseFloat(m[2]) : parseFloat(m[2]) / 100 * (r.height / k) });
    }
    if (stops.length) {
      info.startAlpha = stops[0].a;
      info.endAlpha = stops[stops.length - 1].a;
      var maxA = Math.max.apply(null, stops.map(function (x) { return x.a; }));
      for (var i = 0; i < stops.length; i++) if (stops[i].a >= maxA - 0.005) { info.darkAt = info.top + stops[i].pos; break; }
      info.maxAlpha = maxA;
    }
    return info;
  }

  // ---- On-device check: ?check=1 ---------------------------------------------------
  // For the phone. Measures the header row, the map window and what is framed in it, the
  // legend, the text block and the gradient as a percent of the stage, compares them
  // with the rules in reel-frame.css, and shows PASS or FAIL with expected and actual
  // numbers in a panel inside the safe area. Also reports where the stage sits on the
  // physical screen (the strip above and below should be equal) and draws a mock of
  // Instagram's interface (header, right-hand button column, and both versions of the
  // bottom stack: three rows from 84%, two rows from 89%) over the reel at the blocked zones, so you can see by eye what Instagram will cover.
  // ?ig=0 hides the mock. (The automatic check-reels run uses ?audit=1, which only
  // freezes motion; it runs this same report in its iPhone simulation.)
  var CHECK_TOL = 1.0, CHECK_CENTRE_TOL = 2.5, CHECK_FRAME_PX = 2, CHECK_TEXT_TOL = 0.5;

  function stageBox(nodes, sr) {
    var t = Infinity, b = -Infinity, any = false;
    for (var i = 0; i < nodes.length; i++) {
      var cs = getComputedStyle(nodes[i]);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      var r = nodes[i].getBoundingClientRect();
      if (!r.width && !r.height) continue;
      any = true; t = Math.min(t, r.top); b = Math.max(b, r.bottom);
    }
    return any ? { top: (t - sr.top) / sr.height * 100, bottom: (b - sr.top) / sr.height * 100 } : null;
  }

  // Returns [{ name, want, got, pass }], percent of the stage from the top.
  function deviceReport() {
    syncLayout();
    var sr = stage.getBoundingClientRect(), Z = zones(), W = windowRect(), rows = [];
    var H = STAGE_H / 100;
    var P = function (n) { return Math.round(n / STAGE_H * 1000) / 10; };
    var f = function (n) { return n.toFixed(1); };
    function q(sel) { return Array.prototype.slice.call(stage.querySelectorAll(sel)); }
    function band(name, nodes, lo, hi, tol) {
      var b = stageBox(nodes, sr);
      if (!b) { rows.push({ name: name, want: f(lo) + "-" + f(hi) + "%", got: "not shown", pass: true }); return; }
      rows.push({ name: name, want: f(lo) + "-" + f(hi) + "%", got: f(b.top) + "-" + f(b.bottom) + "%",
                  pass: b.top >= lo - tol && b.bottom <= hi + tol });
    }
    band("Header row", q(".reel-date, .reel-dots"), P(Z.header.top), P(Z.header.bottom), CHECK_TOL);

    // The map window: 19% down to just above the legend (or the text block).
    var minWin = cssNum("--window-min");
    rows.push({ name: "Map window", want: f(P(Z.win.top)) + "% to just above the " + (Z.legend.on ? "legend" : "text") + ", at least " + minWin + "% tall",
                got: f(P(Z.win.top)) + "-" + f(P(Z.win.bottom)) + "%", pass: P(Z.win.bottom) - P(Z.win.top) >= minWin - 0.05 });
    var sb = subjectBox(), fb = framedBox();
    if (sb) {
      var o = overflow(sb, W, CHECK_FRAME_PX), c = (fb.y0 + fb.y1) / 2, mid = (W.y0 + W.y1) / 2;
      rows.push({ name: "Map subject", want: "inside " + f(P(W.y0)) + "-" + f(P(W.y1)) + "% and the side margins",
                  got: f(sb.y0 / H) + "-" + f(sb.y1 / H) + "% down, " + Math.round(sb.x0) + "-" + Math.round(sb.x1) + "px across" + (o ? ", " + o.by + "px past the " + o.side : ""),
                  pass: !o });
      rows.push({ name: "Framing centred", want: "centre " + f(P(mid)) + "%", got: "centre " + f(P(c)) + "%",
                  pass: Math.abs(c - mid) / H <= CHECK_CENTRE_TOL });
    }
    var labels = ownLabels(), bad = labels.map(function (l) { return { l: l, o: overflow(l, W, CHECK_FRAME_PX) }; }).filter(function (x) { return x.o; });
    rows.push({ name: "Map labels", want: "all inside the window and margins",
                got: !labels.length ? "none showing" : bad.length ? '"' + bad[0].l.text + '" ' + bad[0].o.by + "px past the " + bad[0].o.side : labels.length + " showing, all inside",
                pass: !bad.length });

    // The legend sits directly above the kicker.
    band("Legend", q(".reel-leg-row.on"), P(Z.legend.top), P(Z.legend.bottom), 0.3);
    // The text block is anchored: its last line ends at 87% (84% when there is no supporting
    // line) and it grows upward. The headline's last line ends at or above 84%.
    var tb = stageBox(q(".reel-kicker, .reel-title, .reel-sub"), sr), end = P(Z.text.bottom);
    if (tb) rows.push({ name: "Text block", want: "last line ends at " + f(end) + "%", got: f(tb.top) + "-" + f(tb.bottom) + "%",
                        pass: Math.abs(tb.bottom - end) <= CHECK_TEXT_TOL });
    var hb = stageBox(q(".reel-title"), sr), hLim = cssNum("--headline-bottom");
    if (hb) rows.push({ name: "Headline", want: "last line ends at or above " + f(hLim) + "%", got: "ends at " + f(hb.bottom) + "%",
                        pass: hb.bottom <= hLim + CHECK_TEXT_TOL });
    // The gradient follows the text: transparent a little above the legend, dark by the
    // kicker, dark to the bottom of the stage.
    var sc = scrimInfo();
    if (sc) {
      var wantTop = Z.legend.top - cssNum("--scrim-lead") * H;
      var ok = Math.abs(sc.top - wantTop) <= 0.3 * H && sc.darkAt != null && sc.darkAt <= Z.text.top + 0.3 * H &&
               sc.startAlpha === 0 && sc.endAlpha >= 0.85 && sc.bottom >= STAGE_H - 1;
      rows.push({ name: "Gradient", want: "from " + f(P(wantTop)) + "%, dark by " + f(P(Z.text.top)) + "%, to the bottom",
                  got: "from " + f(P(sc.top)) + "%, dark by " + (sc.darkAt == null ? "?" : f(P(sc.darkAt))) + "%, to " + f(P(sc.bottom)) + "%", pass: ok });
    }
    var m = metrics();
    rows.push({ name: "Stage on screen", want: "equal strips", got: f(m.above) + " / " + f(m.below) + " pt",
                pass: Math.abs(m.above - m.below) <= 1 });
    return rows;
  }

  function buildCheck() {
    var panel = el("div", "reel-checkpanel cal-ignore", stage);
    function tick() {
      var rows = deviceReport(), ok = rows.every(function (r) { return r.pass; });
      var html = '<div class="rcp-head ' + (ok ? "ok" : "bad") + '">' + (ok ? "PASS" : "FAIL") + "</div>";
      rows.forEach(function (r) {
        html += '<div class="rcp-row ' + (r.pass ? "ok" : "bad") + '"><b>' + (r.pass ? "PASS" : "FAIL") + "</b> " + r.name +
                "<span>want " + r.want + " &middot; got " + r.got + "</span></div>";
      });
      var m = metrics();
      html += '<div class="rcp-dev">screen ' + m.screenH + " &middot; viewport " + m.viewportH + " &middot; top " + m.viewportTop + " pt</div>";
      panel.innerHTML = html;
    }
    tick();
    setInterval(tick, 500);
    if (params.get("ig") === "0") return;

    // Mock of Instagram's interface at the blocked zones (positions are stage
    // percentages from reel-frame.css; nothing here depends on the screen).
    var ig = el("div", "reel-ig cal-ignore", stage);
    var top = el("div", "ig-top", ig);
    el("span", "", top, "‹  Reels"); el("span", "", top, "▣");
    var col = el("div", "ig-col", ig);
    [["♥", "12.4K"], ["✉", "318"], ["➤", "Share"], ["⋯", ""]].forEach(function (b) {
      var d = el("div", "ig-btn", col); el("i", "", d, b[0]); if (b[1]) el("small", "", d, b[1]);
    });
    el("div", "ig-audio", col);
    // Both versions of the bottom stack: three rows from 84%, two rows from 89%.
    var cap3 = el("div", "ig-cap three", ig);
    el("em", "", cap3, "3 rows: from " + cssNum("--ig-stack-top") + "%");
    el("b", "", cap3, "@thespatialupdate  ·  Follow");
    el("span", "", cap3, "The caption goes here and runs two lines… more");
    el("small", "", cap3, "♪ Original audio");
    var cap2 = el("div", "ig-cap two", ig);
    el("em", "", cap2, "2 rows: from " + cssNum("--ig-stack2-top") + "%");
    el("b", "", cap2, "@thespatialupdate  ·  Follow");
    el("span", "", cap2, "The caption goes here… more");
    el("div", "ig-nav", ig);
  }

  // ---- Public API ---------------------------------------------------------------
  window.TSUReel = {
    STAGE_W: STAGE_W, STAGE_H: STAGE_H, MAP_SCALE: MAP_SCALE,
    safe: safe, zones: zones, metrics: metrics, mapOptions: mapOptions, dots: dots, measure: measure,
    // Camera and labels (see the sections above). A reel calls attachMap(map) and
    // solveAll(map, BEATS) once its style has loaded; the rest is for the check.
    attachMap: attachMap, solveAll: solveAll, solveCamera: solveCamera, settle: settle,
    subjectBox: subjectBox, framedBox: framedBox, ownLabels: ownLabels, labelsUnderUI: labelsUnderUI, labelStats: labelStats,
    // Layout (see the layout section): sync() re-measures the text block, windowRect() is
    // the map window, overflow() says how far a box sticks out of it, scrimInfo() reads
    // the gradient, deviceReport() is the on-device PASS/FAIL list.
    sync: syncLayout, windowRect: windowRect, overflow: overflow, scrimInfo: scrimInfo, deviceReport: deviceReport,
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

  if (params.get("audit") === "1") document.body.classList.add("reel-check");
  buildChrome();
  // The text block is anchored to the bottom, so its top moves when the text changes:
  // re-measure whenever it resizes, and once fonts and the page have loaded.
  var capEl = stage.querySelector(".reel-caption");
  if (capEl && typeof ResizeObserver !== "undefined") new ResizeObserver(syncLayout).observe(capEl);
  window.addEventListener("load", syncLayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncLayout);
  syncLayout();
  if (params.get("check") === "1") buildCheck();
  setGuides(params.get("guides") === "1");
})();
