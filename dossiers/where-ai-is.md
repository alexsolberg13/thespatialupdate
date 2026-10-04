# Source record — Where AI actually is reel

**Slug:** `where-ai-is` (format: reel only; no story folder)
**Built:** 2026-10-04. Branch `claude/story-where-ai-is`.
**Status:** Draft for Harvey's review. Nothing here is published until the report says so.
**Question the reel answers:** Where do five of the biggest AI companies have their headquarters, and where are the largest AI data centers, by Epoch AI's list?

Type key: **R** Reported (traces to a URL that was opened) · **B** Background · **I** Inference (counting, arithmetic or grouping of sourced facts).

---

## What changed from the pitch (read this first)

1. **Harvey's idea, built as pitched (headquarters, then data centers, then the contrast).** The pitch said "the biggest 8 to 10 sites". The reel shows the **ten largest US sites** on Epoch's list. Two Malaysian sites (DayOne Nusajaya 473 MW, DayOne Kempas 421.7 MW) rank above some of them and are **not** on the map; the narration says so (C21).
2. **HQ list:** OpenAI, Anthropic, Google, Meta, Nvidia. Microsoft and xAI were suggested in the pitch and left out: Microsoft's headquarters (Redmond) and xAI's were not opened this session, and the rule is no claim without an opened source. Harvey can add them.
3. **Map pins are not site outlines.** The pitch's map data is a CSV of addresses with no coordinates (see Geometry). Pins are geocoded street addresses (OpenStreetMap Nominatim) or city / town centres (Census Gazetteer). Three are approximate (Meta, Nvidia, New Carlisle) and one is a nearby building (Prometheus).
4. **"Where AI actually is" is read narrowly:** headquarters versus the largest data centers. It is not a claim about where AI work is done by people, or where all AI computing is; Epoch says its list covers about 43% of global AI computing (C20).
5. **Anthropic appears in the story twice** (a headquarters, and the user Epoch lists at New Carlisle and at both Colossus sites). The reel states Epoch's attribution plainly and does not say more.

---

## Sources opened

| ID | Source | URL | Date | How opened |
|----|--------|-----|------|-----------|
| S1 | Epoch AI, "Frontier Data Centers" hub page ("93 sites", updated Oct 2, 2026; coverage estimate "43% as of October 4, 2026 (90% CI: 23% to 81%)") | https://epoch.ai/data/data-centers | 2026-10-02 (page); accessed 2026-10-04 | Raw HTML read (curl) for the 43% sentence and download links; WebFetch summary for "93 sites" and "last updated" |
| S2 | Epoch AI, main data centers CSV (93 rows; columns Name, Current H100 equivalents, Current power (MW), Owner, Users, Country, Address, ...). CC-BY (see S3). | https://epoch.ai/data/data_centers/data_centers.csv | downloaded 2026-10-04 | Downloaded, parsed in full |
| S3 | Epoch AI, data centers documentation (license: Creative Commons Attribution) | https://epoch.ai/data/data-centers-documentation | accessed 2026-10-04 | WebFetch summary |
| S4 | The San Francisco Standard, "The AI leaderboard: Where the biggest companies are in SF" (office sizes: OpenAI 1.2M sq ft, Mission Bay; Anthropic 995K sq ft, SoMa) | https://sfstandard.com/2026/04/07/i-leaderboard-san-francisco-office/ | 2026-04-07 | WebFetch summary |
| S5 | Wikipedia, "OpenAI" (infobox headquarters: 1455 and 1515 Third Street, San Francisco) | https://en.wikipedia.org/wiki/OpenAI | accessed 2026-10-04 | WebFetch summary |
| S6 | Wikipedia, "Anthropic" (500 Howard Street, San Francisco) | https://en.wikipedia.org/wiki/Anthropic | accessed 2026-10-04 | WebFetch summary |
| S7 | Wikipedia, "Googleplex" (1600 Amphitheatre Parkway, Mountain View; 37.422N 122.084W) | https://en.wikipedia.org/wiki/Googleplex | accessed 2026-10-04 | WebFetch summary |
| S8 | Wikipedia, "Meta Platforms" (infobox: Menlo Park, California) | https://en.wikipedia.org/wiki/Meta_Platforms | accessed 2026-10-04 | WebFetch summary |
| S9 | Wikipedia, "Nvidia" (infobox: Santa Clara, California) | https://en.wikipedia.org/wiki/Nvidia | accessed 2026-10-04 | WebFetch summary |
| S10 | OpenStreetMap Nominatim geocoder, one query per address. © OpenStreetMap contributors, ODbL. | https://nominatim.openstreetmap.org/ | 2026-10-04 | API responses read |
| S11 | Census Bureau Gazetteer 2023, places: Menlo Park city 37.479731, -122.148055; Santa Clara city 37.364621, -121.967973; New Carlisle town 41.706572, -86.507154 | https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_place_national.zip | 2023 | Downloaded, read |
| S12 | Census state boundaries (the 51-polygon file already in this repo, `src/reels/snap-cost-share-data.geojson`, from `cb_2023_us_state_500k`) | https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_state_500k.zip | 2023 | Used only to check each pin falls in the right state |

## Could not open - Harvey to check

- **Data Center Dynamics** (https://www.datacenterdynamics.com/en/news/vantage-breaks-ground-on-texas-gigawatt-data-center-campus-for-openai/): HTTP 403. **Not used.**
- A guessed Epoch CSV address (`.../data/generated/data_centers/data_centers.csv`) returned 404; the real download link on the hub page (S2) worked. Nothing is cited from the 404.

**No claim comes from any page that would not open.**

## Harvey to verify

1. **Office sizes (C7).** Seen only through a WebFetch summary of S4. Check the page for "OpenAI (1.2M sq ft)" and "Anthropic (995K sq ft)". The page lists several addresses per company; whether the figure means leased or occupied space is not stated in the summary, so the reel says "offices" and "sq ft".
2. **Headquarters addresses (C1 to C5)** were read through summaries of Wikipedia infoboxes (S5 to S9). Wikipedia is a secondary source; check each company's own site if you want a primary one.
3. **Epoch's "Users" tags** (Anthropic at New Carlisle "confident"; OpenAI at Fairwater Atlanta "likely"). They are Epoch's judgement, not company statements. The narration attributes them to Epoch.
4. **Owner "SpaceXAI"** for the Colossus sites is Epoch's current name for the owner. The reel and script just say "Colossus". Check the name if you add one.
5. **Colossus 2 sits on the Tennessee / Mississippi line.** Epoch's address is in Memphis, Tennessee (Tulane Rd, 38109). The geocoded point is at latitude 34.998, a hair south of the generalized state line; OpenStreetMap places it in Shelby County, Tennessee. The reel says Memphis, Tennessee, as Epoch does.
6. **Refresh before posting.** Power figures and the 43% coverage are as of Epoch's Oct 2, 2026 update (S1, S2).

---

## Claim ledger

| ID | Claim as written | Type | Source | Date | Support / flags |
|----|------------------|------|--------|------|-----------------|
| C1 | OpenAI's headquarters is in San Francisco (1455 and 1515 Third Street). | R | S5 | 2026-10-04 | Secondary source (Wikipedia). Pin: 1455 Third St (S10). |
| C2 | Anthropic's headquarters is at 500 Howard Street, San Francisco. | R | S6 | 2026-10-04 | Secondary source. |
| C3 | Google's headquarters is at 1600 Amphitheatre Parkway, Mountain View. | R | S7 | 2026-10-04 | Secondary source. |
| C4 | Meta's headquarters is in Menlo Park, California. | R | S8 | 2026-10-04 | City only. Pin is the city centre. |
| C5 | Nvidia's headquarters is in Santa Clara, California. | R | S9 | 2026-10-04 | City only. Pin is the city centre. |
| C6 | The farthest two of the five headquarters are about 60 kilometers apart. | I | arithmetic on the five pins (S10, S11) | 2026-10-04 | Great-circle distance, Anthropic (500 Howard St) to Nvidia (Santa Clara centre) = 60.4 km. Nvidia's pin is a city centre, so "about". |
| C7 | OpenAI has 1.2 million square feet of offices in San Francisco, in Mission Bay; Anthropic has about 995,000, in SoMa. As of April 2026. | R | S4 | 2026-04-07 | See "Harvey to verify" 1. The page lists other OpenAI sites besides Mission Bay only in the summary; the script says "in Mission Bay" as the article's neighbourhood label. |
| C8 | OpenAI and Anthropic have about 2.2 million square feet of offices in San Francisco between them. | I | C7: 1.2 million + 0.995 million = 2.195 million | 2026-04-07 | Arithmetic. |
| C9 | Epoch AI tracks 93 of the world's biggest AI data centers. | R | S1; S2 (93 rows) | 2026-10-02 | The hub says "93 sites"; the CSV has 93 rows. |
| C10 | The ten largest US sites on Epoch's list, by current power (MW), are: Colossus 2 (946, Tennessee), Anthropic-Amazon New Carlisle (910, Indiana), Microsoft Fairwater Atlanta (636, Georgia), Meta Prometheus (471, Ohio), OpenAI Stargate Abilene (421, Texas), Microsoft Fairwater Wisconsin (369), Google Pryor North (368, Oklahoma), Colossus 1 (340, Tennessee), Google New Albany (333, Ohio), Google Columbus (303, Ohio). Seven states. | I | S2, column "Current power (MW)"; states from the "Address" column | 2026-10-02 | Ranking is mine, from the CSV. The map shows these ten. |
| C11 | None of Epoch's 93 sites has a California address listed. | I | S2 | 2026-10-04 | Search of every cell in all 93 rows for California, "CA", Bay Area city names: no hit. **13 rows have a blank address** (Google Mesa, Google Kansas City East, Google Storey County, DayOne Nusajaya, Oracle Batam, Nebius Mantsala, Southgate Melbourne, Anthropic Barber Lake, Microsoft Narvik Norway and four OpenAI Stargate sites); none of their names is Californian, but this was not checked against another source. |
| C12 | Epoch counts two Colossus sites in Memphis: Colossus 2 at 946 megawatts and Colossus 1 at 340, about 1.3 gigawatts together (1,286 MW). | R + I | S2 (both rows, addresses in Memphis, TN 38109); sum is mine | 2026-10-02 | 946 + 340 = 1,286. |
| C13 | Colossus 2 is the biggest site on Epoch's list. | I | S2 | 2026-10-02 | Largest "Current power (MW)" (946 vs 910 next) and largest "Current H100 equivalents" (1,111,673 vs 768,769 next). |
| C14 | In New Carlisle, Indiana, an Amazon campus draws 910 megawatts, and Epoch lists Anthropic as its user. | R | S2 (row "Anthropic-Amazon New Carlisle": Owner Amazon, Users Anthropic #confident, 910 MW) | 2026-10-02 | "Draws" is the reel's word for Epoch's "current power". |
| C15 | Three Ohio sites, Meta's Prometheus (471) and two of Google's (New Albany 333, Columbus 303), add up to 1,107 megawatts. | I | S2 | 2026-10-02 | 471 + 333 + 303 = 1,107. These are the three Ohio sites among the top ten. Epoch lists other Ohio sites (for example AWS New Albany, 213 MW) that the reel does not count. |
| C16 | Indiana and Ohio together have four of the ten. | I | C10 | 2026-10-02 | New Carlisle + the three Ohio sites. Checked in code. |
| C17 | Microsoft's Fairwater campus near Atlanta is at 636 megawatts, and Epoch says OpenAI likely uses it. | R | S2 (row "Microsoft Fairwater Atlanta": Owner Microsoft, Users "OpenAI #likely, Microsoft #likely", 636 MW; address Fayetteville, GA) | 2026-10-02 | "Near Atlanta": Fayetteville is in the Atlanta area (background). |
| C18 | Oracle owns the Abilene, Texas, site, which OpenAI uses, at 421 megawatts. | R | S2 (row "OpenAI Stargate Abilene": Owner Oracle #confident, Users OpenAI #confident, 421 MW) | 2026-10-02 | |
| C19 | From OpenAI's headquarters to Colossus 2 is about 2,900 kilometers. | I | pins from S10 | 2026-10-04 | Great-circle 2,898 km. Straight line, not a driving distance. |
| C20 | Epoch says its list covers about 43% of the world's AI computing, as of October 4. | R | S1 (raw HTML: "coverage of global deployed AI computing capacity to be 43% as of October 4, 2026 (90% CI: 23% to 81%)") | 2026-10-04 | Estimate with a wide range; the reel says "about". |
| C21 | Epoch also lists two big sites in Malaysia, which aren't on this map. | R | S2 (DayOne Nusajaya 473 MW; DayOne Kempas 421.7 MW; Country Malaysia) | 2026-10-02 | Both rank above Abilene and below Fairwater Atlanta / Meta Prometheus. |
| C23 | Epoch AI is a research group. | B | general knowledge | 2026-10-04 | Background; only used to say who Epoch is. Epoch's own pages (S1, S3) describe a database of AI data centers. |
| C22 | (Not used on screen.) Google's pin is the Googleplex address; Nominatim matched it to "Google Building 41". | B | S10 | 2026-10-04 | Context only. |

Counts: 23 rows (C22 not used), 9 Inference or mixed (C6, C8, C10, C11, C12, C13, C15, C16, C19), 1 Background used on screen (C23), the rest Reported.

Stale-able items ("as of"): C7 (April 2026), C9 to C21 (Epoch, Oct 2 to 4, 2026). Refresh from S1 / S2 before posting.

---

## Geometry — where each map feature came from

All coordinates are `[longitude, latitude]`. File: `src/reels/where-ai-is-data.geojson` (15 points). The same data is pasted into `src/reels/where-ai-is.html`. There is **no boundary data**; the basemap (Carto dark matter) draws the states.

| Feature | Source / method | Flags |
|---------|-----------------|-------|
| OpenAI [-122.3888, 37.7700] | S10 geocode of 1455 3rd St, San Francisco | Street address. OpenAI's other HQ address (1515 Third St) is next door. |
| Anthropic [-122.3967, 37.7885] | S10 geocode of 500 Howard St (Foundry Square) | Street address. |
| Google [-122.0856, 37.4225] | S10 geocode of 1600 Amphitheatre Pkwy (agrees with S7's 37.422N 122.084W) | Street address. |
| Meta [-122.1481, 37.4797] | S11 Menlo Park city centroid | **City level only**; the source gives no address. |
| Nvidia [-121.9680, 37.3646] | S11 Santa Clara city centroid | **City level only**. |
| Colossus 2 [-90.0349, 34.9980] | S10 geocode of 5420 Tulane Rd, Memphis (Epoch's address) | Matched to a named building. See "Harvey to verify" 5. |
| Colossus 1 [-90.0873, 35.0736] | S10 geocode of 3231 Riverport Rd, Memphis | Matched the road, not a building. |
| Anthropic-Amazon New Carlisle [-86.5072, 41.7066] | S11 New Carlisle town centroid | **Approximate**: Nominatim did not find Epoch's address (55001 Larrison Blvd). |
| Microsoft Fairwater Atlanta [-84.5248, 33.4452] | S10 geocode of 1435 Hwy 54 W, Fayetteville | Street address. |
| Meta Prometheus [-82.7533, 40.0657] | S10: "Meta Data Center", Beech Road SW, New Albany | **Approximate**: Nominatim did not find Epoch's address (1 Community Cir); this may be a neighbouring Meta building. |
| OpenAI Stargate Abilene [-99.8009, 32.4942] | S10 geocode of 5502 Spinks Rd | Matched the road. |
| Microsoft Fairwater Wisconsin [-87.8949, 42.6749] | S10 geocode of 4800 90th St, Mount Pleasant | Street address. |
| Google Pryor (North) [-95.3301, 36.2412] | S10 geocode of 4581 Webb St, Pryor | Street address. |
| Google New Albany [-82.7540, 40.0700] | S10 geocode of 1101 Beech Rd SW | Street address. |
| Google Columbus [-83.0040, 39.8615] | S10 geocode of 5076 S High St | Street address. |

Nothing in the geometry was traced by eye from an image. Display-only label positions (the "Bay Area" label at [-122.2, 37.5], the label offsets) are **estimated**.

### Code checks run (2026-10-04)

- GeoJSON parses; 15 Point features (5 `hq`, 10 `datacenter`); the copy pasted into the reel page is identical to the file.
- Every coordinate is inside the continental US box (longitude -125 to -66, latitude 24 to 50).
- Point-in-polygon against S12: 14 of 15 pins fall in the right state (five in California; New Carlisle in Indiana; Atlanta in Georgia; three in Ohio; Abilene in Texas; Mount Pleasant in Wisconsin; Pryor in Oklahoma; Colossus 1 in Tennessee). **Colossus 2 falls just outside Tennessee** on the generalized (500k) boundary, about 0.2 km south of the line; Nominatim places it in Shelby County, Tennessee, so it is kept (see "Harvey to verify" 5).
- Arithmetic recomputed from S2: 946 + 340 = 1,286; 471 + 333 + 303 = 1,107; 1.2 + 0.995 = 2.195; four of the ten in Indiana and Ohio; farthest HQ pair 60.4 km (Anthropic to Nvidia); OpenAI to Colossus 2 = 2,898 km; no California hit in any of the 93 rows.
- Reel: `check-reels` (see the report for whether the basemap was stubbed).

---

## Independent check (2026-10-04)

A separate agent with no access to the drafting re-opened S1 and S2 as raw text (Epoch hub page and the CSV, parsed) and S3 to S9 only through summaries; it did not re-open the Nominatim or Gazetteer lookups. **No wrong number found**: it recomputed the 60.4 km (Anthropic to Nvidia), 2,898 km (OpenAI to Colossus 2), 946 + 340 = 1,286, 471 + 333 + 303 = 1,107, 1.2 + 0.995 = 2.195, the ranking and states of the ten, four of ten in Indiana and Ohio, the 43% (range 23% to 81%) and the two Malaysian sites. It flagged, and what was done:

1. "None has a California address" does not cover the 13 rows with no address. Now "none has a California address listed" (narration) and "None of the ten is in California" (screen); C11 keeps the caveat.
2. "The biggest AI data centers are elsewhere" was scoped to the ten US sites on Epoch's list only by implication, and read as a tease. Headline is now "Epoch's ten largest US data centers".
3. "draws 910 megawatts": Epoch's column is "Current power (MW)", an estimate, and its documentation page did not define it. Now "is at 910 megawatts" and, in beat 4, "Epoch estimates their current power at 946 megawatts and 340".
4. Ownership at Abilene is Epoch's tag. Narration now says "Epoch lists Oracle as the owner ... and OpenAI as its user"; the screen line says "Oracle's Abilene, used by OpenAI".
5. Office figures: SF Standard calls them estimated square footage over several buildings, and the pin shows one address. Now "an estimated 2.2 million square feet ... spread over several buildings", "The San Francisco Standard puts OpenAI at 1.2 million, around Mission Bay", and the headline says "about".
6. The 43% had no stated range. Beat 7 now says "with a wide range, 23% to 81%" and the screen carries it.
7. "Four of ten" did not say what the ten are, and "1,107" had no unit. Beat 5 now says "four of the ten largest" and "1,107 megawatts".
8. Unexplained terms: Epoch AI is now introduced as "a research group" (C23). Megawatt and gigawatt are not glossed on screen or in the narration (a gloss would be a new sourced fact); the script's notes tell Harvey to explain them in his own words.
9. Voice lines: beat 3 headline (tease), beat 4 colon, beat 6 semicolon sub, the seven-state sentence (split in two), and the beat 6 "at 421" fragment. All rewritten as above.

Left as is: "near Atlanta" (the site is in Fayetteville, Georgia, in the Atlanta area, about 30 km south of the city; the on-screen label says Fayetteville); Prometheus and Google New Albany pins overlap on wide maps (they are about 0.5 km apart; the labels name the place, not each site); pins that are city centres or roads are stated in the Geometry table; the "world's biggest" gloss was removed from beat 3.
