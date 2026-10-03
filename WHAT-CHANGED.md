# What changed — narration scripts on the studio page (`claude/studio-scripts`)

- **Third link "script"** beside play and check for every reel on `/studio/`. It opens `/studio/scripts/<slug>.html`: per beat the number, the reel's on-screen headline, and the narration in large type (30 px on iPhone up to 56 px on a laptop).
- **Counts:** words and read time (150 words a minute) per beat and for the whole script; a "Copy full script" button copies every beat.
- **Built from `src/reels/<slug>-script.md`** by `scripts/reel_scripts.js` on every build, so editing a script file updates the page. Claim IDs, the intro, timing guide, tighter cut, fact-check notes and on-screen notes stay in the file and are not on the page.
- **Reverses the old rule** that narration scripts are not published; `CLAUDE.md` updated.
- **Build fails in plain English** if a reel has no script, if the script has a different number of beats from the reel, if beats are not numbered in order, or if a beat has no narration. `check-reels` also fails if a built script page is stale.
- The script's "(on screen: ...)" notes are not compared with the reel: several already differ from the reel's shortened on-screen text, so the page shows the reel's own headline.

---

# What changed — studio home page (`claude/studio-home`)

- **New home page** `/studio/` (`src/studio/index.html`, built by `scripts/studio_index.js`): Reels (play and check), Posts, Tools (calibration), newest first, read from the folders on every build. Large tap targets, reel fonts and colours.
- **Web app** now starts at the studio page; manifest scope is `/` so reels, posts and studio stay full screen. Home Screen name is now "TSU Studio" (re-add the icon on the phone to pick up the new name and start page).
- **Way back:** post pages and the posts index link to the studio; reels return on a one-second hold (and Escape) to the studio, and show a visible "Studio" link only with `?check=1` / `?guides=1`; the calibration page has one too. Nothing is drawn in playback.
- `check-reels` also fails if `docs/studio/index.html` is stale. Reel layout checks: 0 problems (basemap stubbed here).

---

# What changed — Instagram slides format (`claude/slides-format`)

- **New format: slides.** 1080x1350 PNG carousels with a caption. Shared frame in `src/posts/slide-frame.css` / `.js` (8% margin, type sizes 72 / 40 / 30, same fonts and colours as the reels); slide types cover, map, number, closing. See `CLAUDE.md` section 3a.
- **`npm run render-slides`** audits every slide (margins, minimum 30 px type, overlaps, limits, map window, claim IDs against `slides.md` and the dossier, caption 150 words) and saves exact 1080x1350 PNGs only if all pass.
- **Posts page** `docs/posts/` (newest first, linked from the reels index). Each post page lists its slides as plain images to press and hold on iPhone, and the caption with a copy button. Built by `scripts/posts_index.js` on every build, which also stops if a post's caption or PNGs are wrong.
- **First post: Lake Powell**, 8 slides, text in `src/posts/lake-powell/slides.md` with a claim ID on every line, caption 102 words. No new facts: every ID is a row in `dossiers/lake-powell.md`. Lake levels are as of Sep 30, 2026; refresh before posting.
- **Independent check** of the slide text against the source record (see the end of `dossiers/lake-powell.md`). No wrong number. Applied: "was" and a dated first caption sentence; "aim to keep" instead of "try to hold"; "No required cut" instead of "Voluntary only"; "acre-feet" on the slide 7 legend.
- Maps on slides are SVG from the existing GeoJSON, no basemap tiles.

---

# What changed — check-reels without the internet (`claude/magical-curie-h3bobb`)

- `REEL_BASEMAP=stub npm run check-reels` (or `node scripts/check_reels.js --stub`) runs the whole check with no network: the map library is served from `node_modules` and the basemap is an empty dark background; every other request is refused. `npm run build` passes the variable through, so the full build runs to completion in the cloud sandbox.
- What it does **not** check in stub mode: the basemap's own place names (the part of rule 6 that hides them). The run says so in each reel line and the summary. The default run (no variable) is unchanged and still needs the internet.
- Added `maplibre-gl` 5.6.0 (the version the reels load) as a dev dependency for this. Run `npm install` once after pulling.
- Checked it still fails when the layout is broken (headline word limit and camera margin deliberately broken: 27 and 6 problems), then restored.

---

# What changed — text block moved down (`claude/reel-text-87`)

- **Text block** now ends at **87%** of the stage (it was 83%), and still grows upward with the legend directly above the kicker. The bottom margin is 13% (`--safe-bottom`), `--text-bottom` is 87.
- **Headline limit.** The headline's last line must end at or above **84%** (`--headline-bottom`). On a beat with no supporting line the headline is the last line and ends at 84%. With a one-line supporting line the headline ends at about 83.7%.
- **Map window** grows down to just above the legend's new position; each beat's subject is re-framed in the larger window automatically (no beat's `fit`, `z` or wording was changed, so no on-screen text was cut).
- **`check-reels`** and the shared files enforce all of it: bottom margin 13%, text end 87%, headline limit 84%, and a new rule 3 message if a headline ends below 84%. The `?check=1` panel has a new "Headline" row.
- **`?check=1` Instagram mock** now draws both versions of the bottom stack: three rows (username, caption, audio) from 84% and two rows (username, caption) from 89% (`--ig-stack-top`, `--ig-stack2-top`), side by side with a dashed line at each start.
- `CLAUDE.md` updated to match (it also still said the blocked corner was the bottom 40% of the height; it is from 45% down).
- `check-reels` on all four reels: 0 problems.

---

# What changed — viewer zones (`claude/reel-viewer-zones`)

Measured from a viewer's screen on Instagram.

- **Text block** still ends at 83% (their username and caption stack starts at 84%). No change to the number; `check-reels` now fails if the bottom margin is not 17%.
- **Blocked corner** is now the right 17% of the width from **45%** of the stage down (it was from 60%). `--corner-h` is 55 in `reel-frame.css`. No text, legend or map label may sit there; `check-reels` fails if the corner is not 17% x 55%.
- **`?check=1` Instagram mock** now matches the viewer's layout: a three-row stack (username, caption, audio) starting at 84%, and a button column with counts starting at 47% (`--ig-stack-top`, `--ig-col-top`).
- **Lake Powell, "Seven states, two lakes":** Colorado and New Mexico ran past the right margin because the camera only fitted two corner points of a box on a curved map. The beat (and "Voluntary only") now also fits Colorado's and New Mexico's east edges, so the camera zooms out until all seven states sit inside the 8% margins.
- **Lake Powell, "Upper Division" label:** it, and the AZ / CA / NV labels, showed on every beat. MapLibre writes an inline opacity on markers, which overrode the stylesheet's `opacity:0`. Labels are now hidden with `visibility`, so "Upper Division" shows only on "Voluntary only" and the state cut labels only on "Who gets cut". (The fade-in is gone with it.)
- `check-reels` on all four reels: 0 problems. Nothing was flagged by the new corner on the other three reels.

---

# What changed — iPhone offset fix and on-device check (`claude/reel-device-check`)

**The bug.** In Home Screen mode on an iPhone 15 the whole stage sat about 59 points too low (date tag at ~24% instead of 15%, map subject at ~47% instead of 38.5%). `reel-frame.js` centred the stage on the physical screen (852pt) but assumed the page's viewport starts at the top of the screen. When the page is not in `viewport-fit=cover` mode, iOS lays it out *below* the status bar: the viewport is 793pt tall and starts 59pt down, so everything drawn "from the top" lands 59pt low. `lake-powell.html` had a second `<meta name="viewport">` without `viewport-fit=cover` (the other three reels had one correct tag).

**The fix.**
- `reel-frame.js` now works out where the viewport really starts on the screen (`viewportTop`) and places the body, and so the stage and map, in physical-screen coordinates. Nothing inside the stage uses insets or the viewport height; the one probe for the inset lives outside the stage.
- The duplicate viewport tag is gone from `lake-powell.html`, and `check-reels` now fails any reel without exactly one viewport tag that includes `viewport-fit=cover`.

**On-device check, `?check=1`.** A panel inside the safe area shows PASS / FAIL with expected and actual percent-of-stage for the header row, map subject, legend and text block, plus the strips above and below the stage in points and the screen / viewport / top numbers. It also draws a mock of Instagram's interface (header, right-hand button column, username and caption) at the blocked zones; `&ig=0` hides the mock. The automatic check now uses `?audit=1` for freezing motion (it used `?check=1` before).

**Reels index.** Every reel has two buttons: play and check.

**check-reels iPhone simulation.** Each reel is loaded in a frame that reproduces the Home Screen layout (393x852 screen, 793pt viewport starting at the 59pt top inset, 34pt bottom inset; `navigator.standalone` true, `screen.height` 852). Header, legend, text block and map subject are measured in screen points against the rules for beats first, second and last, and nothing may reach the status bar or home indicator.
- Before the fix: 51 simulation failures across all four reels ("the stage is 59.0pt too low", "header row sits at 24.1% to 26.8%; the rule is 15% to 19%", "map subject centred at 46.9%; window centre 38.5%").
- After the fix: 0 problems.

---

# What changed — reel layout rules (`claude/reel-layout`)

Every reel now follows the same four bands, set once in `src/reels/reel-frame.css` and enforced by `npm run check-reels` on every beat of every reel. Percent of the 1080x1920 stage, from the top:

- **Header row, 15% to 19%:** the date tag and the progress dots on one line.
- **Map window, 19% to 58%:** only the map, map labels and at most one small graphic. Each beat's subject is framed inside it (not at the centre of the screen). The Lake Powell threshold ladder is that beat's one graphic, at the left, clear of the lake and dam.
- **Legend, 58% to 60%:** only on beats that need it; one row, at most 3 items, directly above the text.
- **Text block, 60% to 80%:** left-aligned, clear of the blocked corner: a kicker, a headline (2 lines, 7 words) and one supporting line (10 words). The map is darkened behind it and nowhere else (the old full-height top and bottom fades are gone).
- **Type sizes, once:** headline 64, supporting line 36, kicker / legend / date 28; nothing under 28.
- **Map labels** that fall under the header row, legend or text block are hidden (the basemap's place names and the reel's own state labels).

## How it works
- `reel-frame.css` holds the zone numbers, type sizes and limits. `reel-frame.js` frames each beat: a beat lists `fit` (the points of its subject) and the frame picks the largest zoom, up to the beat's old `z`, at which the subject fits inside the window, and centres it there. It also hides labels under the text.
- `scripts/reel_audit.js` (new) holds the rules; `check_reels.js` runs it on every beat after the safe-zone measurement. Each failure is a plain sentence naming the reel, beat and rule. If the basemap does not load, the check now fails instead of passing without being able to look.
- I tried to break the check on purpose (text pushed to 88% with a paragraph, 9-word headline, 4 legend items, 20px text, a second graphic, the ladder over the lake, a stray label, the old fades, labels left un-hidden, and more). Each one failed with the right message.

## What was cut from on-screen text (numbers and dates kept exact; narration scripts untouched)
**Lake Powell**
1. Kicker "Lake Powell · The Spatial Update" is now "Lake Powell". Line cut from "Powell stood at 3,518 ft as of Sept 30. The new rules try to hold it at 3,510 or higher" to "3,518 ft. New rules try to hold 3,510 or higher" (cut: "Powell stood at", "as of Sept 30"; the date tag still says As of Sep 30, 2026).
2. "At 3,500 ft: consultation and extra protective steps. At 3,490, the minimum power pool at Glen Canyon Dam" is now "3,500 calls for consultation; 3,490 is minimum power pool" (cut: "extra protective steps", "at Glen Canyon Dam").
3. "The river supplies 40+ million people and hydropower for seven states; two reservoirs hold it back" is now "Water for 40+ million people; hydropower for seven states" (cut: "two reservoirs hold it back").
4. "Under the Lower Basin states' proposed sharing agreement, the split is:" is now "Lower Basin states' proposed agreement splits it this way" (cut: "sharing"; it still says "proposed"). The dam pins are hidden on this beat and the next, and the legend drops the reservoir and dam rows there (3-item limit); the reservoirs are still drawn.
5. Kicker "Upstream" is now "Upper Division states". "These documents require no cut from the four Upper Division states; they can contribute up to 200,000 acre-feet a year" is now "No cut required; up to 200,000 acre-feet a year, voluntarily" (cut: "These documents", "the four").
6. Kicker "The margin" is now "Reclamation's plan". "Reclamation says it will adjust releases through April to try to keep Powell at 3,510 or above" is now "Adjust releases through April, aiming to keep 3,510 or above" (cut: "says it will", "Powell"; the attribution moved to the kicker).
- Legend labels shortened: "Lower Division states: 2027–28 reduction" is "2027–28 cut"; "Upper Division states: voluntary only" is "Voluntary only"; "The seven basin states" is "Basin states"; "Reservoirs" and "Dams" are singular. Beats 1, 2 and 6 keep a 2-item legend (reservoir, dam); beat 3 has 3.

**August 2026 eclipse**
2. "Only from inside it does the Sun vanish completely: step outside and it is merely partial" is now "Only inside it does the Sun vanish completely" (cut: "step outside and it is merely partial").
3. "The shadow lands first over the ice; Reykjavík barely makes it: about 59 seconds" is now "Reykjavík barely makes it: about 59 seconds" (cut: "The shadow lands first over the ice").
4. "First total eclipse over mainland Spain in over a century: the Sun just 11° off the horizon" is now "Mainland Spain's first total eclipse in over a century". **The 11° figure is no longer on screen** (it did not fit in 10 words with the century claim; the narration script still has it). Say if you would rather keep it and drop something else.
5. "99.9% of the Sun covered, and still on the wrong side of the line" is now "99.9% covered, still on the wrong side of the line" (cut: "of the Sun", "and").
6. "From the Arctic to a Spanish sunset, the whole show comes down to where you stand" is now "The whole show comes down to where you stand" (cut: "From the Arctic to a Spanish sunset,").
- Beat 1 is unchanged. Legend: "Path of totality" is "Totality path", "Inside totality" is "In totality", "Misses it: 99.9%" is "Misses: 99.9%".

**Lobito Corridor**
2. "Central Africa holds the world's richest copper and cobalt: the DRC alone mines about 72% of it" is now "The DRC alone mines about 72% of the world's cobalt" (cut: "Central Africa holds the world's richest copper and cobalt"; "it" is now spelled out as cobalt, which is what the story and ledger say. The 72% still needs its single citable source, as before).
3. "For fifty years the ore has ridden China's TAZARA railway to Dar es Salaam" is now "Ore has ridden China's TAZARA railway to Dar es Salaam" (cut: "For fifty years the"; the date tag still says Since the 1970s).
4. "A US- and EU-backed railway now pulls it the other way, to the port of Lobito" is now "A US- and EU-backed railway now pulls it to Lobito" (cut: "the other way", "the port of").
5. "A planned greenfield extension would wire the Copperbelt straight into the corridor" is now "A planned extension would wire the Copperbelt into the corridor" (cut: "greenfield", "straight"). The Copperbelt feeder line is not drawn on this beat (3-item legend limit).
6. "The same ore can now flow west to the Atlantic or east to the Indian Ocean" is now "West to the Atlantic or east to the Indian Ocean" (cut: "The same ore can now flow"). The planned Zambia link is not drawn on this beat (3-item legend limit; it is a plan, not a route the ore uses now).
- Beat 1 is unchanged. Legend: "Lobito → Atlantic" is "Lobito Corridor", "TAZARA → Indian Ocean" is "TAZARA", "Copperbelt feeder → junction" is "Copperbelt feeder".

**Revolution Wind**
2. "In 2013, BOEM leased 83,789 acres of ocean off Rhode Island — federal authority, marked as a polygon" is now "2013: BOEM leased 83,789 acres off Rhode Island" (cut: "of ocean", "federal authority, marked as a polygon").
3. "Inside that line, turbines rose — 704 megawatts, enough for more than 350,000 homes" is now "704 megawatts, enough for more than 350,000 homes" (cut: "Inside that line, turbines rose").
4. "The Department of the Interior ordered construction to stop, citing national security" is now "Interior ordered construction stopped, citing national security" (cut: "The Department of the").
5. "A second, broader order hit Revolution Wind alongside four sibling projects up and down the East Coast" is now "A second, broader order also hit four sibling projects" (cut: "Revolution Wind alongside", "up and down the East Coast").
6. "Federal judges called the security rationale likely pretextual and reinstated every one of the five" is now "Judges called the security rationale likely pretextual; reinstated all five" (cut: "Federal"; "every one of the" is "all").
7. "Revolution Wind now feeds the New England grid; full commercial operation is expected later this year" is now "Feeding New England's grid; full commercial operation expected this year" (cut: "Revolution Wind now", "later").
- Beat 1 only loses its em dash (now a comma). Kickers, headlines and date tags are unchanged on every beat of this reel.

## Also changed
- **Lake Powell:** the ladder text is 28px (it was 36 and 40) and the lake and dam are framed to the right of it; the basemap's "UNITED STATES" label is hidden so it no longer sits under the state labels.
- **Revolution Wind:** the faint turbine rings no longer show before the turbines appear (a leftover from the old format; the dot faded but its outline did not).
- **Guides** (`?guides=1`) now also mark the four bands.
- `npm run build` is unchanged: it still runs the check after Eleventy.

---

# What changed — Lake Powell on the shared frame (`claude/lake-powell-frame`)

- **Lake Powell reel** now uses the shared reel frame (stage, safe zone, hold-to-exit, Home Screen tags), like the other three. Its content, script, numbers and map data are unchanged. The elevation gauge is drawn smaller (370px tall instead of a straight scale-up) so it fits between the date dots and the legend; the numbers on it are the same. `check-reels` flagged nothing in any beat, so no on-screen text was shortened.
- **Reels index builds itself.** `src/reels/index.html` is gone; `docs/reels/index.html` is generated from the reels in `src/reels/` (newest first, calibration page last) by `scripts/reels_index.js` on every build. Each reel carries a `<meta name="tsu-published" content="YYYY-MM-DD">` tag that the index sorts by.
- **`npm run check-reels`** now fails with a plain-English message if a reel does not load the shared frame (`reel-frame.css`, `reel-frame.js`, the `reel-stage` markup), if a reel has no published date, or if the built index is stale.

---

# What changed — reel frame calibration (from iPhone 15 results)

- **Centring.** The stage is now centred on the physical screen (`screen.height`) in Home Screen mode, not on the viewport iOS reports (about 59pt short). The strips above and below should now be equal (about 76.7pt each). The calibration page has a readout (screen height, viewport height, strip above, strip below, in points) so you can confirm on the phone.
- **Safe area.** Now top 15%, left 8%, right 8%, bottom 20%, with the bottom-right corner cut out (right 17% of the width, bottom 40% of the height). The shared CSS, the guides, `npm run check-reels` (which now flags text running into the corner), the calibration page and CLAUDE.md are updated.

---

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
