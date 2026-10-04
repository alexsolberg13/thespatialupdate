# Source record — SNAP cost share reel

**Slug:** `snap-cost-share` (format: reel only; no story folder)
**Built:** 2026-10-04. Branch `claude/story-snap-cost-share`.
**Status:** Draft for Harvey's review. Nothing here is published until the report says so.
**Question the reel answers:** Which states are over the 6% SNAP error line that sets what each state pays toward benefits from fiscal 2028?

Type key: **R** Reported (traces to a URL that was opened) · **B** Background
(general knowledge) · **I** Inference (a connection the sources did not make; counts and arithmetic on sourced numbers count).

---

## What changed from the pitch (read this first)

1. **USDA's own table was opened after all.** usda.gov and fns.usda.gov refuse requests, but fna.usda.gov opens with a browser User-Agent. The state table in this reel was first taken from a third-party dataset (S4); on 2026-10-04 **all 53 rows were compared with USDA's own FY2025 table (S8) and match exactly** (rate, overpayment, underpayment). The reel's rates now rest on S8.
2. **Two beats added at Harvey's request (2026-10-04): what the rate measures (C2, C21) and what it leaves out (C22, C23).** The list of things the rate does not capture is the Food Research and Action Center's (via Grocery Dive); it is attributed on screen.
3. **"41 states and D.C." is a count I made on that table** (C11). Grocery Dive says "all but 10 states" are over 6%. The table has 10 jurisdictions under 6% only if the Virgin Islands is counted with the nine states, so the two agree once territories are counted. That reconciliation is my inference.
4. **The delay for the highest rates is vaguer than the pitch.** The pitch did not mention it. Sources disagree on its length (C13), so the reel says only "extra time".
5. **Alaska and Hawaii are on the map in their real positions.** At Harvey's request (2026-10-04) beats 1, 2, 3, 4 and 6 are centred on the continental US, so Alaska is cut off at the top left and Hawaii is off screen on those beats (both are still counted and coloured). Beat 5 zooms out to show Alaska.
6. **The pitch's "6% line" is a threshold, not a bill.** No dollar amount is claimed. The third-party dataset also carries a modelled "penalty liability" in dollars; **not used** (no primary source).

---

## Sources opened

| ID | Source | URL | Date | How opened |
|----|--------|-----|------|-----------|
| S1 | USDA press release "USDA Announces FY 2025 State Payment Error Rates in SNAP", as reprinted by Grant County Beat (the USDA page itself returned 403) | https://www.grantcountybeat.com/nm-news/non-local-news-releases/usda-announces-fy-2025-state-payment-error-rates-in-snap | 2026-06-24 | Raw HTML downloaded, text read. A reprint of the release, so the release text is primary but this copy is secondary. The state table in the release is not in this copy. |
| S2 | Grocery Dive, "SNAP payment error rates remain too high, USDA says" | https://www.grocerydive.com/news/usda-snap-error-rates-states/823964/ | 2026-06-29 | Raw HTML downloaded, text read |
| S3 | Baseline Policy Brief, "Chart of the Week: Food Stamp Payment Error Rates" (Matthew Dickerson) | https://baselinepolicy.substack.com/p/chart-of-the-week-food-stamp-payment | 2026-06-29 | Raw HTML downloaded, text read |
| S4 | Joel McClurg, "SNAP Payment Error Rates (FY2025)" page and its data file (`data/snap-data.csv`, 53 rows: 50 states, D.C., Guam, Virgin Islands). Says "Data: USDA FNS, Census, USDA ERS". Third-party, not USDA. | https://snap-per.joelmcclurg.ai/ and https://snap-per.joelmcclurg.ai/data/snap-data.csv | page dated 2026-06-24 | Both downloaded; the CSV was parsed. Internal check: over + under equals the rate (within 0.02) on every row. |
| S5 | Brookings, "The SNAP state cost-shift policy leaves the program's existence to chance" | https://www.brookings.edu/articles/the-snap-state-cost-shift-policy-leaves-the-programs-existence-to-chance/ | undated in the fetch | **Fetched through a summarising tool**; the quotes below are what it returned. |
| S6 | Ballotpedia, "USDA releases SNAP error rate data that could determine states' share of benefit costs" | https://news.ballotpedia.org/2026/07/13/usda-releases-snap-error-rate-data-that-could-determine-states-share-of-benefit-costs/ | 2026-07-13 | **Fetched through a summarising tool** |
| S8 | **USDA Food and Nutrition Administration, "Supplemental Nutrition Assistance Program: Payment Error Rates, Fiscal Year 2025" (PDF table, dated June 24, 2026)** | https://www.fna.usda.gov/sites/default/files/resource-files/snap-qcfy25-per.pdf (linked from https://www.fna.usda.gov/snap/qc/per) | 2026-06-24 | Downloaded with a browser User-Agent; text extracted with `pdftotext` and read. **Primary.** |
| S9 | USDA FNA, "SNAP Quality Control - Error Tolerance Threshold" | https://www.fna.usda.gov/snap/qc/ett | page updated 2025-11-24 | Raw HTML read. **Primary.** FY2025 threshold $57, FY2026 $58. |
| S10 | USDA FNA newsroom, release USDA 0082.26 (the release S1 reprints) | https://www.fna.usda.gov/newsroom/usda-0082.26 | 2026-06-24 | Raw HTML read. **Primary.** |
| S7 | Census Bureau cartographic boundary file `cb_2023_us_state_500k` (state boundaries) | https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_state_500k.zip | 2023 vintage | Downloaded, read with a shapefile reader |

Also seen, not relied on: SavorSNAP FY2024 table (https://www.savorsnap.org/snap-payment-error-rates-by-state-map, opened through the summarising tool; it is last year's data, FY2024); search-result summaries listing FY2025 rates for Illinois, Oregon, Iowa, Kentucky, Nebraska, Utah, Vermont and Wisconsin (they match S4 but were not on a page I opened).

## Could not open - Harvey to check

- **USDA press release on usda.gov** https://www.usda.gov/about-usda/news/press-releases/2026/06/24/usda-announces-fy-2025-state-payment-error-rates-snap : HTTP 403 (the same release opened on fna.usda.gov, S10).
- **fns.usda.gov SNAP QC pages** : HTTP 403 through the fetch tool. The same pages open on fna.usda.gov (S8 to S10).
- **Newsweek map** https://www.newsweek.com/map-shows-snap-benefit-error-rates-in-each-state-12285784 : empty response.
- **WLOS** https://wlos.com/... was read earlier in the session through the fetch tool only for the North Carolina county cost; **no claim from it is used**.

**No claim comes from any page that would not open.**

## Harvey to verify

1. ~~The whole state table against USDA's table~~ **Done 2026-10-04: all 53 rows match S8.**
2. **Nevada 6.22%** (just over the 6% line, USDA table) and **Colorado 10.09%, Louisiana 8.14%, Indiana 9.77%, Michigan 9.89%, North Dakota 9.89%** (near a tier edge). A rounding difference moves a state one colour.
3. **The delay rule for 13.33% or higher** (C13): exact start year and the "requirements".
4. **Whether the statute says "at or above 6%" or "over 6%"** (S1 says "at or above"; S2 says "over 6%"). No state is exactly 6.00% in S4, so the map is the same either way.

---

## Claim ledger

**Cut from the reel 2026-10-04 to shorten it (rows kept for reference, not on screen or in the script):** C10 (nine states under 6%), C12 (seven places at 13.33% or higher), C13 (extra time for the highest rates), C24 and the 1.33 underpayment figure in C21 (no longer said), plus the delayed-start and under-6% beats. They can come back.

| ID | Claim as written | Type | Source | Date | Support / flags |
|----|------------------|------|--------|------|-----------------|
| C1 | USDA released the FY2025 state SNAP payment error rates on June 24, 2026. | R | S1; S2 ("released Wednesday", published June 29); S6 | 2026-06-24 | S1 is a reprint dated Jun 24, 2026. Not on screen except the chip "FY2025 rates". |
| C2 | USDA says the payment error rate measures how accurately states determine who is eligible for SNAP and how much they should receive. Overpayments and underpayments both count. | R | S10 and S9 ("measures how accurately SNAP state agencies determine a household's eligibility and benefit amount"); S2 ("counts both over- and underpayments"); S8 (columns for over and under payments) | 2026-06 | S1, S2 and S4 agree; S4's wording is the closest to "share of benefit dollars". Script and screen do not call it fraud. |
| C3 | The national FY2025 payment error rate is 10.62%. | R | S8 (United States row); S10; S2; S3 | 2026-06-24 | Not on screen; not in the script after the cut. Kept for reference. |
| C4 | The state share of benefit costs is zero below a 6% error rate, 5% from 6% to under 8%, 10% from 8% to under 10%, and 15% at 10% or higher. | R | S5 (quote: "Zero percent of benefits if the error rate is below 6 percent, 5 percent if it is between 6 and 7.99 percent, 10 percent if it is between 8 and 9.99 percent, and 15 percent if it 10 percent or higher"); S2; S1 ("5%, 10%, or 15%", "at or above the 6% threshold"); S6 | 2026-06 | S2 words the middle tier "between 8% and 10%" and the first as "over 6%". The map and reel use S5's exact edges. No state sits exactly on 6, 8 or 10 in S4 (closest: Nevada 6.22, Louisiana 8.14, Colorado 10.09). |
| C5 | The cost share begins in federal fiscal year 2028, which begins October 1, 2027. | R | S2; S1 ("in most cases, as soon as October 1, 2027"); S5 ("Starting in October 2027, states potentially will be required") | 2026-06 | Script says "as soon as October 2027". |
| C6 | For fiscal 2028 a state can use either its FY2025 or its FY2026 error rate. | R | S2; S3; S5; S6 | 2026-06 | Four sources agree. |
| C7 | The state error rates shown (FY2025), for example South Dakota 2.47%, Idaho 3.85%, Wyoming 3.96%. | R | **S8 (USDA table, all 53 rows)**; S4 and S3 agree | 2026-06-24 | S4 (third-party CSV) matches S8 on every row. S3 confirms 8 values. |
| C8 | Alaska has the highest FY2025 error rate, 23.15%. | R | S3; S4 | 2026-06-24 | Also in search summaries. |
| C9 | Washington, D.C. is at 18.66% and New Mexico, the next state, is at 16.81%. | R | S3 (AK 23.15, D.C. 18.66, NM 16.81, DE 16.00, GA 15.21); S4 | 2026-06-24 | "Next state" is true of S4: after Alaska, the highest state rate is New Mexico 16.81 (D.C. is not a state). |
| C10 | Nine states are under 6%: Idaho, Iowa, Kentucky, Nebraska, South Dakota, Utah, Vermont, Wisconsin, Wyoming. | I | counting rows of S4 (value under 6.00) | 2026-06-24 | Counting, not reported by any source I opened. S3 confirms ID, SD, WY are low; the other six rest on S4 (five also in search summaries). |
| C11 | 41 states and Washington, D.C. had FY2025 error rates above 6%. | I | counting rows of S4 (41 states over 6.00 plus D.C.) | 2026-06-24 | **Counting.** S2 says "all but 10 states"; the S4 table has 10 jurisdictions under 6% only if the Virgin Islands is included, so the reel counts 50 states plus D.C. and the numbers agree. A search-result summary also reads "41 states and D.C." (not opened). |
| C12 | Seven places are at 13.33% or higher: Alaska 23.15, D.C. 18.66, New Mexico 16.81, Delaware 16.00, Georgia 15.21, Illinois 14.67, Oregon 14.14. | I | S4 values against the 13.33% threshold in S3 and S5 | 2026-06-24 | Counting on S4. Next highest is Florida 12.97. S3 footnote: the threshold is where the rate times 1.5 equals or exceeds 20%, "which rounds to 13.33%". |
| C13 | The law gives states with the highest error rates extra time before they start paying, if they meet certain requirements. | R | S2 ("states with the highest error rates that meet certain requirements will get additional time"); S5 ("a temporary exception in the first two years ... states with ... 13.33 percent or higher will not be required to contribute"); S3 ("no cost share is required until FY 2029" at 13.33% or higher) | 2026-06 | **Sources differ on the length** (S3 fiscal 2029 start; S5 first two years). The reel says "extra time" only. |
| C14 | States at or above 6% must also file a corrective action plan with USDA. | R | S1; S2 | 2026-06 | Not used on screen or in the script. |
| C15 | The federal government spent $102 billion on SNAP in fiscal 2025. | R | S2 | 2026-06 | Not used. |
| C21 | Nationally, 9.28 points of the 10.62% FY2025 error rate are overpayments and 1.33 points are underpayments. | R | S8 (United States row); S3 | 2026-06-24 | 9.28 + 1.33 = 10.61; S8's footnote says rounding can make the rate differ from the sum. Screen says "9.28 of 10.62 points are overpayments". |
| C22 | Errors of $57 or less are not counted in the FY2025 error rate (the quality control tolerance threshold). | R | S9 (FY2025 $57, PM 24-02); S8 footnote 1; S3 | 2025-11 / 2026-06 | Primary. The threshold is $58 for FY2026 (S9). |
| C23 | The Food Research and Action Center says the error rate does not take into account barriers to participation, case-processing speed or program abuse. | R | S2 ("Error rates do not take into account factors such as barriers to participation, case-processing speed or program abuse that are also gauges of SNAP effectiveness", attributed to the Food Research and Action Center, a nonprofit focused on poverty-related hunger) | 2026-06-29 | **Attributed, never in the reel's own voice.** One source, secondary: FRAC's own page was not opened for this wording. |
| C24 | Federal fiscal year 2025 ended September 30, 2025. | R | S2 ("the federal government spent $102 billion on SNAP in fiscal 2025 ... which ended Sept. 30, 2025") | 2026-06-29 | Primary dates; plain calendar fact. |
| C16 | (Removed before drafting: a North Carolina county cost figure that came only from a page read through the summarising tool.) | | | | ID not reused. |
| C17 | USDA is likely to release the FY2026 error rates in June 2027. | R | S5 ("information that will likely be released in June 2027") | | Single source, through the summarising tool, and "likely". Script says "will likely". |
| C18 | SNAP is the food stamp program (the Supplemental Nutrition Assistance Program). | B | S1 spells out the name; S3 uses "Food Stamp program" | | General knowledge. |
| C19 | Alaska's rate (23.15%) is nearly four times the 6% line. | I | arithmetic on C8 and the 6% line: 23.15 / 6 = 3.86 | 2026-06-24 | Arithmetic. A search summary says "nearly four times" (not opened). |

Counts: 22 rows in use (C16 removed), 4 Inference (C10, C11, C12, C19), 1 Background (C18), 17 Reported.

---

## Geometry — where each map feature came from

All coordinates are `[longitude, latitude]`. File: `src/reels/snap-cost-share-data.geojson`. The same data is pasted into `src/reels/snap-cost-share.html`.

| Feature | Source | Method / flags |
|---------|--------|----------------|
| 50 states and D.C. (51 polygons) | S7, Census `cb_2023_us_state_500k` | **Not traced.** Official boundaries. Simplified with a Douglas-Peucker pass (0.05 degrees, about 5 km; D.C., Delaware and Rhode Island 0.003). Outer rings only (lakes and holes are not drawn). Islands smaller than 0.08 square degrees dropped. Alaska's Aleutian pieces east of 180 degrees (positive longitude) dropped because they cross the antimeridian. Each state carries its FY2025 rate (`per_2025`, from S4) and tier (0, 5, 10, 15). Territories are not drawn. |
| D.C. ring | Point at [-77.037, 38.907] | **Estimated display position** (D.C. is too small to see at this zoom). Checked by code to fall inside the Census D.C. polygon. |
| Label anchors (AK, NM, OR, IL, GA, SD) | Chosen by hand | **Estimated.** Display positions only; each is checked by code to fall inside its own state. |
| Label anchors (DE, DC) | Chosen by hand | **Deliberately offshore** (Atlantic) so the two small labels do not sit on top of each other. |

Nothing in the geometry was traced by eye from an image.

### Code checks run (2026-10-04)

- GeoJSON parses; 51 state polygons; every ring closed.
- Longitude and latitude boxes: every state inside [-180, -66] by [18, 72] (catches lat/lon swaps).
- Each hand-placed label anchor falls inside its own state (AK, NM, OR, IL, GA, SD); DE and DC anchors are offshore by design; the D.C. ring point is inside D.C.
- Each polygon's `per_2025` equals the S4 value, and S4 equals the USDA table S8 on all 53 rows (rate, over, under); tiers recomputed from the rate edges in C4 match S4's own tier column for all 53 rows.
- Counts recomputed: 20 jurisdictions in the 15% tier (19 states and D.C.), 16 at 10%, 6 at 5%, 9 at 0% (51 jurisdictions).
- Reel: `check-reels` (see the report for whether the basemap was stubbed).

---

## Independent check (2026-10-04)

A separate agent with no access to the drafting re-opened S1 to S6 (raw text, USDA pages skipped for the 403), recounted the GeoJSON and checked every number. **No wrong number found.** "41 states and D.C." holds (42 jurisdictions at or above 6%); the nine under-6 states, the seven at or above 13.33% and every state's rate and tier match S4; eight rates are confirmed in S3. It noted S5 opens as raw text (the dossier said summary only). It flagged:

1. The "extra time" sentence (C13): length disputed between sources, and S5 ties the exception to 13.33% "in FY2025 or FY2026", so being at 13.33% in FY2025 does not prove all seven get it. Script keeps "if they meet certain requirements"; on-screen text says "can get".
2. "On these numbers they'd pay nothing": firm only for FY2025 rates; the hedge "on these numbers" stays, and beat 6 says a state can use its 2026 rate.
3. Title "Payments start in fiscal 2028" is firmer than "as soon as" (C5) and a state at 13.33% or more may start later. **Not changed; Harvey to decide.**
4. Newcomer gaps (not changed, no sourced sentence available): the rate is not fraud, "fiscal 2028" is not explained in the narration, "who pays today" is never said, 13.33% is unexplained on screen.

Voice pass, lines listed and what was done: beat 2 title "Higher error rate, bigger share" is now "States pay more at higher error rates"; beat 5 title "stay under" is now "are under"; beat 6 sub "FY2025 or FY2026" is now "2025 or 2026"; beat 2 narration fragment and list rewritten as two plain sentences; beat 3 "the line" is now "the 6 percent threshold"; beat 6 "These are fiscal 2025 numbers" and the closing "So the map can still change" removed (the reel now ends on the June 2027 fact). Not changed: legend labels "6-8%: 5%" (the longer wording the check suggested overflows into the blocked corner), beat 4 title "places" (D.C. is not a state), beat 4 kicker "Delayed start".

### Independent check of the added beats (2026-10-04)

A separate agent re-opened the USDA table (S8), the tolerance page (S9), the USDA release (S10) and Grocery Dive (S2) as raw text. All numbers confirmed: 41 states and D.C. above 6% (nine states at or under, Grocery Dive's "all but 10" includes the Virgin Islands at 5.36), 9.28 / 1.33 / 10.62 (sum 10.61, rounding per the table's footnote 2), $57 for FY2025 ($58 for FY2026), USDA's "how accurately" wording, and the Food Research and Action Center attribution. Nothing unsupported. It noted: the beat 3 kicker "What it leaves out" implies a full list while the source says "factors such as" (kept, attribution stays on screen); "$57" in the narration is not tied to FY2025 in words (the "FY2025 rates" chip is on screen); "food stamp" appears on none of the four pages (C18 is Background). Voice lines listed and changed: beat 1 narration now explains fiscal 2025; beat 2 narration split into two shorter sentences; beat 3 narration split into two sentences; beat 3 sub "Per the Food Research and Action Center" is now "Food Research and Action Center says". Not changed: the kicker; the beat 1 rewrite that would bury the number after SNAP.
