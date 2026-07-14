# What changed — July 14, 2026

Claude made these improvements. Review in VS Code, then commit and push via the Source Control panel as usual.

## Fixed
- **Daily workflow now runs the GDELT leads script.** It never did before — that's why /leads/ was stuck at July 11. A leads failure won't block the morning paper.
- **Failure alerts.** If any step of the daily workflow breaks, you now get an ntfy push on your phone same-day.

## New on the site (after you push)
- **Geo Radar map layer** — a toggle at the bottom of the homepage sidebar shows the last 24h of GDELT event signals as dots on the map (red = conflict, teal = cooperation). Off by default; hides itself if the data file isn't there yet.
- **Paper archive** at /paper/ — dated editions now get published and listed automatically each day.
- **/about/ page** and header nav links (Stories · Paper · About). Edit `src/about.njk` to change the wording.
- **/stories/ index page** listing all stories by region.
- **SEO plumbing**: sitemap.xml, robots.txt, feed.xml (RSS), social-preview (OpenGraph) tags on every page. Links you share will now show proper titles/descriptions.

## Files touched
- `.github/workflows/daily-leads.yml` — leads step, dated-edition publish, archive rebuild, failure alert
- `scripts/build_paper_index.py` — new; builds /paper/ archive page
- `src/_includes/base.njk` — OG/SEO tags + nav
- `src/index.njk` — Geo Radar layer
- `src/about.njk`, `src/stories.njk`, `src/sitemap.njk`, `src/robots.njk`, `src/feed.njk` — new pages
- `src/_data/site.json` — added site url
- `docs/` — rebuilt output

## After pushing, do this once
Go to GitHub → Actions → "Morning paper" → Run workflow. That first run publishes the leads data the Geo Radar toggle needs.
