#!/usr/bin/env python3
"""
Sends a compact push notification (via ntfy.sh) summarizing today's leads.
Meant to run right after gdelt_leads.py, reading its latest.json output.

Usage:
    python mobile_notify.py --file ../leads/latest.json --topic YOUR-SECRET-TOPIC

--repo is optional (owner/reponame) and adds a "tap to open full report" link
pointing at leads/latest.md in that GitHub repo. In GitHub Actions this is
picked up automatically from the GITHUB_REPOSITORY environment variable.

Requires: requests  (pip install requests)
"""

import argparse
import json
import os
import sys
from pathlib import Path

import requests

MAX_LEADS_IN_PUSH = 10
MAX_LINE_CHARS = 180


def build_notification(candidates, repo=None):
    """Pure formatting logic, no network — kept separate so it's testable
    without actually sending anything.

    Accepts either the old gdelt_leads list format, or the morning_paper
    summary dict ({"type": "morning_paper", ...})."""
    if isinstance(candidates, dict) and candidates.get("type") == "morning_paper":
        return _build_paper_notification(candidates)
    n = len(candidates)
    n_coop = sum(1 for c in candidates if c.get("category") == "cooperation")
    n_conf = n - n_coop

    if n == 0:
        title = "Spatial Update — no leads today"
        body = "No candidates cleared the threshold in this run."
    else:
        title = f"Spatial Update — {n} leads ({n_conf} conflict / {n_coop} cooperation)"
        lines = []
        for c in candidates[:MAX_LEADS_IN_PUSH]:
            tag = "\U0001F91D" if c.get("category") == "cooperation" else "\u26A1"
            text = c.get("headline") or c.get("synopsis") or c.get("label", "")
            line = f"{tag} {c.get('place', '?')}: {text}"
            if len(line) > MAX_LINE_CHARS:
                line = line[: MAX_LINE_CHARS - 1] + "\u2026"
            lines.append(line)
        if n > MAX_LEADS_IN_PUSH:
            lines.append(f"...and {n - MAX_LEADS_IN_PUSH} more in the full report.")
        body = "\n".join(lines)

    click = f"https://github.com/{repo}/blob/main/leads/latest.md" if repo else None
    return title, body, click


def _build_paper_notification(summary):
    w = summary.get("weather")
    weather_bit = f" \u00b7 {w['now_f']}\u00b0F {w['desc']}" if w else ""
    title = f"\u2615 Morning Edition \u2014 {summary.get('story_count', 0)} stories{weather_bit}"
    lines = []
    for item in summary.get("top", [])[:MAX_LEADS_IN_PUSH]:
        line = f"[{item.get('section','')}] {item.get('title','')}"
        if len(line) > MAX_LINE_CHARS:
            line = line[: MAX_LINE_CHARS - 1] + "\u2026"
        lines.append(line)
    if summary.get("score_count"):
        lines.append(f"\U0001F3C6 {summary['score_count']} game(s) on the scoreboard")
    body = "\n".join(lines) if lines else "Your paper is ready."
    return title, body, None


def send_ntfy(topic, title, body, click=None, server="https://ntfy.sh"):
    payload = {"topic": topic, "title": title, "message": body}
    if click:
        payload["click"] = click
    r = requests.post(server, json=payload, timeout=15)
    r.raise_for_status()
    return r


def main():
    ap = argparse.ArgumentParser(description="Push today's leads to a phone via ntfy.sh")
    ap.add_argument("--file", default="../leads/latest.json", help="path to latest.json")
    ap.add_argument("--topic", required=True, help="your secret ntfy topic name")
    ap.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY"),
                     help="owner/repo for a 'tap to open' link (auto-set in GitHub Actions)")
    ap.add_argument("--click-url", default=None,
                     help="override the tap-to-open link entirely (e.g. your site's "
                          "/leads/latest.html page). Takes precedence over --repo.")
    ap.add_argument("--server", default="https://ntfy.sh", help="ntfy server (self-host override)")
    args = ap.parse_args()

    path = Path(args.file)
    if not path.exists():
        print(f"! {path} not found — run gdelt_leads.py first.", file=sys.stderr)
        sys.exit(1)

    candidates = json.loads(path.read_text(encoding="utf-8"))
    title, body, click = build_notification(candidates, repo=args.repo)
    if args.click_url:
        click = args.click_url

    print(f"Sending push: {title}")
    send_ntfy(args.topic, title, body, click=click, server=args.server)
    print("Sent.")


if __name__ == "__main__":
    main()
