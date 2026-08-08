#!/usr/bin/env python3
"""
pitch_sheet.py — Stage 1 of The Spatial Update story protocol.

Reads the candidate clusters produced by gdelt_leads.py, enriches them with
signals that matter for *editorial* selection (source diversity, mappability,
whether it's new or a follow-on, and what the spatial angle actually is),
ranks them, and writes a pitch sheet you can tick through on your phone.

Outputs, into --outdir (default: pitches/):
    pitches/YYYY-MM-DD.html   the sheet you read and select from
    pitches/latest.html       same file, stable filename for your site
    pitches/YYYY-MM-DD.json   machine-readable, consumed by Stage 2
    pitches/latest.json       same

Usage (from your repo root):
    py scripts/pitch_sheet.py
    py scripts/pitch_sheet.py --in leads/latest.json --outdir pitches
    py scripts/pitch_sheet.py --max 15 --min-sources 2

Standard library only. No pip install needed.
"""

import argparse
import glob
import html
import json
import math
import os
import re
import sys
from datetime import datetime, timezone
from urllib.parse import urlparse

# ----------------------------------------------------------------------------
# CONFIG — tune these, they are the editorial knobs
# ----------------------------------------------------------------------------

MAX_PITCHES = 20          # how many make the sheet
MIN_DISTINCT_SOURCES = 1  # drop clusters carried by fewer outlets than this
FOLLOWON_RADIUS_KM = 60   # how close to an old story before it's a follow-on
DEFAULT_OUTDIR = "pitches"

# Where to look for already-published stories, so repeats get flagged.
STORY_DIRS = ["src/stories", "docs/stories", "stories"]

# Aggregators and syndicators — real but weak evidence of independent coverage.
WEAK_DOMAINS = {
    "news.google.com", "news.yahoo.com", "msn.com", "flipboard.com",
    "biztoc.com", "newsbreak.com", "yahoo.com", "headtopics.com",
    "menafn.com", "zerohedge.com", "oann.com",
}

# Place-name words that signal a genuinely spatial story.
GEO_FEATURES = [
    ("strait", "a maritime chokepoint — traffic, transit rights, and who controls the narrows"),
    ("canal", "a maritime chokepoint — traffic, transit rights, and who controls the narrows"),
    ("gulf", "a contested maritime space with overlapping claims"),
    ("sea", "a contested maritime space with overlapping claims"),
    ("port", "a port — the land-sea handoff for trade and military logistics"),
    ("harbor", "a port — the land-sea handoff for trade and military logistics"),
    ("harbour", "a port — the land-sea handoff for trade and military logistics"),
    ("border", "a border zone — the line itself is the story"),
    ("crossing", "a crossing point where movement is controlled"),
    ("checkpoint", "a crossing point where movement is controlled"),
    ("corridor", "a corridor — a narrow route everything has to funnel through"),
    ("pipeline", "energy infrastructure with a fixed, mappable route"),
    ("refinery", "energy infrastructure with a fixed, mappable route"),
    ("dam", "water infrastructure — upstream and downstream are different stories"),
    ("reservoir", "water infrastructure — upstream and downstream are different stories"),
    ("river", "a watercourse that is also a boundary or a lifeline"),
    ("mine", "an extraction site — fixed location, contested value"),
    ("field", "an extraction site — fixed location, contested value"),
    ("airport", "a transport node whose closure reroutes an entire region"),
    ("airbase", "a military installation with a measurable reach"),
    ("air base", "a military installation with a measurable reach"),
    ("base", "a military installation with a measurable reach"),
    ("camp", "a displacement site — who is there, and where did they come from"),
    ("island", "an island — isolation and claim are the same fact"),
    ("bridge", "a single link whose loss splits a network"),
    ("mountain", "terrain that dictates who can move where"),
    ("pass", "terrain that dictates who can move where"),
    ("valley", "terrain that dictates who can move where"),
]

# Weak place words: only used if the event itself suggests no better angle.
WEAK_GEO_FEATURES = [
    ("province", "a subnational unit with its own politics"),
    ("district", "a subnational unit with its own politics"),
    ("governorate", "a subnational unit with its own politics"),
    ("county", "a subnational unit with its own politics"),
]

# Event-shape fallbacks when the place name gives us nothing.
EVENT_ANGLES = [
    (("displac", "refugee", "flee", "evacuat", "expel"),
     "movement of people — origin, route, and destination all map"),
    (("strike", "airstrike", "aerial", "bomb", "shell", "missile", "drone",
      "weapons", "military force", "assault", "attack", "fight", "combat",
      "clash", "artillery", "small arms"),
     "a strike or engagement location — precision of the coordinate is the whole claim"),
    (("protest", "demonstrat", "rally", "riot"),
     "assembly in a specific place — the site carries the meaning"),
    (("seiz", "captur", "occupy", "control", "advance", "retreat"),
     "a change in who holds ground — before/after territory"),
    (("blockad", "block", "close", "shut", "halt", "suspend"),
     "an interruption to flow — what gets rerouted, and where"),
    (("agreement", "accord", "treaty", "deal", "sign", "talks", "summit"),
     "an agreement with a geography — who it covers and who it excludes"),
    (("aid", "relief", "humanitarian", "supply"),
     "delivery into a place — access routes are the constraint"),
    (("election", "vote", "poll", "referendum"),
     "results that vary by district — the map is the analysis"),
]


# ----------------------------------------------------------------------------
# Small helpers
# ----------------------------------------------------------------------------

def g(d, *keys, default=None):
    """Fetch the first key that exists and isn't empty. Tolerates schema drift."""
    for k in keys:
        if k in d and d[k] not in (None, "", [], {}):
            return d[k]
    return default


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def domain_of(url):
    try:
        host = urlparse(url).netloc.lower()
        return host[4:] if host.startswith("www.") else host
    except Exception:
        return ""


def esc(s):
    return html.escape(str(s if s is not None else ""), quote=True)


# ----------------------------------------------------------------------------
# Input discovery
# ----------------------------------------------------------------------------

def find_input(explicit):
    """Locate candidates.json without making the user remember the path."""
    if explicit:
        if not os.path.exists(explicit):
            sys.exit(f"Can't find {explicit}. Check the path and try again.")
        return explicit

    tries = [
        "leads/latest.json", "leads/candidates.json",
        "../leads/latest.json", "../leads/candidates.json",
        "latest.json", "candidates.json",
    ]
    for t in tries:
        if os.path.exists(t):
            return t

    # Fall back to the newest dated file anywhere obvious.
    globs = ["leads/candidates*.json", "../leads/candidates*.json", "leads/*.json"]
    found = []
    for pat in globs:
        found.extend(glob.glob(pat))
    if found:
        return max(found, key=os.path.getmtime)

    sys.exit(
        "Couldn't find candidates.json.\n"
        "Run gdelt_leads.py first, or point me at the file:\n"
        "    py scripts/pitch_sheet.py --in leads/latest.json"
    )


def load_clusters(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict):
        for key in ("candidates", "clusters", "leads", "items"):
            if isinstance(data.get(key), list):
                return data[key]
        sys.exit(f"{path} is a JSON object but has no list of candidates in it.")
    if isinstance(data, list):
        return data
    sys.exit(f"Didn't understand the structure of {path}.")


# ----------------------------------------------------------------------------
# Published-story index, for novelty checking
# ----------------------------------------------------------------------------

# Two coordinate conventions live in this repo and both have to be read.
#
#   1. Named keys, lat first:      "lat": 26.5, "lon": 56.2
#   2. GeoJSON / front matter,
#      LON FIRST inside brackets:  "coordinates": [56.2, 26.5]
#                                  coordinates: [-68.0, 8.0]
#
# Convention 2 is what src/stories/<slug>/data.geojson and the Eleventy front
# matter actually use. Reading only convention 1 silently indexes nothing, which
# makes every pitch score as "new" and quietly kills the follow-on check.

COORD_RE = re.compile(
    r'(?:"?lat(?:itude)?"?\s*[:=]\s*(-?\d{1,3}(?:\.\d+)?))'
    r'[\s,\]\}]*'
    r'(?:"?(?:lon|lng|long|longitude)"?\s*[:=]\s*(-?\d{1,3}(?:\.\d+)?))',
    re.IGNORECASE,
)

# "coordinates": [lon, lat]  — also matches the first vertex of a LineString or
# Polygon, which is close enough for a 60km proximity test.
COORD_PAIR_RE = re.compile(
    r'"?coordinates"?\s*[:=]\s*\[+\s*'
    r'(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)',
    re.IGNORECASE,
)


def _valid_latlon(lat, lon):
    return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0


def _geojson_points(text):
    """Walk a parsed GeoJSON blob and yield every (lat, lon) it contains."""
    try:
        data = json.loads(text)
    except Exception:
        return

    def walk(node):
        if isinstance(node, dict):
            geom = node.get("geometry")
            if isinstance(geom, dict):
                yield from coords(geom.get("coordinates"))
            if "coordinates" in node and "geometry" not in node:
                yield from coords(node.get("coordinates"))
            for v in node.values():
                if isinstance(v, (dict, list)):
                    yield from walk(v)
        elif isinstance(node, list):
            for v in node:
                if isinstance(v, (dict, list)):
                    yield from walk(v)

    def coords(node):
        # A position is [lon, lat]; everything else is nested lists of positions.
        if (isinstance(node, list) and len(node) >= 2
                and all(isinstance(x, (int, float)) for x in node[:2])):
            lon, lat = float(node[0]), float(node[1])
            if _valid_latlon(lat, lon):
                yield (lat, lon)
        elif isinstance(node, list):
            for v in node:
                yield from coords(v)

    seen = set()
    for lat, lon in walk(data):
        key = (round(lat, 4), round(lon, 4))
        if key not in seen:
            seen.add(key)
            yield (lat, lon)


def index_published_stories():
    """Pull coordinates out of anything already published, best effort.

    Every source is tried independently and failures are swallowed — a malformed
    geojson in one story folder must never stop the rest from being indexed.
    """
    points = []
    for d in STORY_DIRS:
        if not os.path.isdir(d):
            continue
        for root, _dirs, files in os.walk(d):
            for fn in files:
                if not fn.lower().endswith((".md", ".markdown", ".json", ".geojson", ".njk")):
                    continue
                p = os.path.join(root, fn)
                try:
                    with open(p, "r", encoding="utf-8", errors="ignore") as f:
                        text = f.read(200_000)
                except Exception:
                    continue

                # Stories live in <stories>/<slug>/{index.md,data.geojson}, so the
                # containing folder is the slug. Only fall back to the filename
                # for loose files sitting directly in the stories directory.
                if os.path.normpath(root) == os.path.normpath(d):
                    slug = os.path.splitext(fn)[0]
                else:
                    slug = os.path.basename(root)

                found = []

                # 1. Real GeoJSON, parsed properly.
                if fn.lower().endswith((".geojson", ".json")):
                    try:
                        found.extend(_geojson_points(text))
                    except Exception:
                        pass

                # 2. Bracketed [lon, lat] pairs — front matter, and any geojson
                #    that was truncated by the 200k read cap or failed to parse.
                for m in COORD_PAIR_RE.finditer(text):
                    try:
                        lon, lat = float(m.group(1)), float(m.group(2))
                    except ValueError:
                        continue
                    if _valid_latlon(lat, lon):
                        found.append((lat, lon))

                # 3. Named lat/lon keys.
                for m in COORD_RE.finditer(text):
                    try:
                        lat, lon = float(m.group(1)), float(m.group(2))
                    except ValueError:
                        continue
                    if _valid_latlon(lat, lon):
                        found.append((lat, lon))

                seen = set()
                for lat, lon in found:
                    key = (round(lat, 4), round(lon, 4))
                    if key in seen:
                        continue
                    seen.add(key)
                    points.append((lat, lon, slug))
    return points


def novelty(lat, lon, published):
    if lat is None or lon is None:
        return ("unknown", None)
    for plat, plon, slug in published:
        if haversine_km(lat, lon, plat, plon) <= FOLLOWON_RADIUS_KM:
            return ("follow-on", slug)
    return ("new", None)


# ----------------------------------------------------------------------------
# Enrichment
# ----------------------------------------------------------------------------

def mappability(c, lat, lon):
    """Can this actually carry a map, or is the coordinate a country centroid?"""
    geo_type = g(c, "geo_type", "ActionGeo_Type", "geotype", default=None)
    try:
        geo_type = int(geo_type) if geo_type is not None else None
    except (TypeError, ValueError):
        geo_type = None

    if lat is None or lon is None:
        return ("no", "no coordinate at all")
    if geo_type is not None:
        if geo_type >= 4:
            return ("yes", "geocoded to a named place")
        if geo_type == 3:
            return ("weak", "geocoded to a state or province, not a point")
        return ("no", "country-level coordinate — a centroid, not a location")
    # No geo_type available: infer. Country centroids tend to be round numbers.
    if abs(lat - round(lat)) < 0.02 and abs(lon - round(lon)) < 0.02:
        return ("weak", "coordinate looks rounded — may be a centroid, verify it")
    return ("yes", "point coordinate")


def spatial_angle(label, place):
    hay_place = (place or "").lower()
    for word, angle in GEO_FEATURES:
        if word in hay_place:
            return angle
    hay_label = (label or "").lower()
    for words, angle in EVENT_ANGLES:
        if any(w in hay_label for w in words):
            return angle
    for word, angle in WEAK_GEO_FEATURES:
        if word in hay_place:
            return angle
    return "location is specific, but the spatial angle needs finding — read the sources first"


def enrich(c, published):
    urls = g(c, "source_urls", "urls", "sources", default=[]) or []
    if isinstance(urls, str):
        urls = [urls]
    domains = []
    for u in urls:
        d = domain_of(u if isinstance(u, str) else g(u, "url", default=""))
        if d and d not in domains:
            domains.append(d)
    strong = [d for d in domains if d not in WEAK_DOMAINS]

    lat = g(c, "lat", "latitude", default=None)
    lon = g(c, "lon", "lng", "long", "longitude", default=None)
    try:
        lat = float(lat) if lat is not None else None
        lon = float(lon) if lon is not None else None
    except (TypeError, ValueError):
        lat = lon = None

    label = g(c, "label", "event_label", "title", "headline", default="Unlabelled event")
    place = g(c, "place", "location", "geo_name", "ActionGeo_FullName", default="Unknown place")

    map_flag, map_note = mappability(c, lat, lon)
    nov, nov_slug = novelty(lat, lon, published)

    base = g(c, "score", "rank_score", default=0) or 0
    try:
        base = float(base)
    except (TypeError, ValueError):
        base = 0.0

    # Editorial re-weighting: independent corroboration up, unmappable down.
    diversity_mult = 1.0 + 0.18 * max(0, len(strong) - 1)
    map_mult = {"yes": 1.0, "weak": 0.65, "no": 0.25}[map_flag]
    nov_mult = 0.85 if nov == "follow-on" else 1.0
    pitch_score = round(base * diversity_mult * map_mult * nov_mult, 2)

    return {
        "label": label,
        "place": place,
        "lat": lat,
        "lon": lon,
        "headline": g(c, "headline", "top_headline", "title", default=None),
        "synopsis": g(c, "synopsis", "summary", "description", default=None),
        "actors": [a for a in (g(c, "actor1", "Actor1Name", default=None),
                               g(c, "actor2", "Actor2Name", default=None)) if a],
        "category": g(c, "category", "topic", "quad_class", "QuadClass", default=None),
        "mentions": g(c, "total_mentions", "mentions", "NumMentions", default=None),
        "records": g(c, "records", "record_count", default=None),
        "source_urls": [u for u in urls if isinstance(u, str)],
        "domains": domains,
        "strong_domains": strong,
        "mappable": map_flag,
        "map_note": map_note,
        "novelty": nov,
        "novelty_ref": nov_slug,
        "angle": spatial_angle(label, place),
        "base_score": base,
        "pitch_score": pitch_score,
        "raw": c,
    }


# ----------------------------------------------------------------------------
# HTML
# ----------------------------------------------------------------------------

PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pitch sheet __DATE__ — The Spatial Update</title>
<style>
  :root {
    --ink: #14181d;
    --paper: #f7f6f3;
    --rule: #d9d5cc;
    --muted: #6b6f76;
    --pick: #0b5f4a;
    --pick-soft: #e4efe9;
    --warn: #9a4a1c;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0 0 7.5rem;
    background: var(--paper);
    color: var(--ink);
    font: 400 16px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-text-size-adjust: 100%;
  }
  .wrap { max-width: 46rem; margin: 0 auto; padding: 1.25rem 1rem 0; }

  header { border-bottom: 2px solid var(--ink); padding-bottom: .6rem; margin-bottom: 1.1rem; }
  .kicker {
    font: 600 .68rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: .16em; text-transform: uppercase; color: var(--muted);
  }
  h1 { font: 700 1.6rem/1.15 Georgia, "Iowan Old Style", serif; margin: .35rem 0 .3rem; }
  .meta { font: 400 .8rem/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--muted); }

  .pitch {
    border: 1px solid var(--rule); border-radius: 3px; background: #fff;
    margin: 0 0 .8rem; padding: .85rem .9rem; cursor: pointer;
    transition: border-color .12s ease, background .12s ease;
  }
  .pitch:has(input:checked) { border-color: var(--pick); border-left-width: 5px; background: var(--pick-soft); }
  .pitch:focus-within { outline: 2px solid var(--pick); outline-offset: 2px; }

  .row { display: flex; gap: .7rem; align-items: flex-start; }
  input[type=checkbox] { width: 1.35rem; height: 1.35rem; margin: .15rem 0 0; accent-color: var(--pick); flex: none; }
  .num {
    font: 600 .78rem/1.35 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: var(--muted); flex: none; min-width: 1.6rem;
  }
  .body { flex: 1; min-width: 0; }
  h2 { font: 600 1.02rem/1.3 Georgia, "Iowan Old Style", serif; margin: 0 0 .15rem; }
  .place { font: 500 .84rem/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--muted); word-break: break-word; }
  .angle { margin: .5rem 0 0; font-size: .9rem; }
  .angle b { font-weight: 600; }
  .head { margin: .45rem 0 0; font-size: .88rem; color: #33383f; font-style: italic; }

  .tags { display: flex; flex-wrap: wrap; gap: .3rem; margin: .55rem 0 0; }
  .tag {
    font: 500 .7rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    padding: .3rem .45rem; border: 1px solid var(--rule); border-radius: 2px; color: var(--muted);
  }
  .tag.good { color: var(--pick); border-color: #a8ccbf; }
  .tag.warn { color: var(--warn); border-color: #e0bfa6; }

  details { margin: .55rem 0 0; }
  summary {
    font: 500 .78rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: var(--muted); cursor: pointer; padding: .2rem 0;
  }
  details ul { margin: .45rem 0 0; padding-left: 1.1rem; }
  details li { font-size: .82rem; margin-bottom: .28rem; word-break: break-all; }
  details a { color: var(--pick); }

  .bar {
    position: fixed; left: 0; right: 0; bottom: 0; background: var(--ink); color: #fff;
    padding: .7rem 1rem calc(.7rem + env(safe-area-inset-bottom));
    box-shadow: 0 -2px 14px rgba(0,0,0,.18);
  }
  .bar-in { max-width: 46rem; margin: 0 auto; display: flex; gap: .7rem; align-items: center; }
  .sel {
    flex: 1; min-width: 0; font: 500 .82rem/1.35 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #cfd3d8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .sel strong { color: #fff; font-weight: 600; }
  button {
    font: 600 .85rem/1 inherit; padding: .7rem 1rem; border: 0; border-radius: 3px;
    background: #fff; color: var(--ink); cursor: pointer; flex: none;
  }
  button:disabled { opacity: .35; cursor: default; }
  button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  .empty { padding: 2rem 0; color: var(--muted); }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="kicker">The Spatial Update &middot; assignment desk</div>
    <h1>Pitch sheet</h1>
    <div class="meta">__DATE__ &middot; __COUNT__ pitches &middot; from __SOURCEFILE__</div>
  </header>
__ROWS__
</div>

<div class="bar">
  <div class="bar-in">
    <div class="sel" id="sel">Nothing selected yet</div>
    <button id="copy" disabled>Copy selections</button>
  </div>
</div>

<script>
(function () {
  var DATE = "__DATE__";
  var boxes = Array.prototype.slice.call(document.querySelectorAll('input[type=checkbox]'));
  var sel = document.getElementById('sel');
  var btn = document.getElementById('copy');

  function picked() {
    return boxes.filter(function (b) { return b.checked; })
                .map(function (b) { return b.dataset.n; });
  }
  function payload() {
    return "PITCH SET " + DATE + "\\nSELECTED: " + picked().join(", ");
  }
  function refresh() {
    var p = picked();
    btn.disabled = p.length === 0;
    btn.textContent = 'Copy selections';
    sel.innerHTML = p.length
      ? '<strong>' + p.length + ' selected</strong> &middot; ' + p.join(', ')
      : 'Nothing selected yet';
  }
  boxes.forEach(function (b) { b.addEventListener('change', refresh); });

  btn.addEventListener('click', function () {
    var text = payload();
    function ok() { btn.textContent = 'Copied'; setTimeout(refresh, 1600); }
    function fallback() {
      var t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.focus(); t.select();
      try { document.execCommand('copy'); ok(); }
      catch (e) { btn.textContent = 'Press Ctrl+C'; }
      document.body.removeChild(t);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, fallback);
    } else { fallback(); }
  });

  refresh();
})();
</script>
</body>
</html>
"""


def render_pitch(n, p):
    tags = []
    strong = len(p["strong_domains"])
    if strong >= 3:
        tags.append(("good", str(strong) + " outlets"))
    elif strong == 2:
        tags.append(("", "2 outlets"))
    else:
        tags.append(("warn", "single outlet"))

    if p["mappable"] == "yes":
        tags.append(("good", "mappable"))
    elif p["mappable"] == "weak":
        tags.append(("warn", "weak geocode"))
    else:
        tags.append(("warn", "not mappable"))

    if p["novelty"] == "follow-on":
        ref = p["novelty_ref"] or "existing story"
        tags.append(("", "follow-on: " + ref))
    elif p["novelty"] == "new":
        tags.append(("", "new ground"))

    if p["mentions"]:
        tags.append(("", str(p["mentions"]) + " mentions"))

    tag_html = "".join(
        '<span class="tag %s">%s</span>' % (cls, esc(txt)) for cls, txt in tags
    )

    coord = ""
    if p["lat"] is not None and p["lon"] is not None:
        coord = " &middot; %.4f, %.4f" % (p["lat"], p["lon"])

    headline = ""
    if p["headline"] and p["headline"] != p["label"]:
        headline = '<p class="head">%s</p>' % esc(p["headline"])

    links = ""
    if p["source_urls"]:
        items = "".join(
            '<li><a href="%s" target="_blank" rel="noopener noreferrer">%s</a></li>'
            % (esc(u), esc(u))
            for u in p["source_urls"][:8]
        )
        links = (
            '<details><summary>%d source link%s</summary><ul>%s</ul></details>'
            % (len(p["source_urls"]), "" if len(p["source_urls"]) == 1 else "s", items)
        )

    return """  <label class="pitch">
    <div class="row">
      <input type="checkbox" data-n="%d">
      <div class="num">%02d</div>
      <div class="body">
        <h2>%s</h2>
        <div class="place">%s%s</div>
        %s
        <p class="angle"><b>Spatial angle:</b> %s</p>
        <div class="tags">%s</div>
        %s
      </div>
    </div>
  </label>
""" % (n, n, esc(p["label"]), esc(p["place"]), coord, headline,
       esc(p["angle"]), tag_html, links)


def render_page(pitches, date_str, source_file):
    if pitches:
        rows = "".join(render_pitch(i + 1, p) for i, p in enumerate(pitches))
    else:
        rows = ('<p class="empty">No pitches cleared the filters today. '
                'Loosen <code>MIN_DISTINCT_SOURCES</code> in pitch_sheet.py, '
                'or widen the window on gdelt_leads.py.</p>')
    return (PAGE
            .replace("__ROWS__", rows)
            .replace("__DATE__", esc(date_str))
            .replace("__COUNT__", str(len(pitches)))
            .replace("__SOURCEFILE__", esc(source_file)))


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Build a daily pitch sheet from GDELT candidates.")
    ap.add_argument("--in", dest="infile", default=None, help="path to candidates.json")
    ap.add_argument("--outdir", default=DEFAULT_OUTDIR, help="where to write the sheet")
    ap.add_argument("--max", type=int, default=MAX_PITCHES, help="max pitches on the sheet")
    ap.add_argument("--min-sources", type=int, default=MIN_DISTINCT_SOURCES,
                    help="minimum distinct non-aggregator outlets")
    ap.add_argument("--keep-unmappable", action="store_true",
                    help="keep country-centroid clusters instead of dropping them")
    args = ap.parse_args()

    infile = find_input(args.infile)
    clusters = load_clusters(infile)
    published = index_published_stories()

    enriched = [enrich(c, published) for c in clusters]

    kept = []
    for p in enriched:
        if len(p["strong_domains"]) < args.min_sources:
            continue
        if p["mappable"] == "no" and not args.keep_unmappable:
            continue
        kept.append(p)

    kept.sort(key=lambda p: p["pitch_score"], reverse=True)
    kept = kept[:args.max]

    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    os.makedirs(args.outdir, exist_ok=True)

    page = render_page(kept, date_str, os.path.basename(infile))
    for name in ("%s.html" % date_str, "latest.html"):
        with open(os.path.join(args.outdir, name), "w", encoding="utf-8") as f:
            f.write(page)

    companion = {
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "date": date_str,
        "source_file": infile,
        "count": len(kept),
        "pitches": [
            dict(n=i + 1, **{k: v for k, v in p.items() if k != "raw"}, raw=p["raw"])
            for i, p in enumerate(kept)
        ],
    }
    for name in ("%s.json" % date_str, "latest.json"):
        with open(os.path.join(args.outdir, name), "w", encoding="utf-8") as f:
            json.dump(companion, f, indent=2, ensure_ascii=False)

    dropped = len(enriched) - len(kept)
    print("Read %d clusters from %s" % (len(enriched), infile))
    print("Indexed %d coordinates from published stories" % len(published))
    print("Wrote %d pitches (%d filtered out) to %s"
          % (len(kept), dropped, os.path.join(args.outdir, "%s.html" % date_str)))
    print("Open pitches/latest.html, tick your picks, tap Copy selections.")


if __name__ == "__main__":
    main()
