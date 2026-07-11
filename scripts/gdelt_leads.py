#!/usr/bin/env python3
"""
GDELT story-lead finder for The Spatial Update.

Pulls recent GDELT 2.0 event exports, filters for geographically precise,
high-significance events, clusters related records, scores them, and writes:

  - candidates.json   (ranked shortlist with full details)
  - candidates.geojson (drop straight onto a Mapbox map to preview hotspots)
  - digest.md          (human-readable daily digest)

This is a LEAD-FINDING tool. It surfaces candidates + source links.
All research, verification, and writing stays with the editor.

Usage:
    python gdelt_leads.py                  # last 24h, defaults
    python gdelt_leads.py --hours 72       # look back 3 days
    python gdelt_leads.py --min-score 5    # raise the bar
    python gdelt_leads.py --outdir ./out   # where to write files

Requires: requests  (pip install requests)
"""

import argparse
import csv
import html
import io
import json
import math
import re
import sys
import zipfile
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# CONFIG — tune these to taste
# ---------------------------------------------------------------------------

# Minimum ActionGeo_Type. GDELT codes:
#   1 = country-level, 2 = US state, 3 = US city, 4 = world city, 5 = world state
# For a map-driven site you want point-level precision: 3 and 4.
PRECISE_GEO_TYPES = {3, 4}

# --- TOPIC PRESET -----------------------------------------------------------
# Change this one line to change what kind of stories the scraper looks for.
# Options: "conflict", "cooperation", "broad", "infrastructure"
TOPIC_PRESET = "broad"

# What each preset means, in GDELT's own vocabulary:
#   QuadClass: 1=Verbal Cooperation, 2=Material Cooperation,
#              3=Verbal Conflict,    4=Material Conflict
#   root_codes: CAMEO event categories, see ROOT_LABELS below for the full list.
#               None = don't filter by category, just by quad class.
PRESETS = {
    # Strikes, clashes, seizures, threats, protests. The original "war" mode.
    "conflict": {
        "quad_classes": {3, 4},
        "root_codes": None,
        "min_abs_goldstein": 4.0,
    },
    # Treaties, aid, trade deals, diplomatic visits, port/base agreements —
    # the "good news" / partnership side of geopolitics.
    "cooperation": {
        "quad_classes": {1, 2},
        "root_codes": None,
        "min_abs_goldstein": 3.0,  # cooperation events tend to score lower magnitude
    },
    # Everything — conflict AND cooperation. Good default if you don't want
    # the scraper pre-deciding what counts as "newsworthy" for you.
    "broad": {
        "quad_classes": {1, 2, 3, 4},
        "root_codes": None,
        "min_abs_goldstein": 3.0,
    },
    # Deals, construction, resource/energy agreements, aid, consultations —
    # good for Belt-and-Road-style economic/infrastructure stories.
    "infrastructure": {
        "quad_classes": {1, 2, 3, 4},
        "root_codes": {"05", "06", "07", "17"},
        "min_abs_goldstein": 2.0,
    },
}

_active = PRESETS[TOPIC_PRESET]
QUAD_CLASSES = _active["quad_classes"]
EVENT_ROOT_CODES = _active["root_codes"]

# Ignore events with |GoldsteinScale| below this (scale is -10..+10;
# large magnitude = geopolitically significant; sign follows conflict(-)
# vs cooperation(+) for QuadClass 1/2/3/4 events).
MIN_ABS_GOLDSTEIN = _active["min_abs_goldstein"]

# Drop clusters mentioned fewer than this many times total (noise floor).
MIN_CLUSTER_MENTIONS = 10

# Grid size in degrees for clustering nearby records of the same event type.
# 0.25° ≈ 25 km. Smaller = stricter clustering.
CLUSTER_GRID_DEG = 0.25

# If True, the final list alternates between conflict-type and cooperation-type
# leads instead of pure score order. This prevents conflict stories (which
# always get more raw media coverage) from crowding cooperation/diplomatic/
# economic stories out of the digest entirely. Set False for pure score order.
BALANCE_CATEGORIES = True

# If True, fetches the actual news headline from each lead's top source URL
# (one extra web request per lead — adds runtime, occasionally fails on
# paywalled/blocked sites, which is fine, it just falls back silently).
# If False, leads only get the free templated synopsis (instant, no network).
FETCH_HEADLINES = True
HEADLINE_TIMEOUT = 6  # seconds to wait per article before giving up

# GDELT event root code -> readable label (for the digest)
ROOT_LABELS = {
    "01": "Public statement", "02": "Appeal", "03": "Intent to cooperate",
    "04": "Consultation", "05": "Diplomatic cooperation", "06": "Material cooperation",
    "07": "Aid", "08": "Yield/concede", "09": "Investigation",
    "10": "Demand", "11": "Disapproval", "12": "Rejection",
    "13": "Threat", "14": "Protest", "15": "Force posture / mobilization",
    "16": "Reduce relations / sanctions", "17": "Coercion / seizure",
    "18": "Assault", "19": "Fighting / clashes", "20": "Mass violence",
}

GDELT_BASE = "http://data.gdeltproject.org/gdeltv2"

# GDELT 2.0 export column indices (61 tab-separated columns, no header)
COL = {
    "GLOBALEVENTID": 0, "SQLDATE": 1,
    "Actor1Name": 6, "Actor1CountryCode": 7,
    "Actor2Name": 16, "Actor2CountryCode": 17,
    "EventCode": 26, "EventRootCode": 28, "QuadClass": 29,
    "GoldsteinScale": 30, "NumMentions": 31, "NumSources": 32,
    "NumArticles": 33, "AvgTone": 34,
    "ActionGeo_Type": 51, "ActionGeo_FullName": 52,
    "ActionGeo_CountryCode": 53, "ActionGeo_Lat": 56, "ActionGeo_Long": 57,
    "DATEADDED": 59, "SOURCEURL": 60,
}

# ---------------------------------------------------------------------------
# Fetching
# ---------------------------------------------------------------------------

def export_urls_for_window(hours: int):
    """GDELT publishes one export zip every 15 minutes, named by UTC timestamp.
    Generate the URLs for the lookback window (newest first)."""
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    # snap to the last completed 15-minute boundary
    now -= timedelta(minutes=now.minute % 15)
    slots = int(hours * 4)
    for i in range(1, slots + 1):
        ts = now - timedelta(minutes=15 * i)
        stamp = ts.strftime("%Y%m%d%H%M%S")
        yield f"{GDELT_BASE}/{stamp}.export.CSV.zip"


def fetch_export(url: str, session: requests.Session):
    """Download one 15-minute export zip; return rows (list of column lists).
    Missing files (404) are normal — GDELT occasionally skips a slot."""
    try:
        r = session.get(url, timeout=30)
        if r.status_code == 404:
            return []
        r.raise_for_status()
        zf = zipfile.ZipFile(io.BytesIO(r.content))
        name = zf.namelist()[0]
        text = zf.read(name).decode("utf-8", errors="replace")
        reader = csv.reader(io.StringIO(text), delimiter="\t")
        return [row for row in reader if len(row) >= 61]
    except requests.RequestException as e:
        print(f"  ! skipped {url.rsplit('/',1)[-1]}: {e}", file=sys.stderr)
        return []


# ---------------------------------------------------------------------------
# Filtering / clustering / scoring
# ---------------------------------------------------------------------------

def parse_row(row):
    """Extract the fields we care about; return None if unusable."""
    try:
        geo_type = int(row[COL["ActionGeo_Type"]] or 0)
        lat = float(row[COL["ActionGeo_Lat"]])
        lon = float(row[COL["ActionGeo_Long"]])
    except (ValueError, TypeError):
        return None
    try:
        quad = int(row[COL["QuadClass"]] or 0)
        goldstein = float(row[COL["GoldsteinScale"]] or 0)
        mentions = int(row[COL["NumMentions"]] or 0)
        sources = int(row[COL["NumSources"]] or 0)
        tone = float(row[COL["AvgTone"]] or 0)
    except (ValueError, TypeError):
        return None
    return {
        "event_id": row[COL["GLOBALEVENTID"]],
        "date": row[COL["SQLDATE"]],
        "added": row[COL["DATEADDED"]],
        "actor1": row[COL["Actor1Name"]] or row[COL["Actor1CountryCode"]],
        "actor2": row[COL["Actor2Name"]] or row[COL["Actor2CountryCode"]],
        "root_code": row[COL["EventRootCode"]],
        "quad": quad,
        "goldstein": goldstein,
        "mentions": mentions,
        "sources": sources,
        "tone": tone,
        "geo_type": geo_type,
        "place": row[COL["ActionGeo_FullName"]],
        "country": row[COL["ActionGeo_CountryCode"]],
        "lat": lat,
        "lon": lon,
        "url": row[COL["SOURCEURL"]],
    }


def passes_filters(e):
    if e["geo_type"] not in PRECISE_GEO_TYPES:
        return False
    if e["quad"] not in QUAD_CLASSES:
        return False
    if abs(e["goldstein"]) < MIN_ABS_GOLDSTEIN:
        return False
    if EVENT_ROOT_CODES and e["root_code"] not in EVENT_ROOT_CODES:
        return False
    return True


def cluster_key(e):
    """Same real-world event tends to share location + event type + day."""
    return (
        round(e["lat"] / CLUSTER_GRID_DEG),
        round(e["lon"] / CLUSTER_GRID_DEG),
        e["root_code"],
        e["date"],
    )


def recency_weight(date_str, now):
    """1.0 for today, decaying ~0.5 per 2 days back."""
    try:
        d = datetime.strptime(date_str, "%Y%m%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return 0.5
    days = max(0.0, (now - d).total_seconds() / 86400)
    return 0.5 ** (days / 2.0)


def score_cluster(records, now):
    """Score = how much media attention this is getting, weighted by recency.

    Deliberately does NOT factor in Goldstein magnitude. GDELT's own scale
    assigns violent events extreme values (near +/-10) far more often than
    it assigns cooperation events extreme values (most cluster near 0-3), so
    using Goldstein as a score multiplier systematically ranks conflict
    stories above cooperation/diplomatic/economic ones regardless of how
    newsworthy each actually is. Goldstein is still shown in the digest for
    context, and MIN_ABS_GOLDSTEIN still filters out trivial/low-signal
    events, but it no longer inflates or deflates the ranking itself.
    """
    mentions = sum(r["mentions"] for r in records)
    sources = sum(r["sources"] for r in records)
    newest = max(r["date"] for r in records)
    # log-scaled attention (mentions weighted more than raw source count)
    return (math.log10(1 + mentions) + 0.5 * math.log10(1 + sources)) \
        * recency_weight(newest, now)


def make_synopsis(label, category, actors, place, total_mentions, total_sources):
    """Free, instant, template-based one-line summary from GDELT's own fields.
    No network call — always available even if headline fetching is off/fails."""
    if len(actors) >= 2:
        who = f"{actors[0]} and {actors[1]}"
    elif actors:
        who = actors[0]
    else:
        who = "Unnamed actors"
    verb = "engaging in cooperation" if category == "cooperation" else "in conflict"
    return (
        f"{who} — {label.lower()} ({verb}) reported near {place}, "
        f"covered by {total_sources} source(s) across {total_mentions} mentions."
    )


_TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)


def fetch_headline(url, session):
    """Best-effort fetch of an article's real headline from its <title> tag.
    Returns None on any failure (paywall, timeout, blocked, weird encoding) —
    callers should always have the templated synopsis as a fallback."""
    if not url:
        return None
    try:
        r = session.get(url, timeout=HEADLINE_TIMEOUT,
                         headers={"User-Agent": "Mozilla/5.0 (spatial-update-leads/1.0)"})
        if r.status_code != 200:
            return None
        m = _TITLE_RE.search(r.text[:20000])  # title is always near the top
        if not m:
            return None
        title = html.unescape(m.group(1)).strip()
        title = re.sub(r"\s+", " ", title)
        # strip common " - Site Name" / " | Site Name" suffixes
        title = re.split(r"\s[\|\u2013\u2014-]\s", title)[0].strip()
        return title[:200] if title else None
    except requests.RequestException:
        return None


def build_candidates(events, now):
    clusters = defaultdict(list)
    for e in events:
        clusters[cluster_key(e)].append(e)

    candidates = []
    for key, records in clusters.items():
        total_mentions = sum(r["mentions"] for r in records)
        if total_mentions < MIN_CLUSTER_MENTIONS:
            continue
        # representative record = most-mentioned
        rep = max(records, key=lambda r: r["mentions"])
        urls = []
        seen = set()
        for r in sorted(records, key=lambda r: -r["mentions"]):
            if r["url"] and r["url"] not in seen:
                urls.append(r["url"])
                seen.add(r["url"])
            if len(urls) >= 6:
                break
        actors = sorted({a for r in records for a in (r["actor1"], r["actor2"]) if a})
        label = ROOT_LABELS.get(rep["root_code"], f"CAMEO {rep['root_code']}")
        category = "cooperation" if rep["quad"] in (1, 2) else "conflict"
        total_sources = sum(r["sources"] for r in records)
        candidates.append({
            "label": label,
            "category": category,
            "place": rep["place"],
            "country": rep["country"],
            "lat": rep["lat"],
            "lon": rep["lon"],
            "date": rep["date"],
            "actors": actors[:8],
            "records": len(records),
            "total_mentions": total_mentions,
            "total_sources": total_sources,
            "max_abs_goldstein": max(abs(r["goldstein"]) for r in records),
            "avg_tone": round(sum(r["tone"] for r in records) / len(records), 2),
            "score": round(score_cluster(records, now), 3),
            "source_urls": urls,
            "synopsis": make_synopsis(label, category, actors[:8], rep["place"],
                                       total_mentions, total_sources),
            "headline": None,  # filled in later by fetch_headline, if enabled
        })
    candidates.sort(key=lambda c: -c["score"])
    return candidates


def balance_categories(candidates, top):
    """Alternate between the best conflict lead and the best cooperation lead
    so neither category can crowd the other out of the digest. Within each
    category, score order is preserved. Falls back gracefully if one category
    runs dry (the rest of the list fills with the other)."""
    coop = [c for c in candidates if c["category"] == "cooperation"]
    conf = [c for c in candidates if c["category"] == "conflict"]
    # start with whichever category holds the single highest-scoring lead
    first, second = (coop, conf)
    if conf and (not coop or conf[0]["score"] > coop[0]["score"]):
        first, second = (conf, coop)
    out, i, j = [], 0, 0
    while len(out) < top and (i < len(first) or j < len(second)):
        if i < len(first):
            out.append(first[i]); i += 1
        if len(out) < top and j < len(second):
            out.append(second[j]); j += 1
    return out


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def to_geojson(candidates):
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [c["lon"], c["lat"]]},
                "properties": {
                    "title": f'{c["label"]} — {c["place"]}',
                    "date": c["date"],
                    "score": c["score"],
                    "mentions": c["total_mentions"],
                    "actors": ", ".join(c["actors"]),
                    "headline": c.get("headline"),
                    "synopsis": c["synopsis"],
                    "sources": c["source_urls"][:3],
                },
            }
            for c in candidates
        ],
    }


def to_digest(candidates, hours, now):
    lines = [
        f"# Story-lead digest — {now.strftime('%Y-%m-%d %H:%M UTC')}",
        f"_Lookback: {hours}h · {len(candidates)} candidates above threshold_",
        "",
    ]
    for i, c in enumerate(candidates, 1):
        d = f'{c["date"][:4]}-{c["date"][4:6]}-{c["date"][6:]}'
        tag = "🤝" if c["category"] == "cooperation" else "⚡"
        lines.append(f"## {i}. {tag} {c['label']} — {c['place']}")
        lines.append(
            f"**{d}** · score {c['score']} · {c['total_mentions']} mentions "
            f"across {c['records']} records · Goldstein |{c['max_abs_goldstein']}| "
            f"· tone {c['avg_tone']} · ({c['lat']:.3f}, {c['lon']:.3f})"
        )
        if c["actors"]:
            lines.append(f"Actors: {', '.join(c['actors'])}")
        if c.get("headline"):
            lines.append(f"**\u201c{c['headline']}\u201d**")
        lines.append(c["synopsis"])
        for u in c["source_urls"]:
            lines.append(f"- {u}")
        lines.append("")
    return "\n".join(lines)


def _esc(s):
    """HTML-escape untrusted text. Headlines come from external webpages,
    so everything user-visible must be escaped before going into HTML."""
    return html.escape(str(s or ""), quote=True)


def to_html(candidates, hours, now):
    """Self-contained mobile-friendly 'morning paper' page. Dark theme to
    match the site, no external assets, renders offline."""
    n = len(candidates)
    n_coop = sum(1 for c in candidates if c["category"] == "cooperation")
    n_conf = n - n_coop
    day = now.strftime("%A, %B %d, %Y")

    cards = []
    for i, c in enumerate(candidates, 1):
        d = f'{c["date"][:4]}-{c["date"][4:6]}-{c["date"][6:]}'
        is_coop = c["category"] == "cooperation"
        accent = "#4ade80" if is_coop else "#f87171"
        badge = "COOPERATION" if is_coop else "CONFLICT"
        headline = _esc(c.get("headline")) if c.get("headline") else None
        title_html = f'<div class="headline">\u201c{headline}\u201d</div>' if headline else ""
        sources = "".join(
            f'<a class="src" href="{_esc(u)}" target="_blank" rel="noopener">'
            f'{_esc(u.split("/")[2] if "://" in u else u)}</a>'
            for u in c["source_urls"][:4]
        )
        actors = _esc(", ".join(c["actors"][:4])) if c["actors"] else ""
        cards.append(f"""
    <article class="card" style="border-left-color:{accent}">
      <div class="meta-row">
        <span class="badge" style="color:{accent};border-color:{accent}">{badge}</span>
        <span class="date">{d}</span>
      </div>
      <h2>{_esc(c["label"])} \u2014 {_esc(c["place"])}</h2>
      {title_html}
      <p class="synopsis">{_esc(c["synopsis"])}</p>
      {f'<p class="actors">{actors}</p>' if actors else ''}
      <div class="stats">
        <span>{c["total_mentions"]} mentions</span>
        <span>{c["total_sources"]} sources</span>
        <span>({c["lat"]:.2f}, {c["lon"]:.2f})</span>
      </div>
      <div class="sources">{sources}</div>
    </article>""")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>The Spatial Update \u2014 Morning Leads</title>
<style>
  :root {{ color-scheme: dark; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ background:#0d1117; color:#e6edf3; font:16px/1.55 Georgia,'Times New Roman',serif;
         max-width:640px; margin:0 auto; padding:20px 16px 60px; }}
  header {{ text-align:center; border-bottom:3px double #30363d; padding-bottom:16px; margin-bottom:8px; }}
  header h1 {{ font-size:26px; letter-spacing:1px; font-variant:small-caps; }}
  header .sub {{ color:#8b949e; font-size:13px; font-style:italic; margin-top:4px; }}
  .summary {{ display:flex; justify-content:center; gap:18px; padding:12px 0;
              border-bottom:1px solid #30363d; margin-bottom:20px;
              font:13px system-ui,sans-serif; color:#8b949e; }}
  .summary b {{ color:#e6edf3; font-size:17px; display:block; text-align:center; }}
  .card {{ background:#161b22; border:1px solid #30363d; border-left:4px solid;
           border-radius:8px; padding:16px; margin-bottom:14px; }}
  .meta-row {{ display:flex; justify-content:space-between; align-items:center;
               font:11px system-ui,sans-serif; margin-bottom:8px; }}
  .badge {{ border:1px solid; border-radius:10px; padding:1px 8px; letter-spacing:1px; }}
  .date {{ color:#8b949e; }}
  h2 {{ font-size:18px; line-height:1.3; margin-bottom:6px; }}
  .headline {{ font-style:italic; color:#c9d1d9; font-size:15px; margin-bottom:8px; }}
  .synopsis {{ font:14px/1.5 system-ui,sans-serif; color:#8b949e; margin-bottom:8px; }}
  .actors {{ font:12px system-ui,sans-serif; color:#6e7681; margin-bottom:8px; }}
  .stats {{ display:flex; gap:14px; font:12px system-ui,sans-serif; color:#6e7681;
            margin-bottom:10px; flex-wrap:wrap; }}
  .sources {{ display:flex; gap:8px; flex-wrap:wrap; }}
  .src {{ font:12px system-ui,sans-serif; color:#58a6ff; text-decoration:none;
          background:#0d1117; border:1px solid #30363d; border-radius:6px; padding:3px 10px; }}
  .empty {{ text-align:center; color:#8b949e; padding:40px 0; font-style:italic; }}
  footer {{ text-align:center; color:#484f58; font:11px system-ui,sans-serif;
            margin-top:30px; border-top:1px solid #30363d; padding-top:14px; }}
</style>
</head>
<body>
<header>
  <h1>The Spatial Update</h1>
  <div class="sub">Morning Leads \u00b7 {day}</div>
</header>
<div class="summary">
  <div><b>{n}</b>leads</div>
  <div><b>{n_conf}</b>conflict</div>
  <div><b>{n_coop}</b>cooperation</div>
  <div><b>{hours}h</b>window</div>
</div>
{"".join(cards) if cards else '<p class="empty">No leads cleared the threshold today.</p>'}
<footer>Generated {now.strftime("%Y-%m-%d %H:%M UTC")} \u00b7 GDELT event data \u00b7 leads are unverified \u2014 confirm before publishing</footer>
</body>
</html>"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="GDELT story-lead finder")
    ap.add_argument("--hours", type=int, default=24, help="lookback window (default 24)")
    ap.add_argument("--min-score", type=float, default=0.0, help="minimum score to keep")
    ap.add_argument("--top", type=int, default=25, help="max candidates in output")
    ap.add_argument("--outdir", default=".", help="output directory")
    args = ap.parse_args()

    now = datetime.now(timezone.utc)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    session.headers["User-Agent"] = "spatial-update-leads/1.0"

    events = []
    urls = list(export_urls_for_window(args.hours))
    print(f"Fetching {len(urls)} GDELT export files ({args.hours}h window)...")
    for n, url in enumerate(urls, 1):
        rows = fetch_export(url, session)
        for row in rows:
            e = parse_row(row)
            if e and passes_filters(e):
                events.append(e)
        if n % 16 == 0:
            print(f"  {n}/{len(urls)} files · {len(events)} events kept so far")

    print(f"{len(events)} precise, significant event records after filtering.")
    candidates = build_candidates(events, now)
    candidates = [c for c in candidates if c["score"] >= args.min_score]
    if BALANCE_CATEGORIES:
        candidates = balance_categories(candidates, args.top)
    else:
        candidates = candidates[: args.top]
    n_coop = sum(1 for c in candidates if c["category"] == "cooperation")
    print(f"{len(candidates)} candidate story leads "
          f"({len(candidates) - n_coop} conflict / {n_coop} cooperation).")

    if FETCH_HEADLINES:
        print(f"Fetching real headlines for {len(candidates)} leads...")
        for i, c in enumerate(candidates, 1):
            top_url = c["source_urls"][0] if c["source_urls"] else None
            c["headline"] = fetch_headline(top_url, session)
            if i % 10 == 0:
                print(f"  {i}/{len(candidates)}")

    # Dated files (one per run, never overwritten) so you keep a full archive.
    stamp = now.strftime("%Y-%m-%d_%H%M")
    json_text = json.dumps(candidates, indent=2)
    geojson_text = json.dumps(to_geojson(candidates), indent=2)
    digest_text = to_digest(candidates, args.hours, now)
    html_text = to_html(candidates, args.hours, now)

    (outdir / f"candidates-{stamp}.json").write_text(json_text, encoding="utf-8")
    (outdir / f"candidates-{stamp}.geojson").write_text(geojson_text, encoding="utf-8")
    (outdir / f"digest-{stamp}.md").write_text(digest_text, encoding="utf-8")
    (outdir / f"digest-{stamp}.html").write_text(html_text, encoding="utf-8")

    # "latest" copies always overwrite, for quickly checking the newest run
    # without hunting for today's timestamp.
    (outdir / "latest.json").write_text(json_text, encoding="utf-8")
    (outdir / "latest.geojson").write_text(geojson_text, encoding="utf-8")
    (outdir / "latest.md").write_text(digest_text, encoding="utf-8")
    (outdir / "latest.html").write_text(html_text, encoding="utf-8")

    print(f"Wrote digest-{stamp}.md (+ json/geojson) and latest.* to {outdir.resolve()}")


if __name__ == "__main__":
    main()