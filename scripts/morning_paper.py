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

# ---------------------------------------------------------------------------
# Weather locations — shown side by side in the masthead strip
# ---------------------------------------------------------------------------
WEATHER_LOCATIONS = [
    {"name": "Port Orchard", "lat": 47.540, "lon": -122.633},
    {"name": "Lebanon, OR",  "lat": 44.536, "lon": -122.907},
]
HOME_TZ = "America/Los_Angeles"

FEED_TIMEOUT = 10          # seconds per feed before giving up
MAX_SYNOPSIS_CHARS = 800   # give us the full feed description
MAX_RELATED = 4            # related-story links per story
FRESH_HOURS = 36           # ignore feed items older than this

# ---------------------------------------------------------------------------
# Sections — order here is the order of tabs in the paper
# ---------------------------------------------------------------------------
SECTIONS = [
    # (section key, display name, stories to show)
    ("us",       "U.S. National",          10),
    ("world",    "World",                  12),
    ("pnw",      "Pacific Northwest",      12),
    ("tech",     "Tech & Business",        10),
    ("science",  "Science & Environment",  10),
    ("fun",      "The Lighter Side",        8),
]

# ---------------------------------------------------------------------------
# RSS feeds per section
# ---------------------------------------------------------------------------
FEEDS = {
    "world": [
        # General world
        "http://feeds.bbci.co.uk/news/world/rss.xml",
        "https://www.theguardian.com/world/rss",
        "https://www.aljazeera.com/xml/rss/all.xml",
        "https://feeds.npr.org/1004/rss.xml",
        # Pacific Rim focus
        "https://www.scmp.com/rss/91/feed",
        "https://japannews.net/feed/",
        "https://koreajoongangdaily.joins.com/rss",
        # Maritime & shipping
        "https://www.maritime-executive.com/rss.xml",
        "https://splash247.com/feed/",
        # Military & defense
        "https://www.defensenews.com/arc/outboundfeeds/rss/",
        "https://www.thedrive.com/the-war-zone/rss",
        # History & archaeology
        "https://www.historytoday.com/feed",
        "https://archaeologynewsnetwork.blogspot.com/feeds/posts/default",
    ],
    "us": [
        "https://feeds.npr.org/1003/rss.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
        "https://feeds.washingtonpost.com/rss/national",
        "https://www.military.com/rss-feeds/content",
    ],
    "pnw": [
        "https://www.kitsapsun.com/rss/",
        "https://www.kitsapgov.com/Pages/RSS.aspx",
        "https://www.seattletimes.com/feed/",
        "https://www.kuow.org/feeds/all.rss",
        "https://www.oregonlive.com/arc/outboundfeeds/rss/?outputType=xml",
        "https://www.opb.org/feeds/all/",
        "https://democratherald.com/search/?f=rss&t=article&c=news&l=50&s=start_time&sd=desc",
        "https://albanydemocratherald.com/feed/",
        "https://www.gazettetimes.com/search/?f=rss&t=article&c=news",
        "https://nativenewsonline.net/feed",
    ],
    "science": [
        "https://www.sciencedaily.com/rss/top/science.xml",
        "https://www.theguardian.com/environment/rss",
        "https://www.nasa.gov/feed/",
        "https://www.climate.gov/feeds/news-features.rss",
        "https://earthobservatory.nasa.gov/feeds/earth-observatory.rss",
        "https://oceanservice.noaa.gov/news/rss/latestnews.rss",
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
        "https://www.mentalfloss.com/rss.xml",
    ],
    "sports_stories": [
        # Your teams first
        "https://www.seattletimes.com/sports/feed/",
        "https://www.oregonlive.com/beavers/index.rss",
        # US major sports broad coverage
        "https://www.espn.com/espn/rss/news",
        "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml",
        # Running
        "https://www.runnersworld.com/feeds/all",
        "https://running.competitor.com/feed",
        # International soccer
        "https://www.bbc.co.uk/sport/football/rss.xml",
        "https://www.theguardian.com/football/rss",
    ],
}

# ---------------------------------------------------------------------------
# Content filtering
# ---------------------------------------------------------------------------
DEPRIORITIZE_KEYWORDS = {
    "kardashian", "jenner", "taylor swift", "beyonce", "celebrity", "oscars",
    "grammy", "emmys", "box office", "reality tv", "bachelor", "influencer",
    "tiktok star", "red carpet",
    "weight loss", "diet tips", "skincare", "self-care", "wellness routine",
    "relationship advice", "dating app", "horoscope",
}

# ---------------------------------------------------------------------------
# Sports — teams for scoreboard + story priority
# ---------------------------------------------------------------------------
TEAMS = [
    ("baseball",   "mlb",                     ["Mariners"]),
    ("football",   "nfl",                     ["Seahawks"]),
    ("hockey",     "nhl",                     ["Kraken"]),
    ("soccer",     "usa.1",                   ["Sounders"]),
    ("basketball", "nba",                     ["Trail Blazers", "Blazers"]),
    ("football",   "college-football",        ["Oregon State"]),
    ("basketball", "mens-college-basketball", ["Oregon State"]),
    # Major US sports for broader scoreboard context
    ("baseball",   "mlb",                     ["Yankees", "Dodgers", "Cubs"]),
    ("basketball", "nba",                     ["Lakers", "Celtics", "Warriors"]),
    ("soccer",     "eng.1",                   ["Arsenal", "Chelsea", "Liverpool",
                                               "Manchester City", "Manchester United",
                                               "Tottenham"]),
    ("soccer",     "esp.1",                   ["Real Madrid", "Barcelona"]),
    ("soccer",     "ger.1",                   ["Bayern"]),
]
SPORTS_STORY_COUNT = 12   # stories in the sports panel (after ticker)

# Keywords to PRIORITIZE in sports stories (your teams + running + soccer)
TEAM_STORY_PRIORITY = ["Mariners", "Seahawks", "Kraken", "Sounders",
                        "Trail Blazers", "Blazers", "Oregon State", "Beavers",
                        "Willamette", "marathon", "running", "ultramarathon",
                        "Premier League", "Champions League", "La Liga",
                        "MLS Cup", "FIFA", "UEFA"]

# Keywords that mark a story as general sports (shown after priority stories)
TEAM_STORY_KEYWORDS = TEAM_STORY_PRIORITY + [
    "MLB", "NFL", "NBA", "NHL", "college football", "college basketball",
    "World Cup", "soccer", "football", "basketball", "baseball", "hockey",
    "Olympic", "Tour de France", "Wimbledon", "Grand Slam",
]

# Markets snapshot symbols on stooq.com
MARKET_SYMBOLS = [("^spx", "S&P 500"), ("^dji", "Dow"), ("^ndq", "Nasdaq")]

# GDELT geo radar
INCLUDE_GEO_RADAR = True
GEO_RADAR_HOURS = 6
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
    """Fetch weather for all WEATHER_LOCATIONS. Returns a list of dicts."""
    results = []
    for loc in WEATHER_LOCATIONS:
        data = get_json(
            "https://api.open-meteo.com/v1/forecast", session,
            params={
                "latitude": loc["lat"], "longitude": loc["lon"],
                "current_weather": "true",
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
                "temperature_unit": "fahrenheit",
                "timezone": HOME_TZ, "forecast_days": 1,
            })
        if not data:
            continue
        try:
            cur = data["current_weather"]
            daily = data["daily"]
            code = int(daily["weathercode"][0])
            results.append({
                "name": loc["name"],
                "now_f": round(cur["temperature"]),
                "hi_f": round(daily["temperature_2m_max"][0]),
                "lo_f": round(daily["temperature_2m_min"][0]),
                "precip_pct": int(daily["precipitation_probability_max"][0] or 0),
                "desc": WMO_CODES.get(code, "mixed"),
            })
        except (KeyError, IndexError, TypeError, ValueError):
            continue
    return results


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


def _is_deprioritized(story):
    """Return True if this story matches any soft-filter keyword."""
    text = (story.get("title", "") + " " + story.get("summary", "")).lower()
    return any(kw in text for kw in DEPRIORITIZE_KEYWORDS)


def pick_diverse(stories, n):
    """Take top-N by recency, avoiding near-duplicates.
    Deprioritized stories are pushed to the end but kept available as fill."""
    preferred, deprio = [], []
    for s in stories:
        (deprio if _is_deprioritized(s) else preferred).append(s)

    out = []
    for pool in (preferred, deprio):
        for s in pool:
            if len(out) >= n:
                break
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

    # ---- masthead strip ----
    strip_items = []
    WEATHER_ICONS = {"clear": "☀️", "mostly clear": "🌤️",
                     "partly cloudy": "⛅", "overcast": "☁️",
                     "fog": "🌫️", "drizzle": "🌦️",
                     "light rain": "🌧️", "rain": "🌧️",
                     "heavy rain": "🌧️", "snow": "❄️",
                     "light snow": "❄️", "heavy snow": "❄️",
                     "showers": "🌦️", "thunderstorms": "⛈️"}
    for w in (ctx.get("weather") or []):
        icon = WEATHER_ICONS.get(w["desc"], "🌡️")
        strip_items.append(
            f'<div class="strip-item">'
            f'<span class="strip-loc">{esc(w.get("name",""))}</span>'
            f'<span class="strip-icon">{icon}</span>'
            f'<span class="strip-main">{w["now_f"]}°F</span>'
            f'<span class="strip-sub">{esc(w["desc"])} · H{w["hi_f"]}° L{w["lo_f"]}° · {w["precip_pct"]}% rain</span>'
            f'</div>')
    for mkt in ctx.get("markets", []):
        arrow = "▲" if mkt["pct"] >= 0 else "▼"
        color = "#4ade80" if mkt["pct"] >= 0 else "#f87171"
        strip_items.append(
            f'<div class="strip-item">'
            f'<span class="strip-main" style="color:{color}">{arrow} {abs(mkt["pct"])}%</span>'
            f'<span class="strip-sub">{esc(mkt["name"])}</span>'
            f'</div>')
    strip_block = f'<div class="strip">{"".join(strip_items)}</div>' if strip_items else ""

    otd = ctx.get("on_this_day")
    otd_block = ""
    if otd:
        otd_block = (f'<div class="otd">'
                     f'<span class="otd-label">On This Day · {otd["year"]}</span>'
                     f'{esc(otd["text"])}</div>')

    # ---- scores ticker (for sports panel) ----
    ticker_block = ""
    if ctx.get("scores"):
        # split: your priority teams vs rest
        priority_set = {k.lower() for k in TEAM_STORY_PRIORITY}
        my_games, other_games = [], []
        for s in ctx["scores"]:
            teams_lower = s["matchup"].lower()
            is_mine = any(k.lower() in teams_lower for k in
                         ["mariners","seahawks","kraken","sounders","blazers",
                          "trail blazers","oregon state","beavers","sounders"])
            (my_games if is_mine else other_games).append(s)

        def score_chip(s):
            away_w = s.get("away_score","") and s.get("home_score","") and \
                     int(s.get("away_score",0) or 0) > int(s.get("home_score",0) or 0)
            home_w = s.get("home_score","") and s.get("away_score","") and \
                     int(s.get("home_score",0) or 0) > int(s.get("away_score",0) or 0)
            def bold_if(name, win):
                return f"<b>{esc(name)}</b>" if win else esc(name)
            parts = s["matchup"].split(" @ ")
            if len(parts) == 2:
                away_name, home_name = parts
                matchup_html = (f'{bold_if(away_name, away_w)} '
                                f'<span class="ticker-score">'
                                f'{esc(s.get("away_score",""))}–{esc(s.get("home_score",""))}'
                                f'</span> '
                                f'{bold_if(home_name, home_w)}')
            else:
                matchup_html = esc(s["matchup"])
            detail = esc(s.get("detail") or s.get("state",""))
            league = esc(s.get("league",""))
            return (f'<div class="chip">'
                    f'<span class="chip-lg">{league}</span>'
                    f'<span class="chip-match">{matchup_html}</span>'
                    f'<span class="chip-st">{detail}</span>'
                    f'</div>')

        my_chips    = "".join(score_chip(s) for s in my_games)
        other_chips = "".join(score_chip(s) for s in other_games)

        sections_html = ""
        if my_chips:
            sections_html += f'<div class="ticker-section-label">Your Teams</div>{my_chips}'
        if other_chips:
            sections_html += f'<div class="ticker-section-label">Around the League</div>{other_chips}'

        ticker_block = f'<div class="ticker">{sections_html}</div>'

    # ---- build tab list + panels ----
    all_sections = list(SECTIONS) + [("sports_stories", "Sports Desk", SPORTS_STORY_COUNT),
                                      ("radar", "Geo Radar", GEO_RADAR_COUNT)]
    tab_buttons, panels = [], []

    for idx, (key, display, _n) in enumerate(all_sections):
        if key == "radar":
            radar = ctx.get("radar") or []
            if not radar:
                continue
            cards = []
            for c in radar:
                accent = "#4ade80" if c["category"] == "cooperation" else "#f87171"
                text = c.get("headline") or c["synopsis"]
                src_link = (f'<a href="{esc(c["source_urls"][0])}" target="_blank" rel="noopener">source</a>'
                            if c.get("source_urls") else "")
                cards.append(
                    f'<div class="radar-row" style="border-left-color:{accent}">'
                    f'<b>{esc(c["place"])}</b> — {esc(text)} {src_link}</div>')
            inner = (f'<p class="radar-sub">Precise-location events from GDELT · last {GEO_RADAR_HOURS}h</p>'
                     + "".join(cards))
        else:
            stories = ctx["sections"].get(key) or []
            if key == "sports_stories" and not stories and not ticker_block:
                continue
            story_cards = []
            for s in stories:
                rel = ""
                if s.get("related"):
                    links = " · ".join(
                        f'<a href="{esc(r["link"])}" target="_blank" rel="noopener">{esc(r["source"])}</a>'
                        for r in s["related"])
                    rel = f'<div class="related">Also covered by: {links}</div>'
                when = ""
                if s.get("published"):
                    mins = int((now - s["published"]).total_seconds() // 60)
                    when = f"{mins // 60}h ago" if mins >= 60 else f"{mins}m ago"
                story_cards.append(
                    f'<article class="story">'
                    f'<a class="stitle" href="{esc(s["link"])}" target="_blank" rel="noopener">'
                    f'{esc(s["title"])}</a>'
                    f'<div class="smeta">{esc(s["source"])}'
                    f'{"  · " + when if when else ""}</div>'
                    f'{f'<p class="ssum">{esc(s["summary"])}</p>' if s.get("summary") else ""}'
                    f'{rel}</article>')
            inner = (ticker_block if key == "sports_stories" else "") + "".join(story_cards)
            if not inner:
                continue

        active = " active" if idx == 0 else ""
        tab_id = f"tab-{key}"
        tab_buttons.append(
            f'<button class="tab-btn{active}" data-panel="{tab_id}" '
            f'onclick="switchTab(this)">{esc(display)}</button>')
        panels.append(
            f'<div class="panel{active}" id="{tab_id}">'
            f'<div class="columns">{inner}</div></div>')

    tabs_block = (f'<div class="tab-bar">{"".join(tab_buttons)}</div>' + "".join(panels))

    css = """
  :root { color-scheme: dark; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background:#0d1117; color:#e6edf3; font:16px/1.6 Georgia,'Times New Roman',serif; padding-bottom:60px; }
  header { text-align:center; padding:18px 16px 12px; border-bottom:3px double #30363d; }
  header h1 { font-size:30px; letter-spacing:2px; font-variant:small-caps; }
  header .edition { color:#8b949e; font-size:12px; font-style:italic; margin-top:3px; letter-spacing:1px; }
  .strip { display:flex; justify-content:center; border-bottom:1px solid #30363d; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .strip-item { display:flex; flex-direction:column; align-items:center; padding:8px 16px; border-right:1px solid #21262d; flex:none; }
  .strip-item:last-child { border-right:none; }
  .strip-loc { font:10px system-ui,sans-serif; color:#d29922; letter-spacing:1px;
               text-transform:uppercase; margin-bottom:1px; }
  .strip-icon { font-size:18px; line-height:1; }
  .strip-main { font:bold 17px system-ui,sans-serif; color:#e6edf3; }
  .strip-sub { font:11px system-ui,sans-serif; color:#6e7681; white-space:nowrap; }
  .otd { font:13px/1.5 system-ui,sans-serif; color:#8b949e; text-align:center; padding:8px 20px; border-bottom:1px solid #30363d; }
  .otd-label { color:#d29922; font-size:10px; letter-spacing:2px; text-transform:uppercase; display:block; margin-bottom:2px; }
  .tab-bar { display:flex; overflow-x:auto; -webkit-overflow-scrolling:touch; border-bottom:2px solid #30363d; background:#0d1117; position:sticky; top:0; z-index:10; scrollbar-width:none; }
  .tab-bar::-webkit-scrollbar { display:none; }
  .tab-btn { flex:none; background:none; border:none; border-bottom:3px solid transparent; color:#8b949e; font:13px system-ui,sans-serif; padding:10px 16px 8px; cursor:pointer; white-space:nowrap; transition:color .15s,border-color .15s; margin-bottom:-2px; }
  .tab-btn:hover { color:#e6edf3; }
  .tab-btn.active { color:#d29922; border-bottom-color:#d29922; font-weight:600; }
  .panel { display:none; padding:16px 16px 0; }
  .panel.active { display:block; }
  @media (min-width:700px) {
    body { max-width:1100px; margin:0 auto; }
    .columns { column-count:2; column-gap:28px; column-rule:1px solid #21262d; }
    .story { break-inside:avoid; }
    .scores { break-inside:avoid; }
    .radar-row { break-inside:avoid; }
  }
  .story { padding-bottom:14px; margin-bottom:14px; border-bottom:1px solid #21262d; }
  .story:last-child { border-bottom:none; }
  .stitle { font-size:18px; line-height:1.3; color:#e6edf3; text-decoration:none; font-weight:bold; display:block; margin-bottom:3px; }
  .stitle:hover { color:#58a6ff; }
  .smeta { font:11px system-ui,sans-serif; color:#6e7681; margin-bottom:6px; }
  .ssum { font:14px/1.6 system-ui,sans-serif; color:#8b949e; margin-bottom:6px; }
  .related { font:12px system-ui,sans-serif; color:#6e7681; }
  .related a { color:#58a6ff; text-decoration:none; }
  .scores { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:12px 14px; margin-bottom:18px; }
  .scores-label { font:11px system-ui,sans-serif; letter-spacing:2px; text-transform:uppercase; color:#8b949e; margin-bottom:8px; }
  .scorerow { display:flex; gap:10px; align-items:baseline; font:13px system-ui,sans-serif; padding:5px 0; border-bottom:1px dotted #21262d; }
  .scorerow:last-child { border-bottom:none; }
  .lg { color:#d29922; font-size:10px; letter-spacing:1px; width:38px; flex:none; }
  .match { flex:1; }
  .pts { font-weight:bold; }
  .st { color:#6e7681; font-size:11px; }
  .radar-sub { font:11px system-ui,sans-serif; color:#6e7681; margin-bottom:10px; letter-spacing:1px; text-transform:uppercase; }
  .radar-row { font:13px/1.5 system-ui,sans-serif; color:#8b949e; border-left:3px solid; padding:6px 10px; margin-bottom:10px; background:#161b22; border-radius:0 6px 6px 0; }
  .radar-row b { color:#e6edf3; }
  .radar-row a { color:#58a6ff; text-decoration:none; }
  .ticker { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:10px 14px 6px; margin-bottom:18px; }
  .ticker-section-label { font:10px system-ui,sans-serif; letter-spacing:2px; text-transform:uppercase; color:#d29922; margin:8px 0 6px; }
  .ticker-section-label:first-child { margin-top:0; }
  .chip { display:flex; align-items:baseline; gap:8px; font:13px system-ui,sans-serif; padding:5px 0; border-bottom:1px dotted #21262d; flex-wrap:wrap; }
  .chip:last-child { border-bottom:none; }
  .chip-lg { color:#d29922; font-size:10px; letter-spacing:1px; text-transform:uppercase; width:38px; flex:none; }
  .chip-match { flex:1; min-width:0; }
  .chip-match b { color:#e6edf3; }
  .ticker-score { color:#6e7681; font-size:12px; }
  .chip-st { color:#6e7681; font-size:11px; flex:none; }
  footer { text-align:center; color:#484f58; font:11px system-ui,sans-serif; margin-top:30px; border-top:1px solid #30363d; padding:14px 16px 0; }"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>{esc(PAPER_NAME)} — {esc(EDITION_NAME)}</title>
<style>{css}</style>
</head>
<body>
<header>
  <h1>{esc(PAPER_NAME)}</h1>
  <div class="edition">{esc(EDITION_NAME)} · {day}</div>
</header>
{strip_block}
{otd_block}
{tabs_block}
<footer>Printed {now.strftime("%Y-%m-%d %H:%M UTC")} · sources linked above · have a good morning</footer>
<script>
function switchTab(btn) {{
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.panel).classList.add('active');
  btn.scrollIntoView({{block:'nearest',inline:'center',behavior:'smooth'}});
}}
</script>
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

    # sports stories: priority (your teams + running + soccer) first,
    # then fill with general major sports up to SPORTS_STORY_COUNT
    sports_pool = gather_section(FEEDS["sports_stories"], session, now)
    priority = [s for s in sports_pool
                if any(k.lower() in s["title"].lower() for k in TEAM_STORY_PRIORITY)]
    general  = [s for s in sports_pool
                if s not in priority and
                   any(k.lower() in s["title"].lower() for k in TEAM_STORY_KEYWORDS)]
    combined = priority + general
    sections["sports_stories"] = pick_diverse(combined, SPORTS_STORY_COUNT)
    all_pool.extend(sports_pool)
    print(f"  Sports Desk: {len(sections['sports_stories'])} stories "
          f"({len(priority)} priority / {len(general)} general)")

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
    w0 = weather[0] if weather else None
    summary = {
        "type": "morning_paper",
        "date": now.strftime("%Y-%m-%d"),
        "weather": w0,        # notification gets first location (Port Orchard)
        "weather_all": weather,
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