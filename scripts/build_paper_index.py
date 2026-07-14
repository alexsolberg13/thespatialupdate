#!/usr/bin/env python3
"""
Build the Morning Edition archive page.

Scans docs/paper/ for dated editions (edition-YYYY-MM-DD.html), and writes
docs/paper/index.html — a simple, newspaper-styled archive page that links
to the latest edition and every past one, newest first.

This is plain standard-library Python (no third-party packages needed) so
it can run as a quick step in the GitHub Actions workflow right after the
paper and leads are published.

Usage (run from the repo root):
    python scripts/build_paper_index.py

Safe to run any time, including when docs/paper/ has no dated editions yet
(it will still produce a friendly "check back tomorrow" page).
"""

import html
import re
from datetime import datetime
from pathlib import Path

PAPER_DIR = Path("docs/paper")
INDEX_FILE = PAPER_DIR / "index.html"
EDITION_RE = re.compile(r"^edition-(\d{4}-\d{2}-\d{2})\.html$")


def esc(s):
    return html.escape(str(s or ""), quote=True)


def find_editions(paper_dir):
    """Return a list of (date, filename) sorted newest first."""
    editions = []
    if not paper_dir.is_dir():
        return editions
    for f in paper_dir.iterdir():
        m = EDITION_RE.match(f.name)
        if not m:
            continue
        try:
            d = datetime.strptime(m.group(1), "%Y-%m-%d")
        except ValueError:
            continue
        editions.append((d, f.name))
    editions.sort(key=lambda t: t[0], reverse=True)
    return editions


def render_index(editions):
    rows = []
    for d, fname in editions:
        label = d.strftime("%A, %B %d, %Y")
        rows.append(
            f'<li class="edition-row"><a href="{esc(fname)}">{esc(label)}</a></li>'
        )

    if rows:
        list_html = f'<ul class="edition-list">{"".join(rows)}</ul>'
    else:
        list_html = (
            '<p class="empty-note">No dated editions yet — the morning paper '
            "runs daily, and editions will start showing up here as soon as "
            "they print.</p>"
        )

    generated = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Spatial Update — Morning Editions</title>
<script>
  if (localStorage.getItem('theme') !== 'light')
    document.documentElement.setAttribute('data-theme', 'dark');
</script>
<style>
  :root {{
    --bg: #f5f4f0;
    --surface: #ffffff;
    --border: #e0ddd8;
    --text-primary: #1a1816;
    --text-secondary: #6e6a64;
    --accent: #8a6b20;
  }}
  [data-theme="dark"] {{
    --bg: #0d1117;
    --surface: #161b22;
    --border: #30363d;
    --text-primary: #e6edf3;
    --text-secondary: #8b949e;
    --accent: #d29922;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: var(--bg); color: var(--text-primary);
    font: 16px/1.6 Georgia, 'Times New Roman', serif;
    padding-bottom: 60px;
  }}
  header {{
    text-align: center; padding: 24px 16px 16px;
    border-bottom: 3px double var(--border);
  }}
  header h1 {{ font-size: 30px; letter-spacing: 2px; font-variant: small-caps; }}
  header .tagline {{
    color: var(--text-secondary); font-size: 12px; font-style: italic;
    margin-top: 4px; letter-spacing: 1px;
  }}
  main {{ max-width: 640px; margin: 0 auto; padding: 24px 16px; }}
  .latest-link {{
    display: block; text-align: center; background: var(--surface);
    border: 1px solid var(--border); border-radius: 8px;
    padding: 16px; margin-bottom: 28px; text-decoration: none;
    color: var(--accent); font-size: 18px; font-weight: bold;
    letter-spacing: 0.5px;
  }}
  .latest-link:hover {{ opacity: 0.85; }}
  .latest-link .sub {{
    display: block; color: var(--text-secondary); font-size: 12px;
    font-style: italic; font-weight: normal; margin-top: 4px;
    letter-spacing: normal;
  }}
  h2.archive-title {{
    font-size: 13px; letter-spacing: 2px; text-transform: uppercase;
    color: var(--text-secondary); margin-bottom: 10px;
    border-bottom: 1px solid var(--border); padding-bottom: 6px;
  }}
  .edition-list {{ list-style: none; }}
  .edition-row {{
    padding: 10px 0; border-bottom: 1px solid var(--border);
  }}
  .edition-row:last-child {{ border-bottom: none; }}
  .edition-row a {{
    color: var(--text-primary); text-decoration: none; font-size: 16px;
  }}
  .edition-row a:hover {{ color: var(--accent); }}
  .empty-note {{
    color: var(--text-secondary); font-style: italic; font-size: 14px;
    padding: 12px 0;
  }}
  footer {{
    text-align: center; color: var(--text-secondary); font: 11px system-ui, sans-serif;
    margin-top: 30px; border-top: 1px solid var(--border); padding: 14px 16px 0;
  }}
</style>
</head>
<body>
<header>
  <h1>The Spatial Update</h1>
  <div class="tagline">Morning Edition Archive</div>
</header>
<main>
  <a class="latest-link" href="latest.html">Read Today's Edition
    <span class="sub">Always the freshest morning paper</span>
  </a>
  <h2 class="archive-title">Past Editions</h2>
  {list_html}
</main>
<footer>Index built {esc(generated)}</footer>
</body>
</html>"""


def main():
    editions = find_editions(PAPER_DIR)
    PAPER_DIR.mkdir(parents=True, exist_ok=True)
    page = render_index(editions)
    INDEX_FILE.write_text(page, encoding="utf-8")
    print(f"Wrote {INDEX_FILE} with {len(editions)} edition(s) listed.")


if __name__ == "__main__":
    main()
