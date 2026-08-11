# Dossier — August 12, 2026 Total Solar Eclipse

**Slug:** `august-2026-eclipse`
**Built:** 2026-08-09 (by-hand research packet, second real dossier after
`lobito-corridor`; Stage 2 `build_dossier.py` still not built)
**Status:** Research complete, unverified draft ledger below. Coordinates are
approximate city centroids — pointers to verify against ephemeris data, never
published fact (house rule). Not yet scaffolded (`new_story.py` not yet run).
**Region:** Arctic → North Atlantic → Iberia (new region for the site)
**Framing:** **PREVIEW piece** — the eclipse is 3 days out (today is 2026-08-09,
eclipse is 2026-08-12). This is "here is the shadow's itinerary and who's inside
the line," NOT a day-after "what was seen / how were the clouds" report. If the
story slips past Aug 12, re-frame or convert to a recap. Decide before drafting.

---

## Spatial thesis (why this needs a map)

The story is a **moving line and a boundary.** The Moon's umbra — a shadow only
**~294 km wide** at maximum — sweeps from northeastern Siberia across the
Greenland ice cap, clips western Iceland, crosses the North Atlantic, and makes
landfall in northern Spain at **sunset**. Everything editorially interesting is a
function of *which side of that line you are on:*

- **Inside the path:** totality — a full eclipse, under two minutes for most.
- **Just outside:** a 99%+ *partial*, which is a completely different (and lesser)
  phenomenon. **Madrid and Barcelona see 99.9% and still miss it** — they are
  outside the line. That single fact is the story's hook: 0.1% of the Sun is the
  difference between a partial and totality.

Second spatial hook, unique to 2026: the Spanish landfall happens with the Sun
only **~11° above the western horizon** (Galicia, ~20:26 local). Totality at
sunset means the *terrain to your northwest* matters more than the sky overhead —
a mountain or marine haze hundreds of km away can block a low Sun. Geography
decides who sees it, twice over: the shadow's path, and the horizon line.

Third hook (historical): this is the **first total solar eclipse over mainland
Spain since 1905** — 121 years. Verify that year before publishing.

This is a map-first story: draw the umbral track as a line, shade the ~294 km
band of totality, and drop city points colored by whether they're *in* or *just
out.* The map is the argument.

---

## Do NOT conflate — totality vs. partial

The single likeliest reporting error, and the emotional core of the piece:

- **Path of totality** = the ~294 km-wide band the umbra crosses. Full eclipse.
- **Partial eclipse** = the vastly larger area under the penumbra. The Sun is
  *never* fully covered, no matter how high the percentage.

A "99.9% eclipse" (Madrid, Barcelona) is a partial. It does not get dark, the
corona is not visible, it is not "almost totality" in any experiential sense.
Never let a high partial percentage read as "nearly total." Keep every city's
label explicit about which side of the line it's on.

---

## Geography — key nodes

Coordinates stored **lon-first** `[lon, lat]` per site convention (GeoJSON spec).
Western longitudes negative. **All coordinates below are approximate city
centroids** pulled from general knowledge — they locate the *town*, not its
precise eclipse circumstance. Before publishing, cross-check the path geometry
against ephemeris data (NASA / Xavier Jubier / EclipseWise), which publishes
**lat-first** — every value has to be swapped. This lat→lon swap at the source
boundary is the likeliest way a marker lands in the wrong ocean (CLAUDE.md).

### Path anchor

| Node | `[lon, lat]` | Confidence |
|------|--------------|-----------|
| Point of greatest eclipse (N Atlantic, 2m18s) | `[-25.24, 65.22]` | **R — EclipseWise/Wikipedia (swapped from 65.22N 25.24W)** |

### Iceland — totality (Sun late afternoon, ~17:44–17:48 GMT)

| City | `[lon, lat]` | Totality | Note |
|------|--------------|----------|------|
| Ísafjörður (Westfjords) | `[-23.14, 66.07]` | ~1m30s | approx |
| Ólafsvík (Snæfellsnes) | `[-23.71, 64.90]` | ~2m03s | approx — near longest on land |
| Snæfellsjökull NP (W tip) | `[-23.78, 64.81]` | ~2m10s | approx — longest Iceland land totality |
| Keflavík (Reykjanes) | `[-22.56, 64.00]` | ~1m39s | approx |
| **Reykjavík (capital)** | `[-21.94, 64.15]` | **~59s** | **inside path but near the edge — the "barely made it" city.** Centerline misses all land. |

### Spain — totality at **sunset** (~20:26–20:32 local CEST)

| City | `[lon, lat]` | Totality | Note |
|------|--------------|----------|------|
| A Coruña (NW coast) | `[-8.40, 43.37]` | ~1m16s | approx — landfall region, Sun ~11° |
| Gijón (N coast) | `[-5.66, 43.53]` | ~1m45s | approx |
| Oviedo (N interior) | `[-5.84, 43.36]` | ~1m48s | approx |
| León (inland) | `[-5.57, 42.60]` | ~1m45s | approx |
| Burgos (inland) | `[-3.70, 42.34]` | ~1m43s | approx |
| Valladolid (interior) | `[-4.72, 41.65]` | ~1m28s | approx |
| **Bilbao (on path edge)** | `[-2.93, 43.26]` | **~29s** | **edge city — Spain's "barely made it"** |
| Zaragoza (NE interior) | `[-0.88, 41.65]` | ~1m24s | approx |
| Valencia (Mediterranean) | `[-0.38, 39.47]` | ~1m00s | approx — ~20:32 local |
| Palma de Mallorca (island) | `[2.65, 39.57]` | ~1m36s | approx — Balearics, ~20:31 |

### Just OUTSIDE the line — the hook cities (partial only)

| City | `[lon, lat]` | Coverage | Note |
|------|--------------|----------|------|
| **Madrid** | `[-3.70, 40.42]` | **99.9% partial** | outside totality — the story's headline "miss" |
| **Barcelona** | `[2.17, 41.39]` | **99.9% partial** | outside totality |

---

## Map layers (for `data.geojson`)

Each feature tagged with the claim ID that justifies it.

1. **Umbral centerline** — LineString following greatest-eclipse track:
   Siberia → Greenland ice cap → W Iceland (offshore) → N Atlantic → N Spain.
   Solid line. Tag `[C1][C2]`. *Coords must come from ephemeris data, swapped
   lat→lon; do not hand-draw.*
2. **Path of totality band** — Polygon, the ~294 km-wide corridor (northern +
   southern limits). Shaded fill. Tag `[C3]`. This is the visual payoff.
3. **Totality city points** — Iceland + Spain cities above, each labeled with
   totality duration. Tag per row.
4. **Edge markers** (distinct style) — Reykjavík (~59s) and Bilbao (~29s): the
   "barely inside" cities. Tag `[C7][C11]`.
5. **Outside-the-line markers** (distinct/greyed style) — Madrid, Barcelona at
   99.9% partial. The point of the whole map. Tag `[C9]`.
6. **Optional: sunset terminator** near Spanish landfall to show the Sun is on
   the horizon (~11°). Tag `[C6]`. Nice-to-have, verify before adding.

Visual payoff: one narrow shaded band slicing from Arctic ice to a
Mediterranean sunset, with two big cities sitting *just* off its southern edge.

---

## Claim ledger (draft — unverified)

Type key — **R** Reported (traces to a source URL) · **B** Background (general
knowledge) · **I** Inference (connecting dots the sources didn't).

| ID | Claim | Type | Source(s) | Flags |
|----|-------|------|-----------|-------|
| C1 | A total solar eclipse crosses NE Siberia, the Greenland ice cap, western Iceland, the North Atlantic, and northern Spain (with a corner of Portugal) on 12 Aug 2026. | R | NASA; timeanddate; ESA | verify Portugal corner |
| C2 | Greatest eclipse is in the North Atlantic (~65.2°N, 25.2°W) at 17:47 UT, with max totality 2m18s. | R | EclipseWise; Wikipedia | — |
| C3 | The path of totality is at most ~294 km (183 mi) wide. | R | Wikipedia (Saros/EclipseWise data) | verify against NASA |
| C4 | For most locations totality lasts under two minutes. | R | NASA | — |
| C5 | In Greenland and Iceland the eclipse is late afternoon/early evening; in Spain it occurs shortly before sunset. | R | NASA; timeanddate | — |
| C6 | At the Spanish (Galicia) landfall the Sun is only ~11° above the western horizon, ~20:26 local. | R | ESA; sky-at-night | verify altitude figure & exact time |
| C7 | Reykjavík lies inside the path but near its edge, with only ~59s of totality; the centerline misses all land. | R | nationaleclipse.com | single-source — verify duration |
| C8 | Spanish totality cities include A Coruña, Gijón, Oviedo, León, Burgos, Valladolid, Zaragoza, Valencia, and Palma de Mallorca. | R | nationaleclipse.com; sky-at-night; timeanddate | verify each is truly inside the line |
| C9 | Madrid and Barcelona see a 99.9% *partial* eclipse and remain outside the path of totality. | R | timeanddate / sky-at-night | **the headline claim — nail the exact %/source** |
| C10 | This is the first total solar eclipse over mainland Spain since 1905. | R | sky-at-night; spain.info | **verify the 1905 year specifically** |
| C11 | Bilbao sits on the path edge with only ~29s of totality. | R | nationaleclipse.com | single-source — verify |
| C12 | It is the first of three consecutive solar eclipses visible from Spain (2026, 2027, 2028). | R | spain.info; eclipse262728.es | verify 2027/2028 are visible from Spain |
| C13 | The eclipse belongs to Saros series 126 (member 48 of 72); magnitude 1.0386. | R | Wikipedia; EclipseWise | background detail, cite if used |
| C14 | Because totality happens with the Sun very low, clear sky *to the northwest* (toward the setting Sun) matters more than the sky directly overhead. | R/I | sky-at-night (framing) | attribute the framing; part reasoning |
| C15 | A 99.9% partial is categorically not "almost totality" — the Sun is never fully covered, so it does not go dark and the corona is not visible. | B | general eclipse science | tag as Background; do not source-inflate |
| C16 | The narrow path means whether a place sees totality is decided by which side of a ~294 km line it sits on — the same ore-body-to-two-oceans logic, here a shadow and a boundary. | **I** | — (synthesis of C3/C9/C11) | **This is the spatial thesis and it is Inference. Never let it read as Reported.** |

**Ledger health check (draft):** 1 clear Inference of 16 (~6%), plus 1 Background
and one R/I framing claim — well within the "kill above ~40% Inference" rule.
The real risks are all **single-source Reported** facts (C7, C11 city durations
from one aggregator) and two figures that must be pinned to a primary source: the
**1905 "first since" year (C10)** and the **99.9% Madrid/Barcelona split (C9)**,
which is the headline. Get those from NASA/timeanddate/an ephemeris tool directly,
not an aggregator, before publishing.

---

## Verification still needed (carry into `sources.html`)

1. **Path geometry** — ~~pull the actual centerline...~~ **DONE 2026-08-09.** The
   centerline in `data.geojson` and the reel is now NASA / Espenak ephemeris —
   the published central line at 2-minute intervals (17:20–18:32 UT), converted
   lat→lon. Source: NASA GSFC path table (`SE2026Aug12Tpath`). The northern/
   southern *limits* (for a shaded totality band) can be pulled from the same
   table if wanted later.
2. **"First since 1905"** (C10) — confirm the exact prior mainland-Spain total.
3. **Madrid/Barcelona 99.9%** (C9) — the headline; pin to a primary source with
   the exact figures, not an aggregator.
4. **City totality durations** (C7, C8, C11) — currently one aggregator
   (nationaleclipse.com); confirm Reykjavík ~59s and Bilbao ~29s independently.
5. **Sun altitude / local times** (C6) — confirm ~11° and 20:26 for Galicia.
6. **Framing check** — this is a preview; if it publishes after Aug 12, re-cast.

---

## Sources (publisher · what it supports)

- NASA Science — *Total Solar Eclipse on August 12, 2026* — path, timing,
  durations: https://science.nasa.gov/eclipses/future-eclipses/total-solar-eclipse-on-august-12-2026/
- timeanddate — *Total Solar Eclipse on August 12, 2026* — global circumstances,
  city times: https://www.timeanddate.com/eclipse/solar/2026-august-12
- timeanddate — *Aug 12, 2026 eclipse in Spain* — Spanish city coverage:
  https://www.timeanddate.com/eclipse/in/spain?iso=20260812
- Wikipedia — *Solar eclipse of August 12, 2026* — path width 294 km, greatest
  eclipse point, Saros 126, magnitude: https://en.wikipedia.org/wiki/Solar_eclipse_of_August_12,_2026
- EclipseWise (Espenak) — *Total Solar Eclipse of 2026 Aug 12* — canonical
  ephemeris: https://www.eclipsewise.com/solar/SEprime/2001-2100/SE2026Aug12Tprime.html
- NASA GSFC — Google-map path (Espenak): https://eclipse.gsfc.nasa.gov/SEgoogle/SEgoogle2001/SE2026Aug12Tgoogle.html
- ESA — *Join ESA for a total solar eclipse on 12 August 2026* — Spain map, ~11°
  altitude, 20:26 Galicia: https://www.esa.int/Science_Exploration/Space_Science/Join_ESA_for_a_total_solar_eclipse_on_12_August_2026
- BBC Sky at Night — *Best places in Spain to see the total solar eclipse* —
  cities, "first since 1905", sunset: https://www.skyatnightmagazine.com/news/best-places-to-see-spanish-eclipse-august-2026
- nationaleclipse.com — *2026 Overview, Iceland & Spain* — per-city durations
  (single aggregator — verify): https://nationaleclipse.com/overviews/2026-total-solar-eclipse-overview.html
- Spain.info — *Eclipses 2026/2027/2028* — three consecutive Spanish eclipses:
  https://www.spain.info/en/eclipses/
- National Geographic — *A spectacular solar eclipse is coming* — general
  narrative colour: https://www.nationalgeographic.com/science/article/august-2026-total-solar-eclipse
- Xavier Jubier — interactive eclipse map (for path geometry, to be pulled in
  verification): http://xjubier.free.fr/en/site_pages/solar_eclipses/TSE_2026_GoogleMapFull.html
