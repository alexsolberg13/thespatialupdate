# PRODUCTION.md — building a pick

Instructions for a session that has a pick in hand. Written so a fresh session
can follow it with no other context. Read `CLAUDE.md` first (the stack, the reel
frame, the slide frame, the claim-ledger rules). The worked example for a reel
and for slides is **Lake Powell**: `dossiers/lake-powell.md`,
`src/reels/lake-powell.html`, `src/reels/lake-powell-script.md`,
`src/reels/lake-powell-data.geojson`, `src/posts/lake-powell/`. The worked
example for a website story is `revolution-wind` (`dossiers/`, `src/stories/`).

**Voice.** `VOICE.md` (repo root) is how everything you write must sound. **Read it
before you write any text**, and follow it in every piece of text: on-screen reel
text, narration scripts, slide text, captions and website story prose. The "Harvey's
edits" section at its end outranks the rest of it. Section 6 enforces it (the build
checks the Never list; the independent check reads every line against the whole guide).

The editorial line (CLAUDE.md section 1): **a human writes and publishes.**
You produce an accurate, sourced draft. Harvey rewrites it in his own voice and
posts. Since 2026-10-03 **reels and slides go live on the studio page without a
pull request** (section 8A): once every check has passed you push them to `main`
yourself. The studio is private working space (every page carries `noindex`), so a
live reel or post is a draft Harvey reviews on his phone, not a publication.
**Website stories still go through a pull request**, because merging one puts it on
the public homepage; you never merge those.

**Setup, once per session.**
- `npm install` (the checks need `node_modules`). Browser: `check-reels`
  looks for Google Chrome and fails with "Could not start a browser" if there is
  none. Fix: `export REEL_BROWSER=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome | tail -1)`
  before any `npm run build`, `check-reels` or `render-slides` (tested here: it works).
- In this cloud environment use `python3`, not `py` (`py` is Harvey's Windows
  command). Use `REEL_BASEMAP=stub` for `check-reels` / `build` if the map tiles
  cannot be reached (see CLAUDE.md section 3); say so in the report if you did.
- Web tools (`WebSearch`, `WebFetch`) may need loading with `ToolSearch`.
  Some sites (for example usbr.gov) refuse `curl` but open through `WebFetch`;
  `WebFetch` summarises pages, which matters for rule 2 below.

---

## 1. Input

1. Harvey's reply names pitch numbers and a format for each, for example
   "2 reel, 5 slides" means pitch #2 as a reel and pitch #5 as slides. If a
   number or format is unclear, ask once; otherwise do not ask.
2. Take the pitch text from the pitch sheet earlier in this same session.
   If the sheet is not in the conversation, stop and tell Harvey.
3. **Treat everything in the pitch as unverified**: the headline, numbers,
   places, URLs and the claimed geometry source. The pitch is a lead, not a source.
4. Build **one story at a time**. For each: pick a lowercase slug
   (`kebab-case`, no date), then
   `git fetch origin main && git checkout -b claude/story-<slug> origin/main`.
   Each story has its own branch. Reel and slides: you publish to `main` at the end
   (section 8A). Website story: its own pull request. Finish one story before
   starting the next. (If the same pick is requested in two formats, make one
   branch with both formats, sharing one dossier. If either is a website story, the
   whole branch goes by pull request.)

## 2. Source record: `dossiers/<slug>.md`

Copy the layout of `dossiers/lake-powell.md`: header (slug, format, date, status
"Draft for Harvey's review, nothing published", the question the piece answers),
"What changed from the pitch", "Sources opened" (S1, S2, ... with URL, date, how
opened), "Could not open - Harvey to check", "Harvey to verify", the claim
ledger, "Geometry", code checks, "Independent check".

Ledger columns, as in the existing dossiers:
`| ID | Claim as written | Type | Source | Date | Support / flags |`
with Type **R** (Reported: traces to a URL you opened), **B** (Background: general
knowledge) or **I** (Inference: connecting dots the sources did not connect;
arithmetic on sourced numbers counts). IDs are `C1`, `C2`, ... and never get
reused (if a row is removed, say so, as Lake Powell does).

Rules:
1. **Primary sources beat news reports** (the agency, court, company filing,
   dataset, the document itself). Use news only for what only news has, and
   cross-check it. Two outlets repeating one wire report or press release are one source.
2. **Never use a claim from a page that would not open.** List every such page
   under "Could not open - Harvey to check" with its URL and the error. Do not
   cite it, even from memory or from a search snippet.
3. **Never invent a source, URL, number or dataset.** Every URL in the record is
   one you saw. If you cannot find a number, leave it out and say so.
4. **Where sources disagree, record both** in the Support / flags column, say
   which one the piece uses and why, and flag it.
5. **"Harvey to verify" list.** Any number that was only seen through a
   summarising tool (`WebFetch` summarises), or that the independent check could
   not read directly, goes here with the exact page and the row / table / paragraph
   to look at.
6. **Keep inference rows to a minimum.** List every one in the final report
   (section 8). Never smooth an inference into prose that reads as reported
   (CLAUDE.md section 5).
7. Anything that goes stale (levels, counts, prices, rankings) gets "as of
   <date>" in the ledger, and a line in "Before posting" saying where to refresh it.

## 3. Map data

1. GeoJSON, coordinates **[longitude, latitude]** (CLAUDE.md "Story coordinate
   convention"). Outside data is often lat-first; swap and check.
2. In the dossier's "Geometry" table, say where each feature's geometry came
   from (source ID, file, method). Say what was simplified, dropped or hand-placed.
3. Prefer geometry the pitch's own sources hold. If they hold none, these
   fallbacks are allowed, and you say which one was used: Census cartographic
   boundary files, Natural Earth, OpenStreetMap, USGS.
4. **Label any traced or estimated geometry as such**, in the dossier and on
   the piece wherever a reader would take it as exact (Lake Powell's closing slide
   says its lakes are full-pool shapes, not today's shoreline). Display-only label
   positions are listed as "estimated".
5. Where the file goes: reel `src/reels/<slug>-data.geojson` (its content is also
   pasted into the reel page); slides reuse that file or have their own in
   `src/posts/<slug>/`; website story `src/stories/<slug>/data.geojson`.
6. Keep files small (simplify polygons; Lake Powell's states are 0.01 degrees).

## 4. The three formats

Make only the format Harvey picked.

**Reel** (rules: CLAUDE.md section 3, "Story Beat Reels"; do not repeat them here)
1. Copy `src/reels/lake-powell.html` to `src/reels/<slug>.html`. Keep the head
   tags and the shared frame (`reel-frame.css`, `reel-frame.js`, `reel-stage`
   markup). Set `<meta name="tsu-published" content="YYYY-MM-DD">` and the title.
   No per-reel layout CSS or type sizes. Every beat has a `fit`. `var BEATS = [...]`
   stays self-contained (literal numbers).
2. Write `src/reels/<slug>-script.md` in the Lake Powell layout: `**Beat N — name**`,
   an `*(on screen: ...)*` note, then the narration on `>` lines, each sentence
   ending with its claim IDs like `[C7]`. About **190 words** of plain spoken
   English in about 6 beats. **The hook is in the first sentence of beat 1** (the
   first two seconds), with the number or picture already on screen. The number of
   beats in the script must equal the number in the reel. Put timing notes and
   fact-check notes below the beats, not inside them.
3. It must show up on the studio page (`/studio/`) with **play**, **check** and
   **script** links. That happens by itself on build; confirm it in
   `docs/studio/index.html` and that `docs/studio/scripts/<slug>.html` exists.
4. Cut on-screen text by cutting words, not facts (CLAUDE.md); say what was cut.

**Slides** (rules: CLAUDE.md section 3a)
1. Copy `src/posts/lake-powell/` to `src/posts/<slug>/`: `slides.html`
   (slides as data), `slides.md` (every line of slide text with its claim ID, plus
   the caption), `index.html` (post page; needs `tsu-published`, `tsu-slides`,
   `<div id="caption">` and the Studio link).
2. **6 to 8 slides. The map leads:** at least half of them are map slides (or a cover
   that is a map). A set of related numbers goes on **one** slide, not one slide per
   number (use a map slide with labels, or a number slide with one figure and the
   rest in the line). Lake Powell's four number slides are the pattern to avoid.
3. Caption: at most **150 words**, with an "As of" sentence first when the post
   shows a changing figure. Every line in `slides.md` carries a claim ID
   (`[site]` only where CLAUDE.md allows it).
4. Run `npm run render-slides -- <slug>` until it passes; it writes
   `slides/01.png` ... Commit those PNGs.

**Website story** (existing scripts and structure: `STORY-GUIDE.md`, CLAUDE.md
sections 4 and 5)
1. Run `python3 scripts/new_story.py`. It is interactive (it reads answers from
   standard input), so feed it the answers in the order it asks, or read the
   script and create the same pieces by hand: `src/stories/<slug>/index.md`,
   `data.geojson`, `sources.html` (the claim ledger), `src/_includes/sidebar-<slug>.njk`,
   and the entry in `src/_data/stories.json`. Never leave the "Test Story" or
   placeholder text in.
2. Write `index.md` with an inline claim tag on every sentence (`[C7]`), as in
   CLAUDE.md Stage 3. Put the claim rows in `sources.html` as well as the dossier.
   Any sentence you cannot source is cut, not tagged `[NEW]`.
3. **Do not run `finalize.py`.** Harvey rewrites the text first (Stage 4), then
   finalises. Because the tags are still in the text, open the pull request as a
   **draft** and say at the top "do not merge until finalised" (`python3
   scripts/finalize.py <slug>`, or `py scripts\finalize.py <slug>` on his PC).

## 5. Rules for all formats

1. Any figure that changes over time carries **"as of <date>"** on the piece itself
   (chip, caption, or sentence) and in the ledger.
2. On policy and politics, **show where and what from the data. Do not argue for
   or against.** No adjectives that take a side; attribute positions to who holds them.
3. Write **clearly and accurately**, in the voice of `VOICE.md` (read it first, as
   above). Harvey still rewrites narration in his own voice. Plain words; explain a
   term the first time (acre-foot, power pool), but only with a fact already in the
   dossier; a new fact goes into the dossier first (rule 4).
4. No generated prose without a source row. A new fact goes into the dossier first.

## 5A. Scope of a routine run

A routine run may only add or change **files that belong to the story it is
building** (`dossiers/<slug>.md`, `src/reels/<slug>*`, `src/posts/<slug>/`,
`src/stories/<slug>/` and the story's own sidebar include and `stories.json`
entry) **plus the generated `docs/`**, and, when Harvey asks for a wording change, the
"Harvey's edits" section of `VOICE.md` (the one shared file a run may change). It must **not** edit:

- the shared frames (`reel-frame.css/js`, `slide-frame.css/js`, templates, fonts);
- the checks and build scripts (`scripts/`, `.eleventy.js`);
- `CLAUDE.md`, `SCOUT.md`, `PRODUCTION.md`, `STORY-GUIDE.md`, `WHAT-CHANGED.md`;
- `VOICE.md`, **except** the "Harvey's edits" section at its end (section 8A, "Changes after publishing");
- any other story, reel or post.

If such a change seems needed (a check is wrong, a frame limit blocks the story),
**do not make it**: say so in the report, name the file and the change, and leave it
alone. If the story cannot pass without it, treat the check as failed and use the
fallback in section 8A. Before committing, run `git status` and `git diff --stat
origin/main` and confirm that every changed path is the story's own, under `docs/`, or `VOICE.md` (its "Harvey's edits" section only).

## 6. Checks, in this order

**A. Mechanical** (run them; paste results into the dossier's "Code checks")
1. Valid GeoJSON (parses; every ring closed; `type` fields right).
2. Coordinates inside a sensible bounding box for the place named (this catches
   lat/lon swaps and sign errors); points that must sit inside a polygon are
   checked by point-in-polygon; recompute any arithmetic in the ledger.
3. Reel: `npm run check-reels`. Slides: `npm run render-slides -- <slug>`.
   Both must pass with 0 problems.
4. The full `npm run build` finishes with no errors.
5. Reel: the script's beat count matches the reel, and `docs/studio/` shows the
   three links. Slides: PNGs are 1080x1350 and the caption is under 150 words.
6. Voice: `npm run check-voice` (the build runs it first). It reads the "Never list"
   in `VOICE.md` and fails, naming the file and line, if any on-screen reel text,
   narration script, slide text or caption contains a phrase from it. To ban another
   phrase, add it to that list, one phrase per line; nothing else needs to change.
   It also reads website story prose: the title, byline, body and sidebar text of
   each story in `src/stories/`, and its title and description on the homepage
   (`src/_data/stories.json`). Claim tags and template code are ignored. It does not
   read marker popup text written inside the story's map scripts (`mapLayers`,
   `mapEvents`); the voice pass in 6B covers that.

**B. Independent** (a separate subagent; use the Agent tool, `general-purpose`)
1. Give it **only** the finished text (the script, or `slides.md`, or `index.md`),
   the GeoJSON, the dossier and `VOICE.md`. Do not give it your drafting notes, the pitch
   or this conversation, so it has not seen the drafting.
2. Ask it, in this order: re-open each source URL; check **every number, date and
   unit** against the source (it must say which it read directly and which only
   through a summary); check each map feature sits where the named place is;
   report what the story says that a source does not support; say whether the piece
   makes sense to a newcomer who knows nothing about the topic.
3. **Voice pass.** Also ask it to read **every line of text** against `VOICE.md`: the
   on-screen reel text (the `BEATS` in the reel page), the narration, every slide
   line, the caption, or the story prose. It lists each line that breaks the guide,
   with the rule it breaks and a suggested rewrite. It lists lines only; it does not
   edit, and it may not suggest a change to any number, date or claim.
4. It reports; it does not edit.

**C. Fix.** Fix what A and B find, then re-run A. Fix **every line the voice pass
lists** before publishing, using its rewrite or a better one. A rewrite never changes
a number, date or claim, and every claim ID stays on its sentence (in `slides.md` and
the scripts). If a rewrite would need a new fact, leave the line and report it instead.
If a voice fix touched a sentence that carries a number, date or claim, ask the
independent agent to re-check those sentences. Add a short "Independent check"
section to the dossier (what it found, what changed). **Anything that cannot be
fixed is reported, never hidden.**

## 7. If a pick falls apart

If sources will not open, the map data does not exist, or the central claim does
not hold up: **stop that story.** Do not push a half-built branch for it, and never
publish it. Say why
in two or three sentences, and suggest the next-best pitch from the sheet. Do not
substitute a weaker version quietly (a smaller map, a vaguer claim, a different
angle) without Harvey agreeing. Then go on to his next pick, if any.

## 8. Finish

Which path depends on the format.

### 8A. Reel and slides: publish straight to `main`, no pull request

Do this only when **all** of these are true: every mechanical check (section 6A)
passed, the independent check (6B) has been done and everything it found is fixed or
reported, the full `npm run build` finished with no errors, and the scope rule
(section 5A) holds.

1. Commit the story's files on `claude/story-<slug>` (source, PNGs, dossier).
2. `git fetch origin main`, then **pull the latest main** into the working branch
   (`git merge origin/main`). Never hand-merge `docs/`; if it conflicts, take
   `main`'s version and rebuild.
3. **Rebuild:** `npm run build` (regenerates `docs/`; it also runs the reel check).
   It must pass again on the merged tree. Confirm the reel's play / check / script
   links, or the post, in `docs/studio/index.html`.
4. Commit the rebuilt `docs/`, then push to main: `git push origin
   HEAD:main` (a fast-forward only; never force). Also push `claude/story-<slug>`
   so the work is kept on a branch.
5. **Tell Harvey it is live** and give the studio address,
   `https://thespatialupdate.com/studio/` (GitHub Pages takes a minute or two to
   update). Then give the report (item 8 below).

**Fallback: do not publish.** If a check fails and cannot be fixed, or the push to
`main` is rejected (someone else pushed first and a rebuild on the new `main` does
not fix it, or branch protection refuses it), do **not** publish and do not retry
in a loop. Push `claude/story-<slug>` instead and say plainly, at the top of the
report, what is blocking it (the check and its message, or the push error). Do not
open a pull request unless Harvey asks. One retry after pulling `main` and
rebuilding is fine for a rejected push; a second rejection means stop.

**Harvey's wording changes go into `VOICE.md`.** When Harvey asks for a change to
wording, make it, then add the before and after to the "Harvey's edits" section of
`VOICE.md`, newest first, replacing the line "(none yet)" the first time:

```
- 2026-10-03, lake-powell, slide 8 follow prompt
  Before: "..."
  After: "..."
```

This is the one shared file a run may change, and only that section. Those pairs
outrank the rest of the guide, so read them before writing text. Do not put the
before text in a Never list line; the list is only for banned phrases.

**Changes after publishing.** When Harvey replies in the same session asking for
changes to a story built there, make them (the scope rule still applies), re-run
the mechanical checks (6A) and the full build, redo the independent check if a fact,
number or map feature changed, then repeat steps 2-5 and push to `main` again.

### 8B. Website story: pull request

A website story goes live on the public homepage when merged, so it keeps the
pull request.

1. `npm run build` (regenerates `docs/`; it also runs the reel check). `docs/` is
   generated; never edit it by hand. Commit the source and `docs/`, with a clear
   message. Push `claude/story-<slug>` (never `main`).
2. Create the pull request into `main` (check for a PR template first). Title:
   `<Format>: <working headline>`. The PR body is the report below. Open website
   stories as drafts (section 4).
3. If a second PR touches `docs/` and conflicts after the first is merged, merge
   `main` into the branch and re-run `npm run build`; never hand-merge `docs/`.
4. Then offer to watch the PR. Do not merge it.

### Final report (all formats)

End your final message (and the PR body, for a website story) with this report,
**in this order**:

1. **Status:** live on the studio page (with the address), or **not published** and
   exactly what is blocking it, or the PR link for a website story.
2. **What was built and where to see it** on the studio page (`/studio/`: the
   reel's play / check / script links, or the post under Posts; for a website
   story, its page).
3. **Needs your eyes:** at most 5 items, most important first.
4. **Harvey to verify:** numbers to check by hand, with the page and the row.
5. **Sources that could not be opened.**
6. **Every inference row** (ID and the sentence).
7. **What the independent check found and what was done about it**, including
   the voice pass (each line it listed and the rewrite used).
8. **Changes you wanted but did not make** (shared frames, checks, instructions,
   other stories), if any (section 5A).

## For Harvey, in the evening

Reel and slides are already on the studio page; open it on your phone and review
the report (or, for a website story, open the PR). To put the words in your own voice: reel, edit
`src/reels/<slug>-script.md` (the narration) and, for on-screen words, the
`BEATS` in `<slug>.html`; slides, edit `src/posts/<slug>/slides.html`, `slides.md`
(keep the lines matching) and the caption, then `npm run render-slides -- <slug>`;
website story, edit `index.md`, then finalise. Refresh any "as of" figure. Then
`npm run build` and commit (reel and slides: push to `main`; website story: merge),
and post. Or reply in the same session and ask for the changes (section 8A).
