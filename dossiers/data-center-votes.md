# Source record — Data center votes reel

**Slug:** `data-center-votes` (format: reel only; no story folder)
**Built:** 2026-10-04. Branch `claude/story-data-center-votes`.
**Status:** Draft for Harvey's review. Nothing here is published until the report says so.
**Question the reel answers:** What did five local governments decide about data centers between September 28 and 30, 2026, and where are they?

Type key: **R** Reported (traces to a URL that was opened) · **B** Background · **I** Inference (counting, arithmetic or grouping of sourced facts).

---

## What changed from the pitch (read this first)

1. **The pitch's first source was a newsletter roundup** (Strisker, S1). Its links to the underlying reports were stripped from the copy I could read, so the reel rests on **local reports opened for each town**, not on the roundup. The roundup is used only to find the week's decisions.
2. **Three places in the pitch's list were dropped:**
   - **Edgewater, Florida:** the pitch and the roundup put the ban in this week. Fox 35 (opened) is dated **September 14, 2026**, so it is not one of the September 28 to 30 votes.
   - **Posey County, Indiana:** my first search listed an Amazon data center "approved" there on October 1. Later local reporting says that report was **wrong**: the Area Plan Commission only sent proposed rules to the county commissioners, and no data center has been approved. Not used.
   - **Warren County, Ohio:** seen only in the roundup and search summaries (the Tribune Chronicle story I opened is about the city of Warren, a different place and a one-year moratorium). Not used.
3. **Added:** Palm Springs, California (pause extended September 30) and Mercer County, Kentucky (zoning rejected September 28), each with two local reports. The set is **five votes**: two approvals, a ban, a pause and a rejected zoning change.
4. **The map is five pins, not geometry.** There is no project boundary data. Pins mark the place whose body voted (city, township or county centre), not the exact project site. Site-level coordinates exist only in trackers I did not open, and the sources give streets, not parcels, so none were used.
5. **"Rejected" in Mercer County is a zoning rule, not a project:** no specific data center had been proposed at the site (C12).

---

## Sources opened

| ID | Source | URL | Date | How opened |
|----|--------|-----|------|-----------|
| S1 | Strisker, "Data Centers: Weekly Briefing // September 28 - October 1, 2026" (newsletter roundup, used only to find decisions) | https://writing.strisker.com/data-centers-weekly-briefing-september-28-october-1-2026/ | 2026-10-02 | Raw HTML read |
| S2 | Cap City News (Cheyenne), "Cheyenne approves 1,260-acre Cox Ranch addition after final vote" | https://capcity.news/news/2026/09/28/cheyenne-approves-1260-acre-cox-ranch-addition-after-final-vote/ | 2026-09-28 | Raw HTML read |
| S3 | Cowboy State Daily, "Data Center Critics Angry As Cheyenne Council OKs Another Data Center Annexation" | https://cowboystatedaily.com/2026/09/29/cheyenne-approves-another-annexation-for-data-center-during-contentious-meeting/ | 2026-09-29 | Raw HTML read |
| S4 | Audacy WILK, "Kline Township Supervisors Vote Unanimously to Approve Amazon Data Center Project" | https://www.audacy.com/wilknews/news/local/kline-twp-approves-data-center | undated on page (vote "Wednesday") | Raw HTML read |
| S5 | WNEP via Yahoo, "Kline Township supervisors vote to approve Amazon data center project in Schuylkill County" | https://www.yahoo.com/news/articles/kline-township-supervisors-vote-approve-024412471.html | posted 2026-10-01 02:44 UTC | Raw HTML read (WNEP's own page returned 403) |
| S6 | Atlanta News First, "City of Lovejoy passes ordinance banning data center construction" | https://www.atlantanewsfirst.com/2026/09/29/city-lovejoy-passes-ordinance-banning-data-center-construction/ | 2026-09-29 | Raw HTML read |
| S7 | Atlanta Journal-Constitution, "How one Georgia city went from considering a data center to banning them" | https://www.ajc.com/business/2026/10/lovejoy-data-center-ban/ | 2026-10-02 | Raw HTML read. The page also contains a block of reversed, scrambled text (a scraping guard); it was ignored. |
| S8 | WEKU, republishing Kentucky Lantern, "Mercer County officials reject regulations to allow data centers next to coal-fired power plant" | https://www.weku.org/the-commonwealth/2026-09-30/mercer-county-officials-reject-regulations-to-allow-data-centers-next-to-coal-fired-power-plant | 2026-09-30 | Raw HTML read |
| S9 | Harrodsburg Herald, "Mercer County Fiscal Court Denies Data Center Ordinance" | https://www.harrodsburgherald.com/2026/09/30/mercer-county-fiscal-court-denies-data-center-ordinance/ | 2026-09-30 | Raw HTML read |
| S10 | KESQ, "Palm Springs City Council approves extending data center moratorium" | https://kesq.com/news/2026/09/30/palm-springs-city-council-approves-extending-data-center-moratorium/ | 2026-09-30 | Raw HTML read |
| S11 | NBC Palm Springs, "Palm Springs Extends Data Center Ban Nearly Two Years" | https://www.nbcpalmsprings.com/local-and-community/2026/10/01/palm-springs-extends-data-center-ban-nearly-two-years | 2026-10-01 | Raw HTML read |
| S12 | Fox 35 Orlando, "Edgewater approves ban on AI data centers as Orange County weighs moratorium" (used only to date the Edgewater vote) | https://www.fox35orlando.com/news/edgewater-approves-ban-ai-data-centers-orange-county-weighs-moratorium | 2026-09-14 | Raw HTML read |
| S13 | Census Bureau Gazetteer files 2023: places, county subdivisions, counties | https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_place_national.zip (and `..._cousubs_national.zip`, `..._counties_national.zip`) | 2023 | Downloaded, read. Place centroids: Cheyenne city 41.12727, -104.79022; Lovejoy city 33.441519, -84.317444; Palm Springs city 33.803361, -116.53828; Kline township 40.878534, -76.050441. |
| S14 | (No longer on the map; looked up 2026-10-04 and replaced by the county centre) OpenStreetMap way 449254194 "E.W. Brown Generating Station" via Nominatim. © OpenStreetMap contributors, ODbL. | https://nominatim.openstreetmap.org/search?q=E.W.+Brown+Generating+Station+Kentucky&format=json | 2026-10-04 | API response read: 37.7906366, -84.7123496 |
| S15 | Census state boundaries (the 51-polygon file already in this repo, `src/reels/snap-cost-share-data.geojson`, from `cb_2023_us_state_500k`) | https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_state_500k.zip | 2023 | Used only to check each pin falls in the right state |

## Could not open - Harvey to check

- **TriState Homepage** (Posey County, Indiana) https://www.tristatehomepage.com/news/local-news/posey-county/commissioners-unanimously-approve-data-center-in-posey-county/ : HTTP 403. **Not used.** Its claim was later contradicted by local reporting seen in search results (the Yahoo copy of "Area Plan Commission unanimously approves data center in Posey County" says a correction), which I did not open.
- **WNEP's own page** (Kline Township): HTTP 403. The same story was opened on Yahoo (S5).
- **Kentucky Lantern's own page** (Mercer County): HTTP 403. The same story was opened on WEKU (S8).
- **LEX 18** (Mercer County): SSL error. Not used.

**No claim comes from any page that would not open.**

## Harvey to verify

1. **Kline vote date (September 30).** S4 and S5 say "Wednesday" at a special meeting; neither page shows the meeting date. September 30, 2026 is a Wednesday and S5 was posted at 02:44 UTC on October 1 (the evening of September 30 in Pennsylvania).
2. **Palm Springs end date (August 25, 2028).** It is in the caption text on S11's page and in search summaries; the article body (S11) says "22 months and 15 days" and "two years" in total. 22 months and 15 days after October 10, 2026 is August 25, 2028.
3. **Lovejoy's $1 billion** is S7 only. S6 gives the size (3.5 million square feet, 15 buildings, 1.25 gigawatts) but no dollar figure.
4. **Cheyenne's counts (ten operating, five under construction, nine in development)** are S3 only.
5. **Cox Ranch acreage.** 1,259.91 acres in S2; the reel says "1,260".
6. **Withdrawal month (Lovejoy).** S6 says Stillwater withdrew "last month" (an article published September 29, so August). An August 9 headline from the same outlet appeared in search results (not opened).

---

## Claim ledger

| ID | Claim as written | Type | Source | Date | Support / flags |
|----|------------------|------|--------|------|-----------------|
| C1 | Five local governments voted on data centers between September 28 and 30, 2026: Cheyenne (Sept 28), Lovejoy (Sept 28), Mercer County (Sept 28), Kline Township (Sept 30), Palm Springs (Sept 30). | I | counting C2, C5, C9, C11, C14 | 2026-09-28 to 09-30 | **Counting.** The five were chosen from the roundup (S1) and checked against local reports; other votes that week exist (S1 lists more) and are not in the reel. |
| C2 | Cheyenne's city council voted 8 to 2, on third and final reading on Monday September 28, to annex the 1,259.91-acre Cox Ranch (and zone it Business Park) for a data center. | R | S2; S3 | 2026-09-28 | S2 and S3 agree on the vote and acreage. Reel says "about 1,260 acres". |
| C3 | SkyBox Data Centers and ViaWest Group are buying Cox Ranch and intend to develop a data center there. | R | S2; S3 ("Skybox Datacenters") | 2026-09-28 | Company name spelled "SkyBox Data Centers" in S2 and "Skybox Datacenters" in S3; reel uses S2. |
| C4 | Cheyenne has ten data centers operating, five under construction and nine in development. | R | S3 | 2026-09-29 | **Single source.** Not independently counted. |
| C5 | Kline Township's supervisors voted unanimously, at a special meeting on Wednesday (September 30), to approve Amazon's 350-acre data center campus near Route 309 and Interstate 81. | R | S4; S5 | 2026-09-30 | See "Harvey to verify" 1 for the date. S4 adds about two million square feet of data center buildings plus 500,000 square feet of administrative and support space. |
| C6 | The approval adds conditions: pre- and post-blasting structural surveys on nearby homes and post-construction acoustic testing. | R | S4; S5 (blast surveys and a 60-decibel monitoring survey) | 2026-09-30 | S4 says the supervisors adopted the planning commission's conditional recommendations; residents said more restrictions were not required. |
| C7 | Amazon must still obtain township zoning permits and state environmental clearances before breaking ground. | R | S4 | 2026-09-30 | Single source. |
| C8 | A $1 billion data center plan near two schools in Lovejoy, Georgia, was withdrawn (Stillwater Development withdrew its application in August). | R | S7 ($1 billion, "withdrawn"); S6 (3.5 million sq ft, near two schools, application withdrawn "last month") | 2026-09-29 / 10-02 | See "Harvey to verify" 3 and 6. |
| C9 | On Monday September 28 Lovejoy's city council approved an ordinance banning data centers in the city. | R | S6 ("on Monday approved"); S7 ("last week updated the zoning code ... explicitly prohibiting data centers") | 2026-09-28 | S6 is dated September 29, so "Monday" is September 28. |
| C10 | The developers are pursuing a residential project for the Lovejoy site, according to the mayor. | R | S6 | 2026-09-29 | Attributed to Mayor Marci Fluellyn in S6. |
| C11 | On Monday September 28 Mercer County's fiscal court voted unanimously against zoning regulations that would have allowed hyperscale data centers on land next to the coal-fired E.W. Brown Generating Station. | R | S8 ("unanimous vote"); S9 ("voted to deny", Monday Sept. 28) | 2026-09-28 | S9 does not state the vote was unanimous; S8 does. |
| C12 | No specific data center proposal had emerged for the land next to the plant. | R | S8 | 2026-09-30 | S8: "While no specific data center proposal has emerged to be located adjacent to the coal-fired power plant". |
| C13 | The rejected regulations go back to the Harrodsburg-Mercer County planning and zoning commission. | R | S8; S9 | 2026-09-30 | |
| C14 | On Wednesday September 30 Palm Springs' city council voted unanimously to extend its moratorium on data center applications and permits, through August 25, 2028. | R | S10 (Wednesday, unanimous); S11 (extension 22 months 15 days; August 25, 2028 in the page's caption) | 2026-09-30 | See "Harvey to verify" 2. |
| C15 | Palm Springs has no rules on where data centers can be built, how much noise they can make, or how much power or water they can draw. | R | S11 (city staff report) | 2026-10-01 | |
| C16 | City staff say the council would lift the moratorium once the zoning code update is finished and data center rules are in place. | R | S11 | 2026-10-01 | Attributed to staff. |
| C17 | (Not used on screen.) Mercer County's one-year moratorium (passed in August) would have expired if the regulations had been adopted; with the rejection it stays. | I | S8 (the first part); the second part is my inference | 2026-09-30 | The reel does not say it. |

Counts: 17 rows (C17 not used), 2 Inference (C1, C17), 0 Background, 15 Reported.

---

## Geometry — where each map feature came from

All coordinates are `[longitude, latitude]`. File: `src/reels/data-center-votes-data.geojson`. The same data is pasted into `src/reels/data-center-votes.html`. There is **no boundary data**; the basemap (Carto dark matter) draws the states and places.

| Feature | Source | Method / flags |
|---------|--------|----------------|
| Cheyenne pin [-104.7902, 41.1273] | S13 Census Gazetteer 2023 place centroid | **Approximate for the project:** Cox Ranch is west of Roundtop Road, outside the old city limits. |
| Kline Township pin [-76.0504, 40.8785] | S13 Census Gazetteer 2023 county subdivision centroid | **Approximate for the project:** the site is near Route 309 and Interstate 81 in the township. |
| Lovejoy pin [-84.3174, 33.4415] | S13 Census Gazetteer 2023 place centroid | **Approximate for the project:** the site is on Panhandle Road (S6). |
| Mercer County pin [-84.8797, 37.8121] | S13 Census Gazetteer 2023 county centroid (Mercer County) | Changed 2026-10-04 from the E.W. Brown plant (S14) so all five pins are the place whose body voted. The plant is about 15 km east of the county centre; the rejected zoning zone is next to it (S8) and its edges are not given. |
| Palm Springs pin [-116.5383, 33.8034] | S13 Census Gazetteer 2023 place centroid | The moratorium covers the whole city. |

Nothing in the geometry was traced by eye from an image.

### Code checks run (2026-10-04)

- GeoJSON parses; five Point features; coordinates are [lon, lat] inside the continental US box (longitude -125 to -66, latitude 24 to 50).
- Each pin falls inside the right state (Cheyenne WY, Kline PA, Lovejoy GA, Mercer KY, Palm Springs CA), by point-in-polygon against S15.
- Reel: `check-reels` (see the report for whether the basemap was stubbed).

---

## Independent check (2026-10-04)

A separate agent with no access to the drafting re-opened S2 to S12 as raw text and checked every number, name, date and attribution. **No wrong number found.** Calendar days confirmed (Sept 28 is a Monday, Sept 30 a Wednesday); the Palm Springs end date holds by arithmetic (22 months and 15 days from October 10, 2026 is August 25, 2028); leaving Edgewater out is right (S12 is dated September 14). It flagged, and what was done:

1. "Two approved projects" overstated Cheyenne (annexation and rezoning, not an approved project). Beat 1 now says "Two approved a data center or the land for one."
2. The Lovejoy residential project was stated as fact; it is the mayor's statement (S6). Narration now says "The mayor says".
3. Unexplained terms: "annex", "fiscal court", "hyperscale". Narration now says "bring ... into the city" and "the fiscal court, the county's governing body" and "very large data centers"; the Cheyenne on-screen title is now "1,260 acres added for a data center".
4. The Lovejoy sentence was passive; now "the developer withdrew a $1 billion data center plan near two schools in August".
5. Green and red implied approval is good and the rest bad. Pins and legend are now blue (approved) and amber (rejected, banned or paused).
6. Pins can read as project sites. Not changed on screen; stated in the script's fact-check notes and the Geometry table.

Not changed: "Five votes in three days" (accurate, though no vote fell on the 29th); the beat 1 on-screen sub (a list, but it is a count).

### Map changes after Harvey's review (2026-10-04)

Harvey asked for the basemap labels and points to be dialed in and made consistent. Changes: the map is flat (Mercator) instead of a globe so the five places sit at one scale; every basemap name (states, cities, towns, water, countries) is hidden so no beat shows a name another does not and none sits under a pin; each beat shows only the reel's own label for its pin, as place name plus state, in the same position on every beat (above the pin; Lovejoy below; Mercer County to the left); all five pins are now the centre of the city, township or county that voted (Mercer moved from the E.W. Brown plant to the county centre); the label colours match on every beat. Code check re-run: Mercer's new point is inside Kentucky. Checked against the real basemap in a browser; `check-reels` itself still only runs with the basemap stubbed in this sandbox.

### Label placement (2026-10-04, second round)

Labels are now one line, "City, State" (for example "Cheyenne, Wyoming"), and sit beside the pin they name. Each pin has its own side, the same on every beat, chosen so no label touches another pin or label on the opening map: Cheyenne and Kline above (right-aligned), Mercer County to the left, Palm Springs and Lovejoy below. Checked in a browser against the real basemap; `check-reels` (stubbed basemap) confirms every label is inside the map window and the side margins.
