# What changed — August 10, 2026 (August 2026 eclipse story + two reels)

Added a new story and video reels, and tidied the Lobito map. Review in VS Code, then commit and push via the Source Control panel as usual.

## New
- **New story, published: the August 2026 eclipse** (`src/stories/august-2026-eclipse/`) — a Europe story on the 12 Aug 2026 total solar eclipse, framed spatially: a ~294 km-wide shadow crossing Greenland, Iceland and northern Spain, and who falls inside the line versus just outside it (Madrid & Barcelona miss totality at 99.9%). The map's centerline **and** totality band are real NASA / Espenak ephemeris, and every city's in/out colour was checked by point-in-polygon against the band. Includes a footnoted claim ledger (`sources.html`) and a research packet (`dossiers/august-2026-eclipse.md`). Live on the homepage (Europe) and in `/stories/`. **This is the first Europe story on the site.**
- **Story Beat Reels** (`docs/reels/`) — standalone 9:16, screen-recordable map reels (token-free MapLibre on a globe projection) plus narration scripts, for both `august-2026-eclipse` and `lobito-corridor`.

## Changed
- **Lobito map — the TAZARA route cleaned up.** Smoothed the eastern line through its real stations, anchored its western end at a new **Kapiri Mposhi junction** pin, and added the **Zambia Railways feeder** (Chingola → Ndola → junction). TAZARA does not itself reach the mines — the feeder is how Copperbelt ore gets to it — so the map now shows the ore connecting to the eastern route rather than the line dangling in space.

---

# What changed — August 9, 2026 (later: first story + finalize tool)

Started the first by-hand story and built the Stage 4 tool. Review in VS Code, then commit and push via the Source Control panel as usual.

## New
- **New story, published: the Lobito Corridor** (`src/stories/lobito-corridor/`) — an Africa story on whether the Copperbelt's copper/cobalt exits west to the Atlantic (US/EU-backed Lobito rail) or east to the Indian Ocean (China-backed TAZARA). Includes the map (`data.geojson`), a footnoted claim ledger (`sources.html`), and a research packet (`dossiers/lobito-corridor.md`). It went through humanize → `finalize.py` (tags are now footnotes) → publish, so it's live on the homepage (Africa) and in `/stories/`. **This is the first Africa story on the site.**
- **`scripts/finalize.py`** — the Stage 4 finisher. `py scripts\finalize.py lobito-corridor` converts the `[C#]` tags to footnotes linking the ledger, and refuses if any `[NEW]` tag remains. Use `--check` for a dry run first.

## Note on the old Stage-4 spec
CLAUDE.md used to say finalize "writes into docs/". It doesn't — `docs/` is the generated build. finalize edits the source `index.md`; `npm run build` then produces the published page. CLAUDE.md is updated to match.

---

# What changed — August 9, 2026

Claude removed the automated story-finding stack — Harvey is finding stories a different way now. Review in VS Code, then commit and push via the Source Control panel as usual.

## Removed
- **Morning paper** — `scripts/morning_paper.py`, `scripts/build_paper_index.py`, the `paper/` and `docs/paper/` folders, the "Paper" nav links, the "Morning Edition" line on /about/, and the `/paper/` sitemap entry.
- **GDELT morning leads** — `scripts/gdelt_leads.py`, the `leads/` and `docs/leads/` folders, the `Disallow: /leads/` robots line.
- **Geo Radar map layer** — the homepage toggle and all its code in `src/index.njk` (it fed on the deleted leads data).
- **Pitch sheet** — `scripts/pitch_sheet.py` and the `pitches/` folder (Stage 1 of the old protocol; it read the GDELT leads).
- **Daily GitHub Action** — `.github/workflows/daily-leads.yml` and the phone notifier `scripts/mobile_notify.py`. There is no scheduled automation anymore.
- Site rebuilt, so `docs/` no longer references any of the above. The by-hand story-writing protocol (CLAUDE.md §5) is unchanged.

---

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
