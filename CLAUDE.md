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

Editorial line, and it matters for everything below: **a human writes and
publishes.** No generated prose ships without being rewritten in Harvey's voice,
and no factual claim ships without a traceable source. Tooling exists to make
that discipline cheap, not to skip it.

**Note (2026-08-09):** the old automated story-finding pipeline — a GDELT news
scraper (`gdelt_leads.py`), a phone-ranked pitch sheet (`pitch_sheet.py`), and a
personal morning paper (`morning_paper.py`) with its daily GitHub Action — has
been removed. Harvey is finding stories a different way now. What remains below
is the site itself and the by-hand story-writing discipline; the "how stories
get found" step is deliberately open.

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
- **Automation**: none currently. The one remaining Python script is a local
  story scaffolder; there is no GitHub Action. (See the note in section 1 — the
  scraper/paper automation was removed 2026-08-09.)

```
CLAUDE.md         this file
STORY-GUIDE.md    how to write a story folder by hand
WHAT-CHANGED.md   running changelog
.eleventy.js      Eleventy config
CNAME             thespatialupdate.com

scripts/          Python automation
  new_story.py            scaffolds a new src/stories/<slug>/ folder

src/              Eleventy source (stories live in src/stories/<slug>/)
docs/             built site, served by GitHub Pages
_site/            stale Eleventy default output — NOT served, safe to ignore
```

**Watch out for `_site/`.** Eleventy's default output directory. This project
publishes from `docs/` instead, so `_site/` holds an outdated build that nothing
serves. If a change appears live but not locally, or the reverse, check you're
looking at `docs/`.

**Story coordinate convention.** Stories store coordinates **lon-first**, both in
the Eleventy front matter (`coordinates: [-68.0, 8.0]`) and inside
`data.geojson` (`"coordinates": [lon, lat]`, per the GeoJSON spec). Many outside
data sources give coordinates **lat-first** `(lat, lon)`. Anything crossing that
boundary has to swap, and it's the likeliest source of a marker landing in the
wrong ocean. Note the published story map file is `data.geojson`, not
`story.geojson` as section 5 Stage 3 still describes — reconcile that if Stage 3
ever gets automated.

---

## 4. Existing scripts

### `new_story.py`
Scaffolds a new `src/stories/<slug>/` folder — front matter, starter
`data.geojson`, sidebar include. Run this rather than hand-copying an existing
story folder. See `STORY-GUIDE.md` for the manual process it automates.

This is the only script left. The GDELT scraper (`gdelt_leads.py`), pitch sheet
(`pitch_sheet.py`), morning paper (`morning_paper.py`), archive builder
(`build_paper_index.py`), phone notifier (`mobile_notify.py`), and the daily
GitHub Action that ran them were all removed on 2026-08-09 — Harvey is finding
stories a different way. If any of that gets rebuilt, the conventions in
section 7 still apply.

---

## 5. The story production protocol

The spine of the whole thing is the **claim ledger** — every sentence that ships
is tied to an ID, and every ID is typed as Reported, Background, or Inference.
That discipline is source-agnostic: it holds no matter how a story is found.

**Finding stories (was Stage 1, now open).** The old automated finder — GDELT
scraper → phone-ranked pitch sheet — was removed on 2026-08-09. Harvey is
sourcing stories a different way now; that step is deliberately undefined here
until the new route settles. What it produced for the rest of the protocol was
just: a place, a spatial angle, and a set of source URLs. However stories arrive
now, the stages below still expect roughly that much before a dossier is built.

### Stage 2 — Dossier build (**not built yet**)

`build_dossier.py <slug>` → `dossiers/<slug>.json`.

Should gather, for a selected story:
- every source URL with publisher, publication date, and fetched article text
- an OSM/Nominatim reverse geocode of each coordinate, so place names are
  verified rather than assumed
- adjacent structured data where relevant — admin boundaries, elevation,
  population

**Rule: nothing in the finished story may exist outside the dossier.** That
constraint is what makes Stage 3 auditable. (The dossier schema was originally
sketched around GDELT event records; rederive it from whatever the new
story-finding route actually hands over.)

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

1. Settle the new story-finding route (replacing the removed GDELT/pitch-sheet
   finder), then write down what it hands off — place, spatial angle, source
   URLs — so Stage 2 has a defined input.
2. Produce **one story by hand** through Stage 3 in a chat session, before
   writing `build_dossier.py`. The dossier schema should be derived from what a
   real story actually needed, not guessed at in advance.
3. Then build `build_dossier.py`, then `finalize.py`.

---

## 7. Conventions to preserve

- `encoding="utf-8"` explicitly on **every** file write. Windows defaults to
  cp1252 and dies on emoji and en-dashes.
- Escape all user/source-derived text into HTML (`html.escape(..., quote=True)`).
  Article titles from the open web end up on these pages.
- New dependencies are a cost. Standard library unless there's a real reason.
- External data sources fail silently and independently — one dead feed must
  never take down a run.
- Machine-generated coordinates occasionally pin the wrong same-named town.
  Treat them as pointers to verify, never as published fact.
- Silent failure is the house style, and it has a cost: a script that swallows
  errors can produce a clean-looking run that did nothing. Every stage that can
  quietly find zero of something should **print the count**, so a zero is visible
  in the output rather than hidden behind a success message.
- Anything that belongs to the project goes inside `Website/`. Files dropped in
  the parent OneDrive folder aren't in git, don't deploy, and won't be seen by
  Claude Code.
