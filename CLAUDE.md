# The Spatial Update — project context

Handoff document for Claude Code / Cowork. Read this first.

If you are Claude Code, this file lives at the repo root and loads automatically.
If you are in Cowork, treat this as the project brief.

**Where the repo actually is.** The git repo is the `Website/` folder inside
`OneDrive/Documents/The Spatial Update/`, not that folder itself. Everything in
section 3 is relative to `Website/`. Open VS Code on `Website/`, not the parent.
The parent also holds `Misc Files/`, `Organizing the main page layout/`, and
some `.zip` archives — scratch and design history, deliberately outside version
control. Don't put working files there; they won't be committed and won't deploy.

---

## 1. What this is

**The Spatial Update** (thespatialupdate.com) is a one-person geospatial news
site: reported stories where the geography *is* the story, each carrying an
interactive map. Run by Harvey, based in Port Orchard / Bremerton, Washington.

Editorial line, and it matters for everything below: **automation finds and
prepares, a human writes and publishes.** No generated prose ships without
being rewritten in Harvey's voice, and no factual claim ships without a
traceable source. Tooling exists to make that discipline cheap, not to skip it.

---

## 2. Working with Harvey

- **Not a developer.** Give exact commands, exact file paths, exact menu clicks.
  Don't assume CLI conventions are known — say "open the terminal with
  Ctrl+backtick" rather than "in your shell".
- **Windows + VS Code**, using the built-in PowerShell terminal.
- **`pip` fails on this machine.** The working command is `py -m pip install X`.
- **`py`, not `python3` or `python`.**
- Git happens through the VS Code **Source Control** panel (Ctrl+Shift+G →
  stage with **+** → message → Commit → Sync Changes), not the command line.
- Prefer one working thing over three theoretical ones. Test before handing over.

---

## 3. Stack and layout

- **Site**: Eleventy (11ty) static site, Mapbox for interactive maps.
- **Hosting**: GitHub Pages, served from the `/docs` folder.
- **Automation**: GitHub Actions + Python 3 scripts, standard library where
  possible (`requests` is the one common dependency).

```
CLAUDE.md         this file
STORY-GUIDE.md    how to write a story folder by hand
WHAT-CHANGED.md   running changelog
.eleventy.js      Eleventy config
CNAME             thespatialupdate.com

scripts/          Python automation
  gdelt_leads.py
  morning_paper.py
  mobile_notify.py
  build_paper_index.py    rebuilds paper/index.html archive page
  new_story.py            scaffolds a new src/stories/<slug>/ folder
  pitch_sheet.py

leads/            GDELT scraper output (candidates.json, .geojson, digest)
paper/            morning newspaper output
pitches/          pitch sheet output
dossiers/         research packets    [planned, not built]
src/              Eleventy source (stories live in src/stories/<slug>/)
docs/             built site, served by GitHub Pages
_site/            stale Eleventy default output — NOT served, safe to ignore
.github/workflows/daily-leads.yml
```

Both `leads/` and `paper/` outputs are written twice: a dated file
(`2026-08-07.html`) and a stable `latest.*` alias. Keep that convention.

**Watch out for `_site/`.** Eleventy's default output directory. This project
publishes from `docs/` instead, so `_site/` holds an outdated build that nothing
serves. If a change appears live but not locally, or the reverse, check you're
looking at `docs/`.

**Story coordinate convention.** Stories store coordinates **lon-first**, both in
the Eleventy front matter (`coordinates: [-68.0, 8.0]`) and inside
`data.geojson` (`"coordinates": [lon, lat]`, per the GeoJSON spec). GDELT and the
pitch sheet work in **lat-first** `(lat, lon)`. Anything crossing that boundary
has to swap, and it's the likeliest source of a marker landing in the wrong
ocean. Note the story map file is `data.geojson`, not `story.geojson` as
section 5 Stage 3 describes — reconcile that when Stage 3 gets automated.

---

## 4. Existing scripts

### `gdelt_leads.py`
Fetches GDELT 2.0 15-minute event exports over a lookback window, filters to
city/landmark-precision geocoding, clusters records describing the same
real-world event, scores by attention × recency, and writes `candidates.json`,
`candidates.geojson`, and a styled HTML digest.

Has a `TOPIC_PRESET` config system (`conflict`, `cooperation`, `broad`,
`infrastructure`) and `BALANCE_CATEGORIES` to alternate conflict/cooperation so
the sheet isn't all violence. Goldstein score was deliberately removed from
ranking — it structurally favours violent events.

**Cluster fields** (confirmed in use): `label`, `place`, `lat`, `lon`, `score`,
`total_mentions`, `records`, `source_urls`. Possibly also `geo_type`, `headline`,
`synopsis`, actor fields. Downstream code should read defensively — see the
`g()` helper in `pitch_sheet.py`.

### `morning_paper.py`
Harvey's personal daily paper, unrelated to the public site. 30+ RSS feeds
across World, U.S. National, Pacific Northwest, Science and Environment, Tech
and Business, The Lighter Side, Sports Desk, Geo Radar. Adds Open-Meteo weather
for Port Orchard WA and Lebanon OR, Stooq market data, Wikipedia On This Day,
and ESPN scores for the Mariners, Seahawks, Kraken, Sounders, Trail Blazers, and
Oregon State.

### `mobile_notify.py`
Push notifications via ntfy.sh (free, no account). Handles both the leads format
and the morning paper format. The GitHub Actions secret is named **`NTFY_TOPIC`**.

### `build_paper_index.py`
Regenerates `paper/index.html`, the browsable archive of past editions, from the
dated `edition-YYYY-MM-DD.html` files on disk. Run by the Action after the paper
is published.

### `new_story.py`
Scaffolds a new `src/stories/<slug>/` folder — front matter, starter
`data.geojson`, sidebar include. Run this rather than hand-copying an existing
story folder. See `STORY-GUIDE.md` for the manual process it automates.

### `pitch_sheet.py`  *(newest — Stage 1 of the protocol below)*
See section 5.

### Workflow
`.github/workflows/daily-leads.yml`, display name "Morning paper". Runs at
13:00 UTC daily, has `workflow_dispatch` for manual runs, commits outputs to
`paper/` and `docs/paper/`, and sends a tap-to-open notification pointing at
`thespatialupdate.com/paper/latest.html`.

The leads step runs with `continue-on-error: true` and its outputs are copied
only if they exist — a bad GDELT run must never stop the paper publishing. Keep
that shape for any step added later.

**`pitch_sheet.py` is not in the workflow yet.** It runs by hand only. Wiring it
in means adding a step after the leads step, copying `pitches/latest.html` into
`docs/pitches/`, and adding `pitches/ docs/pitches/` to the `git add` line — but
hold off until a week of hand-run sheets shows the ranking is worth reading daily.

**Known open issue:** the RSS feed URLs and ESPN endpoints in `morning_paper.py`
were never testable from the sandbox they were written in. Some may 404 on live
runs and need individual fixing. Everything fails silently by design, so a dead
feed shows up as a missing section, not a crash.

---

## 5. The story production protocol

Four stages. The spine of the whole thing is the **claim ledger** — every
sentence that ships is tied to an ID, and every ID is typed as Reported,
Background, or Inference.

### Stage 1 — Pitch sheet (built, `scripts/pitch_sheet.py`)

```
py scripts/pitch_sheet.py
py scripts/pitch_sheet.py --in leads/latest.json --min-sources 2 --max 12
```

Standard library only. Reads `candidates.json`, enriches each cluster with:

- **Source diversity** — distinct outlets, discounting aggregators
  (`WEAK_DOMAINS`: Google News, MSN, Yahoo, etc.). Single-outlet clusters get a
  warning tag.
- **Mappability** — GDELT country-level coordinates are centroids, not places,
  and can't carry a map. Dropped by default (`--keep-unmappable` to override).
  State/province precision gets a `weak geocode` tag.
- **Novelty** — scans `src/stories/` and `docs/stories/` for coordinates within
  60km of the pitch and flags follow-ons by story slug. Scored down slightly,
  never dropped; sometimes the follow-on is the better story. Reads both
  conventions: lon-first `[lon, lat]` from `data.geojson` and story front
  matter, and lat-first `"lat": / "lon":` keys. **Sanity check when running it:**
  the `Indexed N coordinates from published stories` line must be non-zero. A
  zero there means the scan matched nothing and every pitch is being scored as
  new — that failure is silent and looks exactly like a normal run.
- **Spatial angle** — one line on why this needs a map rather than merely
  having a location. Place-name features first (strait, corridor, dam, camp,
  border), then event shape (displacement, seizure, blockade), then an honest
  "angle needs finding" rather than an invented one.

Re-ranks on those signals and writes `pitches/YYYY-MM-DD.html` + `latest.html`
(the sheet Harvey ticks on his phone) and matching `.json` for Stage 2.
The **Copy selections** button emits:

```
PITCH SET 2026-08-07
SELECTED: 3, 7, 11
```

### Stage 2 — Dossier build (**not built yet**)

`build_dossier.py <date> <selected numbers>` → `dossiers/<slug>.json`.

Should gather, for the selected pitches only:
- every GDELT record in the cluster (event codes, actors, dates, tone, exact
  lat-lon, geo precision flag)
- every source URL with publisher, publication date, and fetched article text
- an OSM/Nominatim reverse geocode of each coordinate, so place names are
  verified rather than assumed
- adjacent structured data where relevant — admin boundaries, elevation,
  population

**Rule: nothing in the finished story may exist outside the dossier.** That
constraint is what makes Stage 3 auditable.

### Stage 3 — Production (**stays a chat session for now, by Harvey's choice**)

Harvey hands the dossier to Claude in a chat. Not automated — he wants to see
every judgment call and push back mid-draft. Do not move this into the Action
without him asking. Output is a story folder:

- **`story.md`** — Eleventy front matter + body, every sentence carrying an
  inline claim tag: `Fighting displaced roughly 4,000 residents. [C7]`
- **`story.geojson`** — map layers, each feature tagged with the claim ID that
  justifies its placement, so a misplaced marker traces to a bad source rather
  than a mystery.
- **`sources.html`** — the audit file. One row per claim:

  | ID | Claim as written | Type | Source | Date | Support |
  |----|------------------|------|--------|------|---------|

  Three types, and the honesty of this typing is the point of the whole system:
  - **Reported** — traces to a source URL.
  - **Background** — general knowledge, nothing behind it.
  - **Inference** — connecting dots the sources did not connect.

  Also flag: single-source claims, claims where sources disagree, and
  coordinates derived from a centroid.

  A story that comes out 40% Inference either gets more reporting or gets
  killed. Never smooth an Inference into prose that reads as Reported.

### Stage 4 — Humanize and publish (**not built yet**)

Harvey rewrites `story.md` in his own voice with the claim tags in place. Cut a
sentence and its ledger row greys out; write a new sentence and tag it `[NEW]`
so it lands on a needs-sourcing list.

`finalize.py <slug>` then strips inline tags, converts them to numbered
footnotes on the published page, **refuses to build while any `[NEW]` tag
remains**, and writes into `docs/stories/` for the normal commit flow.

---

## 6. Immediate next steps

1. Run `pitch_sheet.py` against live GDELT output and see whether the sheet is
   actually selectable — tune `MIN_DISTINCT_SOURCES`, `WEAK_DOMAINS`, and the
   `GEO_FEATURES` angle phrasings from a week of real sheets.
   *(First real run done 2026-08-08: 25 clusters in, 20 pitches out, 5 filtered.
   Two Tehran clusters correctly flagged as follow-ons to `iran-strikes`. The
   sheet has never been read on a phone yet — that's the actual open question.)*
2. Produce **one story by hand** through Stage 3 in a chat session, before
   writing `build_dossier.py`. The dossier schema should be derived from what a
   real story actually needed, not guessed at in advance.
3. Then build `build_dossier.py`, then `finalize.py`.
4. Separately: fix whatever RSS/ESPN endpoints are failing in `morning_paper.py`.

---

## 7. Conventions to preserve

- `encoding="utf-8"` explicitly on **every** file write. Windows defaults to
  cp1252 and dies on emoji and en-dashes.
- Escape all user/source-derived text into HTML (`html.escape(..., quote=True)`).
  Article titles from the open web end up on these pages.
- Every output written twice: dated file + `latest.*`.
- New dependencies are a cost. Standard library unless there's a real reason.
- External data sources fail silently and independently — one dead feed must
  never take down a run.
- Coordinates from GDELT are machine-generated and occasionally pin the wrong
  same-named town. Treat them as pointers to verify, never as published fact.
- Silent failure is the house style, and it has a cost: a script that swallows
  errors can produce a clean-looking run that did nothing. Every stage that can
  quietly find zero of something should **print the count**, so a zero is visible
  in the output rather than hidden behind a success message.
- Anything that belongs to the project goes inside `Website/`. Files dropped in
  the parent OneDrive folder aren't in git, don't deploy, and won't be seen by
  Claude Code.
