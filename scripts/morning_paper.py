#!/usr/bin/env python3
"""
The Spatial Update — Morning Edition
A personal morning newspaper generator.

Pulls from free, keyless sources:
  - RSS feeds (world, US, Pacific Northwest, science, tech, fun)
  - ESPN public scoreboards (your teams' scores)
  - Open-Meteo (Bremerton weather)
  - Stooq (markets snapshot)
  - Wikipedia (on this day in history)
  - GDELT geo radar (optional, reuses gdelt_leads.py)

Outputs:
  paper/latest.html   — the morning paper (publish this)
  paper/latest.json   — compact summary (used by mobile_notify.py)
  paper/edition-YYYY-MM-DD.html — dated archive copy

Every source is optional: if one fails or times out, its section is
skipped or shrinks and the rest of the paper still prints.

Usage:
    python morning_paper.py --outdir ../paper

Requires: requests, feedparser   (pip install requests feedparser)
"""

import argparse
import html
import json
import random
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import feedparser
import requests

# ---------------------------------------------------------------------------
# CONFIG — your paper, your rules. Everything here is editable.
# ---------------------------------------------------------------------------

PAPER_NAME = "The Spatial Update"
EDITION_NAME = "Morning Edition"

# Home location for weather (Bremerton, WA)
HOME_LAT, HOME_LON = 47.567, -122.633
HOME_TZ = "America/Los_Angeles"

FEED_TIMEOUT = 10          # seconds per feed before giving up
MAX_SYNOPSIS_CHARS = 220   # trim RSS summaries to this length
MAX_RELATED = 3            # related-story links per story
FRESH_HOURS = 36           # ignore feed items older than this

# How many stories per section (totals ~17 before sports/extras)
SECTIONS = [
    # (section key, display name, stories to show)
    ("world",   "World",                 4),
    ("us",      "U.S. National",         3),
    ("pnw",     "Pacific Northwest",     3),
    ("science", "Science & Environment", 3),
    ("tech",    "Tech & Business",       2),
    ("fun",     "The Lighter Side",      2),
]

# RSS feeds per section. Add/remove freely — one URL per line.
# If a feed dies someday, it just gets skipped; the paper still prints.
FEEDS = {
    "world": [
        "http://feeds.bbci.co.uk/news/world/rss.xml",
        "https://www.theguardian.com/world/rss",
        "https://www.aljazeera.com/xml/rss/all.xml",
        "https://feeds.npr.org/1004/rss.xml",
    ],
    "us": [
        "https://feeds.npr.org/1003/rss.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
    ],
    "pnw": [
        "https://www.seattletimes.com/feed/",
        "https://www.oregonlive.com/arc/outboundfeeds/rss/?outputType=xml",
        "https://www.opb.org/feeds/all/",
        "https://www.kuow.org/feeds/all.rss",
    ],
    "science": [
        "https://www.sciencedaily.com/rss/top/science.xml",
        "https://www.theguardian.com/environment/rss",
        "https://www.nasa.gov/feed/",
    ],
    "tech": [
        "https://feeds.arstechnica.com/arstechnica/index",
        "https://www.theverge.com/rss/index.xml",
        "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    ],
    "fun": [
        "https://www.atlasobscura.com/feeds/latest",
        "https://www.smithsonianmag.com/rss/latest_articles/",
        "https://www.goodnewsnetwork.org/feed/",
    ],
    "sports_stories": [
        "https://www.seattletimes.com/sports/feed/",
        "https://www.espn.com/espn/rss/news",
    ],
}

# Sports teams: (ESPN sport path, league path, name keywords to match)
TEAMS = [
    ("baseball",   "mlb",                      ["Mariners"]),
    ("football",   "nfl",                      ["Seahawks"]),
    ("hockey",     "nhl",                      ["Kraken"]),
    ("soccer",     "usa.1",                    ["Sounders"]),
    ("basketball", "nba",                      ["Trail Blazers", "Blazers"]),
    ("football",   "college-football",         ["Oregon State"]),
    ("basketball", "mens-college-basketball",  ["Oregon State"]),
]
SPORTS_STORY_COUNT = 3
TEAM_STORY_KEYWORDS = ["Mariners", "Seahawks", "Kraken", "Sounders",
                        "Trail Blazers", "Blazers", "Oregon State", "Beavers",
                        "Willamette"]

# Markets snapshot symbols on stooq.com (^spx = S&P 500, ^dji = Dow, ^ndq = Nasdaq)
MARKET_SYMBOLS = [("^spx", "S&P 500"), ("^dji", "Dow"), ("^ndq", "Nasdaq")]

# GDELT geo radar (small taste of the original leads pipeline)
INCLUDE_GEO_RADAR = True
GEO_RADAR_HOURS = 6      # short window keeps it fast
GEO_RADAR_COUNT = 3

STOPWORDS = set("""a an and are as at be but by for from has have in is it its
of on or that the this to was were will with after over under new says said
amid could would""".split())

# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------

def esc(s):
    return html.escape(str(s or ""), quote=True)


def strip_html(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def title_tokens(title):
    words = re.findall(r"[a-z']+", (title or "").lower())
    return {w for w in words if len(w) > 3 and w not in STOPWORDS}


def get_json(url, session, timeout=10, params=None):
    try:
        r = session.get(url, timeout=timeout, params=params)
        r.raise_for_status()
        return r.json()
    except (requests.RequestException, ValueError) as e:
        print(f"  ! {url.split('/')[2]}: {e}", file=sys.stderr)
        return None

# ---------------------------------------------------------------------------
# Masthead extras: weather, markets, on this day
# ---------------------------------------------------------------------------

WMO_CODES = {
    0: "clear", 1: "mostly clear", 2: "partly cloudy", 3: "overcast",
    45: "fog", 48: "fog", 51: "drizzle", 53: "drizzle", 55: "drizzle",
    61: "light rain", 63: "rain", 65: "heavy rain", 66: "freezing rain",
    67: "freezing rain", 71: "light snow", 73: "snow", 75: "heavy snow",
    77: "snow", 80: "showers", 81: "showers", 82: "heavy showers",
    85: "snow showers", 86: "snow showers", 95: "thunderstorms",
    96: "thunderstorms", 99: "thunderstorms",
}


def get_weather(session):
    data = get_json(
        "https://api.open-meteo.com/v1/forecast", session,
        params={
            "latitude": HOME_LAT, "longitude": HOME_LON,
            "current_weather": "true",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
            "temperature_unit": "fahrenheit",
            "timezone": HOME_TZ, "forecast_days": 1,
        })
    if not data:
        return None
    try:
        cur = data["current_weather"]
        daily = data["daily"]
        code = int(daily["weathercode"][0])
        return {
            "now_f": round(cur["temperature"]),
            "hi_f": round(daily["temperature_2m_max"][0]),
            "lo_f": round(daily["temperature_2m_min"][0]),
            "precip_pct": int(daily["precipitation_probability_max"][0] or 0),
            "desc": WMO_CODES.get(code, "mixed"),
        }
    except (KeyError, IndexError, TypeError, ValueError):
        return None


def get_markets(session):
    syms = ",".join(s for s, _ in MARKET_SYMBOLS)
    try:
        r = session.get("https://stooq.com/q/l/",
                        params={"s": syms, "f": "sd2t2ohlcv", "h": "", "e": "csv"},
                        timeout=10)
        r.raise_for_status()
        lines = r.text.strip().splitlines()
    except requests.RequestException as e:
        print(f"  ! stooq: {e}", file=sys.stderr)
        return []
    out = []
    label = dict(MARKET_SYMBOLS)
    for line in lines[1:]:
        # csv columns: Symbol,Date,Time,Open,High,Low,Close,Volume
        parts = line.split(",")
        if len(parts) < 7:
            continue
        sym = parts[0].lower()
        try:
            open_p = float(parts[3])
            close_p = float(parts[6])
        except (ValueError, IndexError):
            continue
        if open_p <= 0:
            continue
        pct = (close_p - open_p) / open_p * 100
        out.append({"name": label.get(sym, sym), "close": close_p, "pct": round(pct, 2)})
    return out


def get_on_this_day(session, now):
    data = get_json(
        f"https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/"
        f"{now.month:02d}/{now.day:02d}", session)
    if not data or not data.get("selected"):
        return None
    # pick a mid-list item; the first is often the same famous few
    items = data["selected"]
    pick = items[min(len(items) - 1, random.randrange(min(5, len(items))))]
    try:
        return {"year": pick["year"], "text": strip_html(pick["text"])}
    except KeyError:
        return None

# ---------------------------------------------------------------------------
# Sports scores (ESPN public scoreboard)
# ---------------------------------------------------------------------------

def get_scores(session, now):
    """Yesterday's finals + today's games for each configured team."""
    results = []
    seen = set()
    dates = [(now - timedelta(days=1)).strftime("%Y%m%d"), now.strftime("%Y%m%d")]
    for sport, league, keywords in TEAMS:
        for d in dates:
            data = get_json(
                f"https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard",
                session, params={"dates": d})
            if not data:
                continue
            for ev in data.get("events", []):
                if ev.get("id") in seen:
                    continue
                name = ev.get("name", "")
                if not any(k.lower() in name.lower() for k in keywords):
                    continue
                comp = (ev.get("competitions") or [{}])[0]
                teams = comp.get("competitors") or []
                if len(teams) < 2:
                    continue
                try:
                    away = next(t for t in teams if t.get("homeAway") == "away")
                    home = next(t for t in teams if t.get("homeAway") == "home")
                except StopIteration:
                    continue
                status = (ev.get("status") or {}).get("type", {})
                results.append({
                    "matchup": f'{away["team"]["shortDisplayName"]} @ {home["team"]["shortDisplayName"]}',
                    "away_score": away.get("score", ""),
                    "home_score": home.get("score", ""),
                    "state": status.get("description", ""),
                    "detail": status.get("shortDetail", ""),
                    "league": league.upper().replace("USA.1", "MLS"),
                })
                seen.add(ev.get("id"))
    return results

# ---------------------------------------------------------------------------
# News stories from RSS
# ---------------------------------------------------------------------------

def fetch_feed(url, session):
    """Fetch with requests (for timeout control), parse with feedparser."""
    try:
        r = session.get(url, timeout=FEED_TIMEOUT,
                        headers={"User-Agent": "Mozilla/5.0 (spatial-update-paper/1.0)"})
        r.raise_for_status()
        parsed = feedparser.parse(r.content)
        return parsed.entries or []
    except requests.RequestException as e:
        print(f"  ! feed {url.split('/')[2]}: {e}", file=sys.stderr)
        return []


def entry_to_story(entry, now):
    title = strip_html(getattr(entry, "title", "")).strip()
    link = getattr(entry, "link", "") or ""
    if not title or not link:
        return None
    published = None
    for attr in ("published_parsed", "updated_parsed"):
        t = getattr(entry, attr, None)
        if t:
            published = datetime.fromtimestamp(time.mktime(t), tz=timezone.utc)
            break
    if published and (now - published) > timedelta(hours=FRESH_HOURS):
        return None
    summary = strip_html(getattr(entry, "summary", "") or "")
    if summary.lower().startswith(title.lower()[:40]):
        summary = summary[len(title):].strip(" -–—:.") or summary
    if len(summary) > MAX_SYNOPSIS_CHARS:
        summary = summary[:MAX_SYNOPSIS_CHARS - 1].rsplit(" ", 1)[0] + "\u2026"
    domain = link.split("/")[2].replace("www.", "") if "://" in link else ""
    return {
        "title": title, "link": link, "summary": summary,
        "source": domain, "published": published,
        "tokens": title_tokens(title),
    }


def gather_section(urls, session, now):
    stories, seen_titles = [], set()
    for url in urls:
        for entry in fetch_feed(url, session)[:15]:
            s = entry_to_story(entry, now)
            if not s:
                continue
            key = " ".join(sorted(s["tokens"]))[:80]
            if key in seen_titles:
                continue
            seen_titles.add(key)
            stories.append(s)
    stories.sort(key=lambda s: s["published"] or datetime.min.replace(tzinfo=timezone.utc),
                 reverse=True)
    return stories


def attach_related(chosen, pool):
    """Link stories from other outlets covering the same thing (>=3 shared
    meaningful title words)."""
    for story in chosen:
        related = []
        for other in pool:
            if other["link"] == story["link"]:
                continue
            if len(story["tokens"] & other["tokens"]) >= 3:
                related.append(other)
            if len(related) >= MAX_RELATED:
                break
        story["related"] = related


def pick_diverse(stories, n):
    """Take top-N by recency but avoid two stories about the same thing."""
    out = []
    for s in stories:
        if any(len(s["tokens"] & o["tokens"]) >= 3 for o in out):
            continue
        out.append(s)
        if len(out) >= n:
            break
    return out

# ---------------------------------------------------------------------------
# GDELT geo radar (optional)
# ---------------------------------------------------------------------------

def get_geo_radar(session, now):
    try:
        import gdelt_leads as g
    except ImportError:
        print("  ! gdelt_leads.py not found; skipping geo radar", file=sys.stderr)
        return []
    try:
        events = []
        for url in g.export_urls_for_window(GEO_RADAR_HOURS):
            for row in g.fetch_export(url, session):
                e = g.parse_row(row)
                if e and g.passes_filters(e):
                    events.append(e)
        cands = g.build_candidates(events, now)
        cands = g.balance_categories(cands, GEO_RADAR_COUNT)
        return cands
    except Exception as e:  # radar must never sink the paper
        print(f"  ! geo radar failed: {e}", file=sys.stderr)
        return []

# ---------------------------------------------------------------------------
# HTML rendering
# ---------------------------------------------------------------------------

def render_html(ctx):
    now = ctx["now"]
    day = now.astimezone(timezone.utc).strftime("%A, %B %d, %Y")

    # masthead strip
    strip = []
    w = ctx.get("weather")
    if w:
        strip.append(f'<div><b>{w["now_f"]}\u00b0F</b>{esc(w["desc"])} \u00b7 '
                     f'H {w["hi_f"]}\u00b0 / L {w["lo_f"]}\u00b0 \u00b7 rain {w["precip_pct"]}%</div>')
    for mkt in ctx.get("markets", []):
        arrow = "\u25b2" if mkt["pct"] >= 0 else "\u25bc"
        color = "#4ade80" if mkt["pct"] >= 0 else "#f87171"
        strip.append(f'<div><b style="color:{color}">{arrow} {abs(mkt["pct"])}%</b>{esc(mkt["name"])}</div>')
    otd = ctx.get("on_this_day")
    strip_html_block = ""
    if strip:
        strip_html_block = f'<div class="strip">{"".join(strip)}</div>'
    otd_block = ""
    if otd:
        otd_block = (f'<div class="otd"><span class="otd-label">ON THIS DAY \u00b7 {otd["year"]}</span> '
                     f'{esc(otd["text"])}</div>')

    # scores widget
    scores_block = ""
    if ctx.get("scores"):
        rows = "".join(
            f'<div class="scorerow"><span class="lg">{esc(s["league"])}</span>'
            f'<span class="match">{esc(s["matchup"])}</span>'
            f'<span class="pts">{esc(s["away_score"])}\u2013{esc(s["home_score"])}</span>'
            f'<span class="st">{esc(s["detail"] or s["state"])}</span></div>'
            for s in ctx["scores"])
        scores_block = f'<div class="scores"><h3>Scoreboard</h3>{rows}</div>'

    # news sections
    section_blocks = []
    for key, display, _n in SECTIONS + [("sports_stories", "Sports Desk", SPORTS_STORY_COUNT)]:
        stories = ctx["sections"].get(key) or []
        if key == "sports_stories" and not stories and not scores_block:
            continue
        cards = []
        for s in stories:
            rel = ""
            if s.get("related"):
                links = " \u00b7 ".join(
                    f'<a href="{esc(r["link"])}" target="_blank" rel="noopener">{esc(r["source"])}</a>'
                    for r in s["related"])
                rel = f'<div class="related">Also covered by: {links}</div>'
            when = ""
            if s.get("published"):
                mins = int((now - s["published"]).total_seconds() // 60)
                when = f"{mins // 60}h ago" if mins >= 60 else f"{mins}m ago"
            cards.append(f"""
      <article class="story">
        <a class="stitle" href="{esc(s["link"])}" target="_blank" rel="noopener">{esc(s["title"])}</a>
        <div class="smeta">{esc(s["source"])}{" \u00b7 " + when if when else ""}</div>
        {f'<p class="ssum">{esc(s["summary"])}</p>' if s["summary"] else ""}
        {rel}
      </article>""")
        inner = "".join(cards)
        if key == "sports_stories":
            inner = scores_block + inner
        if not inner:
            continue
        section_blocks.append(f'<section><h2 class="sec">{esc(display)}</h2>{inner}</section>')

    # geo radar
    radar_block = ""
    if ctx.get("radar"):
        rows = []
        for c in ctx["radar"]:
            accent = "#4ade80" if c["category"] == "cooperation" else "#f87171"
            text = c.get("headline") or c["synopsis"]
            rows.append(
                f'<div class="radar-row" style="border-left-color:{accent}">'
                f'<b>{esc(c["place"])}</b> \u2014 {esc(text)}'
                f'{f" <a href=\"{esc(c['source_urls'][0])}\" target=\"_blank\" rel=\"noopener\">source</a>" if c.get("source_urls") else ""}'
                f'</div>')
        radar_block = (f'<section><h2 class="sec">Geo Radar</h2>'
                       f'<p class="radar-sub">Precise-location world events from GDELT, last {GEO_RADAR_HOURS}h</p>'
                       f'{"".join(rows)}</section>')

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>{esc(PAPER_NAME)} \u2014 {esc(EDITION_NAME)}</title>
<style>
  :root {{ color-scheme: dark; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ background:#0d1117; color:#e6edf3; font:16px/1.55 Georgia,'Times New Roman',serif;
         max-width:640px; margin:0 auto; padding:20px 16px 60px; }}
  header {{ text-align:center; border-bottom:3px double #30363d; padding-bottom:14px; }}
  header h1 {{ font-size:27px; letter-spacing:1px; font-variant:small-caps; }}
  header .sub {{ color:#8b949e; font-size:13px; font-style:italic; margin-top:4px; }}
  .strip {{ display:flex; justify-content:center; gap:20px; flex-wrap:wrap;
            padding:10px 0 4px; font:13px system-ui,sans-serif; color:#8b949e; }}
  .strip b {{ color:#e6edf3; display:block; text-align:center; font-size:16px; }}
  .otd {{ font:13px/1.5 system-ui,sans-serif; color:#8b949e; text-align:center;
          padding:8px 10px 12px; border-bottom:1px solid #30363d; margin-bottom:8px; }}
  .otd-label {{ color:#d29922; letter-spacing:1px; font-size:11px; }}
  .sec {{ font-variant:small-caps; letter-spacing:2px; font-size:15px; color:#d29922;
          border-bottom:1px solid #30363d; padding:18px 0 6px; margin-bottom:10px; }}
  .story {{ margin-bottom:16px; }}
  .stitle {{ font-size:17px; line-height:1.35; color:#e6edf3; text-decoration:none; font-weight:bold; }}
  .stitle:hover {{ color:#58a6ff; }}
  .smeta {{ font:11px system-ui,sans-serif; color:#6e7681; margin:3px 0 4px; }}
  .ssum {{ font:14px/1.5 system-ui,sans-serif; color:#8b949e; }}
  .related {{ font:12px system-ui,sans-serif; color:#6e7681; margin-top:4px; }}
  .related a {{ color:#58a6ff; text-decoration:none; }}
  .scores {{ background:#161b22; border:1px solid #30363d; border-radius:8px;
             padding:12px 14px; margin-bottom:14px; }}
  .scores h3 {{ font:12px system-ui,sans-serif; letter-spacing:2px; color:#8b949e; margin-bottom:8px; }}
  .scorerow {{ display:flex; gap:10px; align-items:baseline; font:13px system-ui,sans-serif;
               padding:4px 0; border-bottom:1px dotted #21262d; }}
  .scorerow:last-child {{ border-bottom:none; }}
  .lg {{ color:#d29922; font-size:10px; letter-spacing:1px; width:34px; flex:none; }}
  .match {{ flex:1; }}
  .pts {{ font-weight:bold; }}
  .st {{ color:#6e7681; font-size:11px; }}
  .radar-row {{ font:13px/1.5 system-ui,sans-serif; color:#8b949e; border-left:3px solid;
                padding:6px 10px; margin-bottom:8px; background:#161b22; border-radius:0 6px 6px 0; }}
  .radar-row b {{ color:#e6edf3; }}
  .radar-row a {{ color:#58a6ff; text-decoration:none; }}
  .radar-sub {{ font:11px system-ui,sans-serif; color:#6e7681; margin-bottom:8px; }}
  footer {{ text-align:center; color:#484f58; font:11px system-ui,sans-serif;
            margin-top:30px; border-top:1px solid #30363d; padding-top:14px; }}
</style>
</head>
<body>
<header>
  <h1>{esc(PAPER_NAME)}</h1>
  <div class="sub">{esc(EDITION_NAME)} \u00b7 {day}</div>
</header>
{strip_html_block}
{otd_block}
{"".join(section_blocks)}
{radar_block}
<footer>Printed {now.strftime("%Y-%m-%d %H:%M UTC")} \u00b7 sources linked above \u00b7 have a good morning</footer>
</body>
</html>"""

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Personal morning paper generator")
    ap.add_argument("--outdir", default="../paper", help="output directory")
    ap.add_argument("--no-radar", action="store_true", help="skip the GDELT geo radar")
    args = ap.parse_args()

    now = datetime.now(timezone.utc)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    session = requests.Session()

    print("Masthead extras...")
    weather = get_weather(session)
    markets = get_markets(session)
    otd = get_on_this_day(session, now)

    print("Scores...")
    scores = get_scores(session, now)

    print("News sections...")
    all_pool = []
    sections = {}
    for key, display, n in SECTIONS:
        pool = gather_section(FEEDS[key], session, now)
        all_pool.extend(pool)
        sections[key] = pick_diverse(pool, n)
        print(f"  {display}: {len(sections[key])} of {len(pool)} items")

    # sports stories: filter general sports feeds down to your teams
    sports_pool = gather_section(FEEDS["sports_stories"], session, now)
    team_stories = [s for s in sports_pool
                    if any(k.lower() in s["title"].lower() for k in TEAM_STORY_KEYWORDS)]
    sections["sports_stories"] = pick_diverse(team_stories, SPORTS_STORY_COUNT)
    all_pool.extend(sports_pool)
    print(f"  Sports Desk: {len(sections['sports_stories'])} team stories")

    for key in sections:
        attach_related(sections[key], all_pool)

    radar = []
    if INCLUDE_GEO_RADAR and not args.no_radar:
        print("Geo radar (GDELT)...")
        radar = get_geo_radar(session, now)
        print(f"  {len(radar)} radar items")

    ctx = {"now": now, "weather": weather, "markets": markets,
           "on_this_day": otd, "scores": scores, "sections": sections,
           "radar": radar}
    page = render_html(ctx)

    # compact summary for the phone notification
    top = []
    for key, display, _n in SECTIONS:
        for s in sections.get(key, [])[:1]:
            top.append({"section": display, "title": s["title"], "source": s["source"]})
    summary = {
        "type": "morning_paper",
        "date": now.strftime("%Y-%m-%d"),
        "weather": weather,
        "story_count": sum(len(v) for v in sections.values()),
        "score_count": len(scores),
        "top": top,
    }

    stamp = now.strftime("%Y-%m-%d")
    (outdir / "latest.html").write_text(page, encoding="utf-8")
    (outdir / f"edition-{stamp}.html").write_text(page, encoding="utf-8")
    (outdir / "latest.json").write_text(json.dumps(summary, indent=2, default=str),
                                        encoding="utf-8")
    print(f"Printed {summary['story_count']} stories, {len(scores)} scores -> {outdir.resolve()}")


if __name__ == "__main__":
    main()
