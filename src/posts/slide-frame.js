/* The Spatial Update: shared slide frame (behaviour).
 *
 * Loaded by every post's slides.html after slide-frame.css. Builds each slide from
 * plain data (see CLAUDE.md "Slides"), draws the maps as SVG from the story's
 * GeoJSON (no tiles, no token, nothing fetched from the web), and audits every
 * slide against the numbers in slide-frame.css. The safe area, type sizes and
 * limits are NOT defined here; they are read from the CSS variables.
 *
 * slides.html calls TSUSlide.init({ slides, geojson, only }) once. `npm run
 * render-slides` then waits for TSUSlide.ready, calls TSUSlide.audit(), and takes
 * the screenshot of the one slide it asked for (?slide=N, 1-based).
 *
 * Slide data:
 *   { type:"cover",   chip, kicker, headline, map }
 *   { type:"map",     chip, kicker, headline, line, map, legend }
 *   { type:"number",  chip, kicker, number, unit, line, tone }
 *   { type:"closing", kicker, sources:[...], brand, follow }
 * map = { fit:[[lng,lat],...], grow, states:"outline"|"all"|"cut"|"none", reservoirs,
 *         dams:[feature id], labels:[{ at:[lng,lat] | "label-XX", lines:[...], align:"c"|"l"|"r", dx }] }
 * legend = [{ kind:"fill"|"dot", color, text }]   (at most 3)
 */
(function () {
  "use strict";

  var W = 1080, H = 1350;
  var SVGNS = "http://www.w3.org/2000/svg";
  var root = document.documentElement;
  var params = new URLSearchParams(window.location.search);
  var state = { slides: [], built: [], geo: null };

  function cssNum(name) { return parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0; }
  function safe() {
    var x = cssNum("--safe-x") / 100 * W, y = cssNum("--safe-y") / 100 * H;
    return { left: x, right: W - x, top: y, bottom: H - y };
  }
  function words(t) { return String(t).trim().split(/\s+/).filter(Boolean).length; }
  function norm(t) { return String(t).replace(/\s+/g, " ").trim(); }

  function el(tag, cls, parent, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  // A text unit: the audit measures every [data-text] element, and the post's
  // slides.md must carry the same text with its claim ID (checked by render-slides).
  function unit(tag, cls, parent, kind, text, group) {
    var e = el(tag, cls, parent, text);
    e.setAttribute("data-text", kind);
    if (group) e.setAttribute("data-group", group);
    return e;
  }

  // ---- Map: Web Mercator, drawn as SVG --------------------------------------------
  function mx(lng) { return lng * Math.PI / 180; }
  function my(lat) { return Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)); }

  function featureById(id) {
    var f = state.geo.features.filter(function (g) { return g.properties.id === id; });
    if (!f.length) throw new Error("No feature '" + id + "' in the map data.");
    return f[0];
  }
  function ringsOf(g) {
    if (g.type === "Polygon") return g.coordinates;
    if (g.type === "MultiPolygon") return g.coordinates.reduce(function (a, p) { return a.concat(p); }, []);
    return [];
  }
  function resolveAt(at) {
    if (typeof at === "string") return featureById(at).geometry.coordinates;
    return at;
  }

  // A fit entry is a [lng, lat] point, a feature id (its bounding box), or "kind:state"
  // (the bounding box of every feature of that kind). The map data is the story's own
  // GeoJSON, so a post never repeats coordinates.
  function fitPoints(fit) {
    var out = [];
    function box(feats) {
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      feats.forEach(function (f) {
        var g = f.geometry, cs = g.type === "Point" ? [g.coordinates] : ringsOf(g).reduce(function (a, r) { return a.concat(r); }, []);
        cs.forEach(function (c) { x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); });
      });
      out.push([x0, y0], [x1, y0], [x0, y1], [x1, y1]);
    }
    fit.forEach(function (f) {
      if (typeof f !== "string") out.push(f);
      else if (f.indexOf("kind:") === 0) box(state.geo.features.filter(function (g) { return g.properties.kind === f.slice(5); }));
      else box([featureById(f)]);
    });
    return out;
  }

  function drawMap(slide, spec, win) {
    var host = slide.querySelector(".s-map-host");
    var labelEls = spec.labels ? spec.labels.map(function (L, i) {
      var d = el("div", "s-maplabel " + ({ c: "center", l: "left", r: "right" }[L.align || "c"]), slide);
      d.setAttribute("data-maplabel", String(i));
      L.lines.forEach(function (t, j) { unit("span", "", d, "label", t, "label" + i); });
      d.style.left = "0px"; d.style.top = "0px";
      return d;
    }) : [];

    // Label rectangles relative to their anchor point, from their measured size.
    function relRect(L, d) {
      var w = d.offsetWidth, h = d.offsetHeight, dx = L.dx || 0, dy = L.dy || 0, a = L.align || "c";
      var x = a === "c" ? -w / 2 : a === "l" ? dx : -w - dx;
      return { x: x, y: -h / 2 + dy, w: w, h: h };
    }

    var fitLL = fitPoints(spec.fit);
    var pts = fitLL.map(function (p) { return [mx(p[0]), my(p[1])]; });
    var anchors = (spec.labels || []).map(function (L) { var c = resolveAt(L.at); return [mx(c[0]), my(c[1])]; });
    var winW = win.right - win.left, winH = win.bottom - win.top;
    var MX = 24, MY = 30;                       // breathing room inside the window

    function extents(s) {
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      function add(x, y) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      pts.forEach(function (p) { add(p[0] * s, -p[1] * s); });
      (spec.labels || []).forEach(function (L, i) {
        var r = relRect(L, labelEls[i]), ax = anchors[i][0] * s, ay = -anchors[i][1] * s;
        add(ax + r.x, ay + r.y); add(ax + r.x + r.w, ay + r.y + r.h);
      });
      return { x0: x0, y0: y0, x1: x1, y1: y1 };
    }

    var px0 = Infinity, px1 = -Infinity, py0 = Infinity, py1 = -Infinity;
    pts.forEach(function (p) { px0 = Math.min(px0, p[0]); px1 = Math.max(px1, p[0]); py0 = Math.min(py0, p[1]); py1 = Math.max(py1, p[1]); });
    var s = Math.min((winW - 2 * MX) / Math.max(px1 - px0, 1e-6), (winH - 2 * MY) / Math.max(py1 - py0, 1e-6)) * (spec.grow || 1);
    var ex, tries = 0;
    for (;;) {
      ex = extents(s);
      if (ex.x1 - ex.x0 <= winW - 2 * MX && ex.y1 - ex.y0 <= winH - 2 * MY) break;
      s *= 0.97;
      if (++tries > 200) break;
    }
    var tx = (win.left + win.right) / 2 - (ex.x0 + ex.x1) / 2;
    var ty = (win.top + win.bottom) / 2 - (ex.y0 + ex.y1) / 2;
    function X(lng) { return mx(lng) * s + tx; }
    function Y(lat) { return -my(lat) * s + ty; }

    // Labels, now that the scale is known.
    (spec.labels || []).forEach(function (L, i) {
      var r = relRect(L, labelEls[i]);
      labelEls[i].style.left = (anchors[i][0] * s + tx + r.x) + "px";
      labelEls[i].style.top = (-anchors[i][1] * s + ty + r.y) + "px";
    });

    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "s-map"); svg.setAttribute("width", W); svg.setAttribute("height", H);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    function node(tag, attrs, parent) {
      var n = document.createElementNS(SVGNS, tag);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      (parent || svg).appendChild(n); return n;
    }
    function pathOf(g) {
      return ringsOf(g).map(function (ring) {
        return "M" + ring.map(function (c) { return X(c[0]).toFixed(1) + " " + Y(c[1]).toFixed(1); }).join("L") + "Z";
      }).join("");
    }

    node("rect", { x: 0, y: 0, width: W, height: H, fill: "#0a0f18" });
    var g0 = node("g", { "data-layer": "graticule", stroke: "#f2efe9", "stroke-opacity": ".07", "stroke-width": "2", fill: "none" });
    var pxPerDeg = s * Math.PI / 180, step = [0.25, 0.5, 1, 2, 5, 10].filter(function (d) { return d * pxPerDeg >= 150; })[0] || 10;
    var lngMin = (0 - tx) / s * 180 / Math.PI, lngMax = (W - tx) / s * 180 / Math.PI;
    for (var lo = Math.ceil(lngMin / step) * step; lo <= lngMax; lo += step) node("line", { x1: X(lo), y1: 0, x2: X(lo), y2: H }, g0);
    function latOfY(py) { return (2 * Math.atan(Math.exp(-(py - ty) / s)) - Math.PI / 2) * 180 / Math.PI; }
    var latMax = latOfY(0), latMin = latOfY(H);
    for (var la = Math.ceil(latMin / step) * step; la <= latMax; la += step) node("line", { x1: 0, y1: Y(la), x2: W, y2: Y(la) }, g0);

    var mode = spec.states || "none";
    if (mode !== "none") {
      var gs = node("g", { "data-layer": "states" });
      state.geo.features.filter(function (f) { return f.properties.kind === "state"; }).forEach(function (f) {
        var u = f.properties.usps, fill = "#9a958c", op = mode === "outline" ? 0.06 : 0.14;
        if (mode === "cut") { var cut = (u === "AZ" || u === "CA" || u === "NV"); fill = cut ? "#e05a4e" : "#5b7a96"; op = cut ? 0.42 : 0.22; }
        node("path", { d: pathOf(f.geometry), fill: fill, "fill-opacity": op, "fill-rule": "evenodd",
                       stroke: "#cfcac2", "stroke-opacity": mode === "outline" ? 0.4 : 0.45, "stroke-width": 2, "stroke-linejoin": "round", "data-state": u }, gs);
      });
    }
    if (spec.reservoirs) {
      var gr = node("g", { "data-layer": "reservoirs" });
      state.geo.features.filter(function (f) { return f.properties.kind === "reservoir"; }).forEach(function (f) {
        node("path", { d: pathOf(f.geometry), fill: "#5b9bd5", "fill-opacity": 0.75, "fill-rule": "evenodd", stroke: "#9cc7ee", "stroke-opacity": 0.9, "stroke-width": 2.5, "stroke-linejoin": "round" }, gr);
      });
    }
    (spec.dams || []).forEach(function (id) {
      var c = featureById(id).geometry.coordinates;
      node("circle", { cx: X(c[0]), cy: Y(c[1]), r: 28, fill: "none", stroke: "#e8c87a", "stroke-opacity": 0.8, "stroke-width": 3, "data-dam": id }, svg);
      node("circle", { cx: X(c[0]), cy: Y(c[1]), r: 12, fill: "#e8c87a", stroke: "rgba(255,255,255,.35)", "stroke-width": 3 }, svg);
    });
    host.appendChild(svg);

    // What the audit checks against the window.
    slide._subject = fitLL.map(function (p) { return { x: X(p[0]), y: Y(p[1]) }; });
    slide._mapReady = true;
  }

  // ---- Slide builders ---------------------------------------------------------------
  function buildLegend(parent, items) {
    var lg = el("div", "s-legend", parent);
    items.forEach(function (it, i) {
      var row = el("div", "s-leg", lg);
      el("span", it.kind === "dot" ? "s-leg-dot" : "s-leg-fill", row).style.background = it.color;
      unit("span", "", row, "legend", it.text, "legend" + i);
    });
  }

  function buildMapSlide(def) {
    var s = el("div", "slide " + def.type);
    el("div", "s-map-host", s);
    el("div", "s-scrim", s);
    var chip = def.chip ? unit("div", "s-chip", s, "chip", def.chip) : null;
    var txt = el("div", "s-text", s);
    if (def.legend) buildLegend(txt, def.legend);
    unit("div", "s-kicker", txt, "kicker", def.kicker);
    unit("div", "s-headline", txt, "headline", def.headline);
    if (def.line) unit("div", "s-line", txt, "line", def.line);
    return s;
  }

  function buildNumberSlide(def) {
    var s = el("div", "slide number");
    s.style.setProperty("--tone", def.tone || "#e8c87a");
    if (def.chip) unit("div", "s-chip", s, "chip", def.chip);
    var b = el("div", "s-body", s);
    el("div", "s-rule", b);
    unit("div", "s-kicker", b, "kicker", def.kicker);
    var f = el("div", "s-figure", b);
    unit("div", "s-number", f, "number", def.number);
    if (def.unit) unit("div", "s-unit", f, "unit", def.unit);
    unit("div", "s-line", b, "line", def.line);
    return s;
  }

  function buildClosingSlide(def) {
    var s = el("div", "slide closing");
    var b = el("div", "s-body", s);
    unit("div", "s-kicker", b, "kicker", def.kicker);
    var ul = el("ul", "s-sources", b);
    def.sources.forEach(function (t, i) { unit("li", "s-source", ul, "source", t); });
    var foot = el("div", "s-foot", b);
    unit("div", "s-brand", foot, "brand", def.brand);
    unit("div", "s-follow", foot, "follow", def.follow);
    return s;
  }

  function build(def) {
    if (def.type === "cover" || def.type === "map") return buildMapSlide(def);
    if (def.type === "number") return buildNumberSlide(def);
    if (def.type === "closing") return buildClosingSlide(def);
    throw new Error("Unknown slide type '" + def.type + "'. Use cover, map, number or closing.");
  }

  // ---- Layout after fonts load: text block top, map window, map --------------------
  function rel(slide, r) {
    var sr = slide.getBoundingClientRect();
    return { left: r.left - sr.left, right: r.right - sr.left, top: r.top - sr.top, bottom: r.bottom - sr.top };
  }
  function mapWindow(slide, def) {
    var S = safe(), txt = slide.querySelector(".s-text"), chip = slide.querySelector(".s-chip");
    var capTop = txt ? rel(slide, txt.getBoundingClientRect()).top : S.bottom;
    slide.style.setProperty("--cap-top", capTop);
    var top = chip ? rel(slide, chip.getBoundingClientRect()).bottom + 24 : S.top;
    return { left: S.left, right: S.right, top: top, bottom: capTop - 36, capTop: capTop };
  }

  function layout(slide, def) {
    if (def.type !== "cover" && def.type !== "map") return;
    var win = mapWindow(slide, def);
    slide._window = win;
    drawMap(slide, def.map, win);
  }

  // ---- Audit -------------------------------------------------------------------------
  var KIND_NAMES = { chip: "date chip", kicker: "kicker", headline: "headline", line: "supporting line", legend: "legend item",
                     label: "map label", source: "source line", number: "big number", unit: "unit", brand: "wordmark", follow: "follow prompt" };
  function textBox(e) {
    var r = document.createRange(); r.selectNodeContents(e);
    var rects = Array.prototype.slice.call(r.getClientRects()).filter(function (q) { return q.width > 0.5 && q.height > 0.5; });
    if (!rects.length) return null;
    var b = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity }, rows = [];
    rects.forEach(function (q) {
      b.left = Math.min(b.left, q.left); b.right = Math.max(b.right, q.right); b.top = Math.min(b.top, q.top); b.bottom = Math.max(b.bottom, q.bottom);
      var mid = (q.top + q.bottom) / 2;
      if (!rows.some(function (m) { return Math.abs(m - mid) < q.height * 0.4; })) rows.push(mid);
    });
    b.lines = rows.length;
    return b;
  }
  function px(n) { return Math.round(n * 10) / 10; }

  function audit(i) {
    var slide = state.built[i], def = state.slides[i], out = [];
    if (!slide) return ["slide " + (i + 1) + " was not built."];
    var S = safe(), TOL = 0.6, sr = slide.getBoundingClientRect();
    if (Math.round(sr.width) !== W || Math.round(sr.height) !== H) out.push("the slide is " + Math.round(sr.width) + " x " + Math.round(sr.height) + " px, not " + W + " x " + H + ".");
    var minType = cssNum("--type-small");
    var items = Array.prototype.slice.call(slide.querySelectorAll("[data-text]")).map(function (e) {
      var kind = e.getAttribute("data-text");
      return { e: e, kind: kind, name: KIND_NAMES[kind] || kind, group: e.getAttribute("data-group") || ("g" + Math.random()), text: norm(e.textContent), box: null };
    });

    // Text that is not registered with the audit would escape every other check.
    Array.prototype.slice.call(slide.querySelectorAll("*")).forEach(function (e) {
      if (e.closest("svg")) return;
      var own = Array.prototype.some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
      if (own && !e.closest("[data-text]")) out.push("there is text ('" + norm(e.textContent).slice(0, 40) + "') that is not registered for checking (add data-text).");
    });

    items.forEach(function (it) {
      var b = it.box = textBox(it.e);
      if (!it.text) { out.push("the " + it.name + " is empty."); return; }
      if (!b) { out.push("the " + it.name + " ('" + it.text.slice(0, 40) + "') is not visible."); return; }
      var r = rel(slide, b), fs = parseFloat(getComputedStyle(it.e).fontSize);
      it.r = r;
      if (fs + 0.01 < minType) out.push("the " + it.name + " ('" + it.text.slice(0, 40) + "') is " + px(fs) + " px, below the " + minType + " px minimum.");
      var q = "the " + it.name + " ('" + it.text.slice(0, 40) + (it.text.length > 40 ? "..." : "") + "')";
      if (r.left < S.left - TOL) out.push(q + " runs " + px(S.left - r.left) + " px past the left margin.");
      if (r.right > S.right + TOL) out.push(q + " runs " + px(r.right - S.right) + " px past the right margin.");
      if (r.top < S.top - TOL) out.push(q + " runs " + px(S.top - r.top) + " px past the top margin.");
      if (r.bottom > S.bottom + TOL) out.push(q + " runs " + px(r.bottom - S.bottom) + " px past the bottom margin.");
      var n = words(it.text), lines = b.lines;
      if (it.kind === "headline") {
        var cov = def.type === "cover", maxL = cssNum(cov ? "--cover-headline-max-lines" : "--map-headline-max-lines"), maxW = cssNum(cov ? "--cover-headline-max-words" : "--map-headline-max-words");
        if (lines > maxL) out.push(q + " takes " + lines + " lines; a " + def.type + " headline may take at most " + maxL + ".");
        if (n > maxW) out.push(q + " is " + n + " words; a " + def.type + " headline may be at most " + maxW + ".");
      }
      if (it.kind === "line") {
        if (lines > cssNum("--line-max-lines")) out.push(q + " takes " + lines + " lines; at most " + cssNum("--line-max-lines") + ".");
        if (n > cssNum("--line-max-words")) out.push(q + " is " + n + " words; at most " + cssNum("--line-max-words") + ".");
      }
      if ((it.kind === "kicker" || it.kind === "chip" || it.kind === "legend" || it.kind === "number") && lines > 1) out.push(q + " wraps onto " + lines + " lines; it must fit on one.");
    });

    var legendN = items.filter(function (it) { return it.kind === "legend"; }).length;
    if (legendN > cssNum("--legend-max-items")) out.push("the legend has " + legendN + " items; at most " + cssNum("--legend-max-items") + ".");

    // No two pieces of text may touch.
    for (var a = 0; a < items.length; a++) for (var c = a + 1; c < items.length; c++) {
      var p = items[a], q2 = items[c];
      if (!p.r || !q2.r || p.group === q2.group) continue;
      if (p.r.left < q2.r.right - 1 && q2.r.left < p.r.right - 1 && p.r.top < q2.r.bottom - 1 && q2.r.top < p.r.bottom - 1)
        out.push("the " + p.name + " ('" + p.text.slice(0, 30) + "') overlaps the " + q2.name + " ('" + q2.text.slice(0, 30) + "').");
    }

    // Map slides: the subject and every label sit inside the window.
    if (def.type === "cover" || def.type === "map") {
      var win = slide._window;
      if (!slide._mapReady) out.push("the map did not draw.");
      else {
        var winH = win.bottom - win.top;
        if (winH < cssNum("--window-min")) out.push("the text block leaves the map only " + Math.round(winH) + " px of height (minimum " + cssNum("--window-min") + "); shorten the text.");
        slide._subject.forEach(function (pt, k) {
          if (pt.x < win.left - TOL || pt.x > win.right + TOL || pt.y < win.top - TOL || pt.y > win.bottom + TOL)
            out.push("the map's subject (point " + (k + 1) + ") falls outside the map window.");
        });
        items.filter(function (it) { return it.kind === "label" && it.r; }).forEach(function (it) {
          if (it.r.left < win.left - TOL || it.r.right > win.right + TOL || it.r.top < win.top - TOL || it.r.bottom > win.bottom + TOL)
            out.push("the map label '" + it.text + "' sits outside the map window.");
        });
      }
    }
    // The page must not scroll sideways or run past the slide.
    if (document.documentElement.scrollWidth > W + 1) out.push("the page is wider than the slide.");
    return out;
  }

  function texts(i) {
    var slide = state.built[i];
    return Array.prototype.slice.call(slide.querySelectorAll("[data-text]")).map(function (e) {
      return { kind: e.getAttribute("data-text"), text: norm(e.textContent) };
    });
  }

  // ---- Init ---------------------------------------------------------------------------
  var TSUSlide = {
    ready: false, error: null,
    count: function () { return state.slides.length; },
    type: function (i) { return state.slides[i].type; },
    audit: audit, texts: texts,
    init: function (opts) {
      state.slides = opts.slides; state.geo = opts.geojson;
      var deck = opts.deck || document.getElementById("deck");
      var only = opts.only == null ? null : opts.only;
      if (only == null) document.body.classList.add("deck-all");
      var fonts = document.fonts && document.fonts.load ? Promise.all([
        document.fonts.load("72px Gelasio"), document.fonts.load("72px Georgia"), document.fonts.load("30px Arial") ]).catch(function () {}) : Promise.resolve();
      return fonts.then(function () { return document.fonts && document.fonts.ready; }).then(function () {
        state.slides.forEach(function (def, i) {
          if (only != null && i !== only) { state.built[i] = null; return; }
          var s = build(def); deck.appendChild(s); state.built[i] = s;
        });
        state.slides.forEach(function (def, i) { if (state.built[i]) layout(state.built[i], def); });
        TSUSlide.ready = true;
      }).catch(function (e) { TSUSlide.error = String(e && e.message || e); TSUSlide.ready = true; });
    }
  };
  window.TSUSlide = TSUSlide;
  TSUSlide.only = params.get("slide") ? parseInt(params.get("slide"), 10) - 1 : null;
})();
