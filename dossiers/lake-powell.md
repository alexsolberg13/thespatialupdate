# Source record — Lake Powell reel

**Slug:** `lake-powell` (format: reel only; no story folder)
**Built:** 2026-10-02, trial of the new production process. Branch `claude/story-lake-powell`.
**Status:** Draft for Harvey's review. Nothing here is published.
**Question the reel answers:** How close is Lake Powell to the line?
**Revision 2026-10-02 (after Harvey's review):** opens on 8 ft above the 3,510 ft target; percent figures and rows C12/C22 removed; script cut to ~190 words; state colours labelled Upper/Lower Division (C21, Compact); dam coordinates now from OpenStreetMap (S9).

Type key — **R** Reported (traces to a URL that was opened) · **B** Background
(general knowledge) · **I** Inference (a connection the sources did not make).

---

## What changed from the pitch (read this first)

1. **The "3,510 ft" risk is resolved.** The Record of Decision PDF did parse
   (with `pdftotext`; the earlier failure was a tool problem, not a bad file).
   More important: **3,510 ft does not appear in the Record of Decision as a
   floor.** It appears in the separate *2027–2028 Operating Guidelines* (also
   opened), which call it an operating **buffer**. The guidelines say the
   operations "protect a minimum Lake Powell elevation of 3,500 feet by
   initially seeking to maintain a minimum elevation of 3,510 feet." The
   Reclamation press release shortens this to "maintaining a minimum elevation
   of 3,510 feet." Both are recorded in C5.
2. **There are three lines, not one.** 3,510 ft (operating target / buffer), 3,500 ft (the level at
   which consultation and extra protective actions are triggered) and
   3,490 ft (the "minimum power pool"; below it, water can only leave Glen
   Canyon Dam through the river outlet works). The reel opens on the distance
   to the 3,510 target (8 ft) and then shows the 3,500 and 3,490 lines beneath
   it. It never calls 3,510 a minimum.
3. **The pitch said "who gets cut."** The reduction in the record is for the
   three Lower Division states only (the press release says "Lower Basin
   States"). The four Upper Division states face no equivalent reduction in
   these documents; the framework allows voluntary Upper Basin contributions
   (C14). Mexico is handled in a separate process and is not on the map.
4. **Map data.** The two named sources do not contain the reservoirs or dams.
   Census supplied the state boundaries; the reservoir outlines come from
   Natural Earth and the dam points from OpenStreetMap. See "Geometry" below.

---

## Sources opened

| ID | Source | URL | Date | How opened |
|----|--------|-----|------|-----------|
| S1 | Reclamation news release 5392, "Interior Department Finalizes Plans for 2027-2028 Colorado River Operations" | https://www.usbr.gov/newsroom/news-release/5392 | 2026-08-21 | Fetched; text read in full |
| S2 | Record of Decision, *Decision Framework for Colorado River Guidelines: Coordinated Operations of Lake Powell and Lake Mead (2027–2036)* | https://www.usbr.gov/ColoradoRiverBasin/post2026/decision-doc/P26_RecordofDecision_Final.pdf | August 2026 | PDF downloaded, text extracted with `pdftotext`, read |
| S3 | *Colorado River Guidelines for Coordinated Operations of Lake Powell and Lake Mead, Operating Years 2027 and 2028* (Operating Guidelines) | https://www.usbr.gov/ColoradoRiverBasin/post2026/decision-doc/2027-2028OperatingGuidelines_Final.pdf | August 2026 | PDF downloaded, text extracted, read |
| S4 | Reclamation "Colorado River Storage Project data (operational) for September 2026" (the named levels page) | https://www.usbr.gov/lc/region/g4000/hourly/levels.html | daily rows through 2026-09-30; read 2026-10-02 | Fetched twice; raw table rows quoted back both times |
| S5 | Western Water, "Colorado River Plan sets framework for post-2026 cuts" (secondary; used only to cross-check) | https://www.western-water.com/2026/07/31/colorado-river-plan-sets-framework-for-post-2026-cuts/ | 2026-07-31 | Raw HTML downloaded and read |
| S6 | Reclamation post-2026 documents index page | https://www.usbr.gov/ColoradoRiverBasin/post2026/index.html | read 2026-10-02 | Fetched; used to confirm the document set and dates |
| S7 | Census Bureau cartographic boundary file `cb_2023_us_state_500k` (state boundaries) | https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_state_500k.zip | 2023 vintage | Downloaded, read with a shapefile reader |
| S8 | Natural Earth 10m lakes (reservoir outlines; public domain) | https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson | n/a | Downloaded; features "Lake Powell" and "Lake Mead" used |
| S9 | OpenStreetMap, ways 108060498 (Glen Canyon Dam) and 49938932 (Hoover Dam), via the Nominatim search service. © OpenStreetMap contributors, ODbL (https://www.openstreetmap.org/copyright) | https://nominatim.openstreetmap.org/search?q=Glen+Canyon+Dam+Arizona&format=json and `...q=Hoover+Dam...` | looked up 2026-10-02 | API responses read: Glen Canyon Dam 36.9371150, -111.4841507; Hoover Dam 36.0157189, -114.7374858 |
| S10 | Colorado River Compact (1922), Article II definitions, on Reclamation's site | https://www.usbr.gov/lc/region/g1000/pdfiles/crcompct.pdf | 1922 | PDF downloaded, text extracted with `pdftotext`, Article II read |

Also opened, not relied on: Western Water, "The Decision: Colorado River gets
2-year plan amid record lows" (https://www.western-water.com/2026/08/21/the-decision-colorado-river-gets-2-year-plan-amid-record-lows/),
consistent with S1 on 3,510 / 3,540 / state cuts. Also looked up (not relied on): Wikipedia coordinates for the two dams (Glen Canyon 36.9375, -111.48444; Hoover 36.01556, -114.73778), which agree with OpenStreetMap within about 50 m and were used in the first draft.

## Could not open - Harvey to check

- **ABC4, "Colorado River operations finalized"**
  (https://www.abc4.com/news/politics/colorado-river-operations-finalized/):
  server returned HTTP 403. **No claim in this record or the script comes from
  it.** (The primary documents it would report on were opened directly.)
- **The named Census web page**
  (https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html)
  was not opened as a web page; I downloaded the data file it links to (S7)
  directly from the Census file server instead.
- **Reclamation "Future Colorado River Operations" fact sheet PDF**
  (https://www.usbr.gov/ColoradoRiverBasin/post2026/decision-doc/FutureColoradoOperations_Factsheet.pdf):
  the fetch returned a file whose text I did not extract or read. Not used.
- Note: `usbr.gov` refused direct command-line downloads from this machine
  (empty reply), so S1, S4 and S6 were read through the fetch tool, which
  summarises pages. The tables and quotes in S4 are the raw lines it
  returned. S2 and S3 were read as full extracted text.

---

## Claim ledger

| ID | Claim as written | Type | Source | Date | Support / flags |
|----|------------------|------|--------|------|-----------------|
| C1 | On Aug 21, 2026 Interior issued the 2027–2028 Operating Guidelines and the Record of Decision for Post-2026 Colorado River Operations, which sets a 10-year Decision Framework (2027–2036). | R | S1; S2 title page; S3 | 2026-08-21 | Press release dated Aug 21. The PDFs say "August 2026" (signature date is handwritten and unreadable in the text layer). |
| C2 | The combined contents of Lake Powell and Lake Mead have not been this low since before Lake Powell began filling after the gates at Glen Canyon Dam closed in 1963. | R | S1; S2 §1 | 2026-08 | Primary, both documents agree. |
| C3 | Lake Powell's elevation was 3,518.08 feet on September 30, 2026 (storage 5,155 thousand acre-feet). | R | S4 | 2026-09-30 | **Flag: the page says "Automatic reports have not been checked for errors."** Day 1 of September read 3,517.86 and Sept 28 read 3,517.67, so the lake moved less than a foot across the month. **This number will be stale by the time the reel is posted; refresh it from the page.** |
| C4 | S2 footnote 3: "At elevation 3,490 feet water can only be released through the river outlet works"; 3,490 ft is the "minimum power pool"; operating below it has additional impacts to hydropower (S3 §5.1 words it "below elevation 3,490 feet"). The script uses "below". | R | S2 §3.1 footnote 3; S3 §5.1 | 2026-08 | Primary, wording quoted from S2: "this is minimum power pool." The documents say "impacts to hydropower", not "no power." Script keeps their wording. |
| C5 | The 2027–2028 Powell operations are designed to protect a minimum elevation of 3,500 feet by initially seeking to maintain 3,510 feet, which "provides an operational buffer." | R | S3 §5.1; S1 | 2026-08 | **Sources word this differently:** S3 calls 3,510 a buffer above a protected 3,500 minimum; S1 says "maintaining a minimum elevation of 3,510 feet." Script uses the S3 wording. This resolves the pitch's single-source risk: 3,510 now rests on S1 and S3. |
| C6 | If Lake Powell is projected to fall below 3,500 feet, processes and tools are used to manage risk to infrastructure, and consultation occurs to decide further actions. | R | S2 §10.3 (principle 2) and Table 1; S3 §5.1 | 2026-08 | Primary. S2 footnote 7: 3,500 ft is a 10-foot buffer above 3,490 ft. |
| C7 | Lake Powell's surface (3,518.08 ft, C3) is 8.08 feet above the 3,510 target (C5). (It is also 18.08 feet above 3,500 (C6) and 28.08 feet above 3,490 (C4); the reel no longer uses those two distances.) | I | arithmetic on C3, C4, C5, C6 | 2026-09-30 | **Inference (arithmetic only).** Caveat: elevation above sea level is not "water depth" and not "feet from the dam failing," so the script says only "above" the target. The script calls 3,510 a target, never a minimum. |
| C8 | Reclamation expects Powell to begin the Oct 1 water year between 3,540 and 3,510 feet, in the Lower Elevation Infrastructure Protection Range, with an expected water-year release of 6.0–7.0 million acre-feet; it will adjust releases through April to try to keep the lake at 3,510 feet or higher. | R | S1 (also S3 §5.1.C) | 2026-08-21 | **Flag: this is a projection dated Aug 21.** The actual level on Sept 30 (3,518.08) falls inside the 3,540–3,510 range. S1 says the release volume "will be determined in April." |
| C9 | Deliveries to the Lower Basin states are reduced by 1.25 million acre-feet in each of 2027 and 2028. | R | S1; S3 §5.3.A.1 (apportionment 6.25 maf, "a reduction of 1.25 maf") | 2026-08 | Primary. S2 §3 explains the Lower Division normal condition is 7.5 maf. |
| C10 | If the Lower Basin states implement their proposed sharing agreement, the reductions are Arizona 760,000 acre-feet, California 440,000 acre-feet, Nevada 50,000 acre-feet. | R | S1; S3 §5.3.A.2 | 2026-08 | **Conditional:** S3 §5.3.A.3 says if the implementing agreements are not fully executed, the Secretary decides the quantities "in accordance with applicable law." The script and the on-screen text keep the condition ("under the Lower Basin states' proposed sharing agreement") wherever the split appears. **Disagreement flagged:** the secondary source S5 gives the same three numbers but describes them as part of a 1.5 million acre-feet scenario that includes 250,000 acre-feet for Mexico (S5 is describing the earlier modeling in the Final EIS, July 2026). The final documents (S1, S3) say 1.25 million acre-feet. The reel uses S1/S3. |
| C11 | After the reductions, the Lower Division apportionments are Arizona 2.04 million acre-feet, California 3.96 million acre-feet and Nevada 250,000 acre-feet (6.25 million total). | R | S3 §5.3.A.2 | 2026-08 | Primary. Not used in the script (the arithmetic that used it was removed). |
| C13 | Lower Basin contractors will conserve an additional 700,000 acre-feet of System Conservation water. | R | S1; S3 §5.3.B | 2026-08 | **Disagreement:** S1 says "over the two-year period"; S3 says "in 2026, 2027, and 2028." **Not used in the script.** |
| C14 | The 2027–2036 framework lists voluntary Upper Basin contributions of up to 200 thousand acre-feet per year, subject to hydrologic conditions. The 1.25 million acre-feet reduction in C9 applies among the Lower Basin states. | R | S2 Table 1 (§10.4); S1; S3 §5.3 | 2026-08 | The documents I read contain no mandatory cut for Upper Basin states. I did not read the Final EIS itself, so "no mandatory cut in these documents" is the safe limit of this claim. Table 1 also allows maximum use of the CRSP Upper Initial Units (Aspinall, Flaming Gorge, Navajo reservoirs) to release extra water to protect Glen Canyon Dam; that is an operation, not a state cut, and is not in the script. The 1.25 maf reduction covers 2027–2028; the framework runs to 2036. |
| C15 | Lake Mead's elevation was 1,037.80 feet on September 30, 2026. | R | S4 | 2026-09-30 | Same "not checked for errors" flag as C3. Stale-by-publication risk. |
| C16 | Lake Powell sits behind Glen Canyon Dam and Lake Mead sits behind Hoover Dam. | R | S2 §1 | 2026-08 | Primary. |
| C17 | If Lake Mead is projected to fall below 1,000 feet, processes and tools are used to manage risks to infrastructure; below 950 feet, water can only be released through the intake towers. | R | S2 §10.3 principle 2 and footnote 8; S3 §5.3 | 2026-08 | Primary. |
| C18 | The Colorado River provides water for more than 40 million people and generates hydropower for seven states. | R | S1 (Background section) | 2026-08-21 | Primary. |
| C19 | The seven Basin States were unable to reach an agreement on long-term operations, and new operations must begin October 1, 2026. | R | S2 §1 | 2026-08 | Primary. |
| C20 | Reclamation said both Lake Powell and Lake Mead hit record lows in the weeks before Aug 21, 2026. | R | S1 | 2026-08-21 | Not used in the script. **I could not pin a record-low elevation:** a search snippet gave 3,517.97 ft on Aug 31 but S4 shows lower values in September (3,517.67 on Sept 28), so I did not use that number. |
| C21 | The seven Colorado River Basin states are split by the Compact into the States of the Upper Division (Colorado, New Mexico, Utah, Wyoming) and the States of the Lower Division (Arizona, California, Nevada). | R | S10 (Compact Art. II(c) and (d)); S5 agrees for the Upper Division | 1922 | **Confirmed against the Compact:** Art. II(c) "The term 'States of the Upper Division' means the States of Colorado, New Mexico, Utah, and Wyoming."; Art. II(d) "The term 'States of the Lower Division' means the States of Arizona, California, and Nevada." **Terminology flag:** Art. II(f) and (g) define "Upper Basin" and "Lower Basin" *geographically* (parts of Arizona and New Mexico are in both), which is why the map uses "Division" for whole-state colours. The 2026 press release (S1) says "Lower Basin States" for the same three states; S3 says "Lower Division States". The script keeps S1's wording in the Beat 4 sentence it quotes and uses "Division" for the map. |
| C23 | If the Most Probable 24-Month Study projects Lake Mead below 1,010 feet at any time in the next 12 months, the Secretary consults and coordinates with the Basin States and Tribes on potential actions. | R | S3 §5.3.A.4 | 2026-08 | Primary; found by the independent check. Nearer trigger than the 1,000 ft in C17. |

C12 and C22 (percentage cuts and the earlier per-state shares) were removed on 2026-10-02 at Harvey's request; the other IDs are unchanged so the script tags still match.

Counts: 21 rows, 1 Inference (C7), 0 Background, 20 Reported.

---

## Geometry — where each map feature came from

All coordinates are `[longitude, latitude]`. File: `src/reels/lake-powell-data.geojson`.
The same data is pasted into `src/reels/lake-powell.html` (the reel is a
standalone page, like the others).

| Feature | Source | Method / flags |
|---------|--------|----------------|
| 7 state polygons (AZ, CA, NV, CO, UT, NM, WY) | S7, Census `cb_2023_us_state_500k` | **Not traced.** Official boundaries, simplified to 0.01° (about 1 km) with a Douglas–Peucker pass so the page stays small; California's small offshore islands dropped. Census coordinates are NAD83, treated as WGS84 (difference is about a metre). |
| Lake Powell, Lake Mead polygons | S8, Natural Earth 10m lakes | **Not from the named sources** (Reclamation's page has numbers, no outlines; Census has no lakes). Natural Earth is a public-domain 1:10 million dataset, so the outlines are generalized and show **full-pool shape, not today's lower shoreline**. |
| Glen Canyon Dam, Hoover Dam points | S9, OpenStreetMap (© OpenStreetMap contributors, ODbL) | **Not from the named sources.** One point each, rounded to 4 decimals: Glen Canyon Dam [-111.4842, 36.9371], Hoover Dam [-114.7375, 36.0157]. They agree with Wikipedia's coordinates within about 50 m (two independent sources; an independent check also matched them). Checked by code against the reservoir polygons and state boundaries. |
| Glen Canyon Dam note | | The point is about 1.1 km from the nearest vertex of the generalized Powell outline, so it can look detached from the lake. |
| State label positions (AZ, CA, NV, Upper Division) | Chosen by hand | **Estimated.** Display positions only; each is checked by code to fall inside the right state. |

Nothing in the geometry was traced by eye from an image.

### Code checks run (2026-10-02)

See the "Independent check" section at the end of this file for results.

---

## Independent check

A separate agent with no access to the drafting re-opened the sources and checked the script, GeoJSON and this record. No wrong number was found. It raised these, all addressed in the script and ledger above:

1. Opening on "28 feet" alone favoured the reassuring reading while the closer used "eight feet above the target". Beat 1 now states that rules aim for 3,510.
2. Beat 7 used a stale future tense for the Oct 1 water year start. Now "In August, Reclamation projected...".
3. The per-state "before" amounts behind the percentages have no opened source. Added C22 (Background, flagged); script says "by our calculation".
4. Mead's nearer trigger is 1,010 ft (S3 §5.3.A.4). Added C23; Beat 4 reworded; "the record" spelled out.
5. "Only voluntary contributions" overstated the Upper Basin position. Reworded to what these documents require.
6. Sept 30 levels are unchecked daily data. Narration says "By Reclamation's September 30 numbers"; refresh before posting.
7. Jargon (acre-foot, power pool, Lower/Upper Basin, water year). Partly glossed; rest listed for Harvey in the script's fact-check notes.
8. Citation gaps (C1 on Beat 7; "below" wording in C4). Fixed.
9. Map caveats (dam point 1 km off generalized outline; states coloured whole though AZ and NM straddle both basins). Documented; not changed.

Code checks (valid GeoJSON, closed rings, bounding boxes, lon/lat signs, state extents, dams and labels by point-in-polygon, arithmetic) passed in both my run and the independent run.

### Changes made after the check and Harvey's review (2026-10-02)

- Item 3 above (unsourced "before" shares) is now moot: the percentage figures
  and rows C12 and C22 were removed.
- Item 1 (framing) is resolved differently from the first fix: the reel now opens
  on the 8 ft to the 3,510 target and shows the 3,500 and 3,490 lines beneath it.
- Item 9 (Basin/Division colouring): the legend now says "Upper Division states"
  and "Lower Division states", confirmed against the Compact (C21, S10).
- Mead beat dropped from the main script (the shorter cut); C15, C17 and C23 stay
  in the ledger for reference.
- Dam coordinates switched to OpenStreetMap (S9). The code checks (valid GeoJSON,
  bounding boxes, point-in-polygon, extents) were re-run on the final file and pass.


---

## Independent check — slides (2026-10-03)

A separate agent with no access to the drafting re-read `src/posts/lake-powell/slides.md` against this record and re-opened S1 (summary only), S2, S3 and S10; it could not read the Sep 30 row of S4 (the fetch returned October rows), so C3's 3,518.08 ft still rests on this ledger. No wrong number. It raised, and the slides were changed:

1. "Try to hold" was softer than S3 ("initially seeking", a minimum maintained through March). Now "aim to keep" (slide 3, caption).
2. Present-tense "is 8 feet above" on an undated first caption sentence. Slide 1 now says "was"; the caption opens "As of September 30, 2026, ...".
3. The legend "Voluntary only" could read as stronger than C14 ("no mandatory cut in these documents", 2027-2028). Now "No required cut"; the caption keeps "Reclamation's documents require no cut".
4. The slide 7 amounts had no unit. The legend now reads "2027-28 cut (acre-feet)".

Noted, not changed: "Consultation level" is the site's label for the 3,500 ft line (C6); slide 5 says "at this level" per S2 fn 3 (S3 says "below"); the full-pool caveat is only on the closing slide (also in the closing source line); the cover kicker "Colorado River" cites C1 but makes no claim. Refresh C3 from S4 before posting.
