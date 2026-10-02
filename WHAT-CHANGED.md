# What changed — reel layout fix (`claude/reel-frame`)

All three reels now render inside one fixed 1080x1920 stage that is scaled to fit any screen. The safe zone (top 14%, bottom 35%, left 6%, right 6%) is defined once in `src/reels/reel-frame.css`. Add `?guides=1` to a reel to see it. `npm run check-reels` (run by `npm run build`) fails if any text leaves the safe area. `src/reels/calibrate.html` is the ruler page. Reel content is unchanged.

Phone additions: the reels run full screen from a Home Screen icon (manifest + Apple tags), the stage is centred on the whole iPhone screen with the map running into the strips, `src/reels/index.html` is the start page, the calibration page marks the stage edges and crop strips, and nothing but the reel is drawn during playback (hold a finger down for a second to return to the index). Details are in the "Reel layout" section of CLAUDE.md.

---

# What changed — October 2, 2026 (repo cleanup)

Tidied the repo so the live site can always be rebuilt from `src/`, and brought the docs up to date. Done on the branch `claude/repo-cleanup`, not `main`. Review it, then merge when you're happy.

## Moved
- **`CNAME` now lives in `src/CNAME`.** The build copies it to `docs/CNAME`, same content (`thespatialupdate.com`). Before this, `docs/CNAME` was hand-placed. Wiping `docs/` would have disconnected the domain. The duplicate `CNAME` at the repo root, which GitHub Pages ignored, is **deleted**.
- **Story Beat Reels now live in `src/reels/`.** The build copies the three reel pages to the same addresses as before (`/reels/august-2026-eclipse.html`, `/reels/lobito-corridor.html`, `/reels/revolution-wind.html`).
- **Reel narration scripts are no longer published.** The `*-script.md` files stay in `src/reels/` for you to read locally. They're no longer served at `/reels/<slug>-script.md`.

## Changed
- **`finalize.py` now strips claim tags by default, with no footnotes.** The ledgers are private, so footnote links would have been broken. The `[NEW]` gate is unchanged: it still refuses while any `[NEW]` tag remains. The old footnote behaviour is still there behind `--footnotes`. `--strip` still works but is now the same as the default.
- **`new_story.py` now also creates an empty claim ledger**, `src/stories/<slug>/sources.html`, laid out like the existing ones. It's private: never published.
- **Typo:** the eclipse story is now titled "From the **Arctic** to Spain" (was "Artic"), on the story page, the homepage, `/stories/` and the RSS feed.
- **Reel scripts for the eclipse and Lobito** no longer point at `/stories/<slug>/sources/`, a page that doesn't exist. They now say the ledger is private and where to find it locally.
- **CLAUDE.md** is brought in line with the repo. It now covers private ledgers, removed footnotes, the reels, `src/CNAME`, the three stories that went through the protocol (and Red Sea, which predates it), `_site/` being gone, the real file names (`index.md` / `data.geojson`), and GitHub's built-in Pages publisher.
- Site rebuilt. Only the typo changed in the story pages.

---

# What changed — August 13, 2026 (homepage feature, reels, repo hygiene)

## Changed
- **Lobito Corridor is the homepage feature.** Its `order` in `src/_data/stories.json` is set to `202609` so it sorts above the eclipse story. The number is a sort key, not a date.
- **Prose revised across all four stories**, including a wording fix in the Red Sea piece ("The result was the largest shipping diversion").
- **Reels:** the eclipse reel builder gained an Instagram safe-zone guide (G key or the Safe zones button; hidden in full-screen recording mode). The Lobito reel was brought into the same format.
- **`node_modules/` and `_site/` are no longer tracked in git** (new `.gitignore`). Both are rebuildable. `_site/` was a stale build nothing served.

---

# What changed — August 11, 2026 (Revolution Wind + citation cleanup)

## New
- **New story, published: Revolution Wind** (`src/stories/revolution-wind/`), an Americas story on the offshore wind lease off Rhode Island halted twice by executive order and reinstated twice by the courts. It includes a dossier (`dossiers/revolution-wind.md`), a private claim ledger (`sources.html`), and a reel plus narration script. It went through the full protocol, `finalize.py` included. **The site now carries four stories.**

## Changed
- **Footnotes removed from every story.** The `<sup>` citation markers were stripped from the published prose of Revolution Wind, Lobito and the eclipse. This supersedes the August 10 note below that said the superscripts "remain visible". The audit trail lives only in each story's private `sources.html`.
- **Stories retitled** and homepage popup copy revised. Em-dashes removed from site prose, story bodies, ledgers and the eclipse reel.
- **Homepage map fixes:** clicking an article panel opens the map with that story's popup showing. Hovering the sidebar rail no longer snaps the camera back.

## Removed
- The leftover **iran-strikes reel** (its story was removed August 10).

---

# What changed — August 10, 2026 (fresh start: trimmed stories + private ledgers)

Cleaned house — cut the older stories down to a core three and made the claim ledgers private. Review in VS Code, then commit and push via the Source Control panel as usual.

## Removed
- **Four older stories** — `iran-strikes`, `strait-of-hormuz`, `gulf-state-relations`, and `venezuela` (folders, their sidebar includes, and their `src/_data/stories.json` entries). The site now carries three stories: the August 2026 eclipse, the Lobito Corridor, and the Red Sea Crisis. Removed stories are still recoverable from git history.

## Changed — claim ledgers are now private
- **`sources.html` ledgers are no longer published.** A new `.eleventyignore` skips them, so no `/stories/<slug>/sources/` page is built or served. The files stay in the repo (`src/stories/<slug>/sources.html`) for reference — open them locally.
- **Story footnotes are now plain numbers.** The `[C#]`-derived superscripts remain visible in each story, but no longer link to the (now-private) ledger, so nothing 404s.
- **The public "sourced claim ledger" link is removed** from the story sidebars.

---

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
