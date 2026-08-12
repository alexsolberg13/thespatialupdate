# Dossier — Revolution Wind

**Slug:** `revolution-wind`
**Built:** 2026-08-10 (by-hand research packet; Stage 2 `build_dossier.py` still not
built — schema follows `lobito-corridor` and `august-2026-eclipse`, the two
dossiers it's been derived from so far)
**Status:** Research complete, unverified draft ledger below. Coordinates are a
mix of one verified point (the lease centroid) and several approximate
landfall/substation points pulled from general description, not GIS data —
pointers to verify, never published fact (house rule).
**Region:** New England (Rhode Island Sound / Rhode Island + Connecticut) — new
region for the site
**Framing:** **Status/explainer piece**, not breaking news. The news peg is
that a federal lease-suspension fight over a still-under-construction wind farm
was fought twice in five months and lost twice by the government — the map's
job is to show a legal boundary (the BOEM lease block) turning into physical
infrastructure (turbines, cable, substation) faster than the administration
could stop it. Full commercial operation is expected H2 2026, which gives this
a soft second hook if that milestone lands before publish.

---

## Spatial thesis (why this needs a map)

**Revolution Wind is a US law made visible in two ways at once — a drawn line
and a built object.**

1. **The lease block is the law.** Under the Outer Continental Shelf Lands Act,
   BOEM auctioned and drew a specific federal ocean parcel — lease OCS-A 0486,
   roughly 13.3 nautical miles southeast of the Rhode Island coast. That
   polygon is the physical footprint of a federal leasing authority: it exists
   on a chart before a single turbine goes up.
2. **The turbines are the law's consequence.** Inside that same polygon, 65
   turbines are now standing — most of them installed, the project delivering
   power to the New England grid as of March 2026. The abstraction (a lease
   boundary) became 850-foot steel structures visible from the Rhode Island
   shore.

The map-worthy twist: in December 2025, the Department of the Interior tried
to un-draw that authority — issuing a stop-work order against a project that
was already 80%+ built, citing a classified national-security/radar
justification. It was the *second* such order in five months (the first came
in August 2025). Both were struck down in federal court. The story is the gap
between a regulator's line on a map and steel that's already standing on top
of it — and a court, not Congress, deciding which one wins.

Second layer worth showing: the power itself splits geographically — 400 MW to
Rhode Island, 304 MW to Connecticut — so the map can carry the cable route
from the lease block to a single Rhode Island landfall point, then trace where
the electrons are contracted to go.

---

## Geography — key nodes

Coordinates stored **lon-first** `[lon, lat]` per site convention (GeoJSON
spec). Western longitudes negative.

| Node | `[lon, lat]` | Confidence |
|------|--------------|-----------|
| Lease area OCS-A 0486 centroid | `[-71.06998, 41.14994]` | **verified (BOEM/Wikipedia, swapped from 41.14994N 71.06998W)** |
| Cable landfall — Quonset Point, North Kingstown, RI | `[-71.41, 41.59]` | approx — verify against BOEM COP/MARA filing |
| Onshore substation (North Kingstown, ~1 mi inland of landfall) | `[-71.41, 41.58]` | approx — verify exact site |

**Not yet pulled:** the actual lease-block polygon boundary (BOEM publishes
official outlines as GIS/shapefile data — this dossier only has the centroid),
and individual turbine positions. Both should come from BOEM's renewable
energy GIS layers or the project's Construction and Operations Plan (COP)
before Stage 3, not be hand-drawn.

---

## Map layers (for `data.geojson`)

Each feature to be tagged with the claim ID that justifies it.

1. **Lease area OCS-A 0486** — Polygon (pull real boundary from BOEM GIS, not
   the centroid point alone). Shaded fill — this is the "law" layer. Tag `[C1]`.
2. **Turbine field** — Point markers inside the lease polygon, ideally at real
   COP-filed positions; if unavailable, a labeled count/cluster is acceptable
   with a caption noting positions are illustrative. Tag `[C2][C15]`.
3. **Export cable route** — LineString, lease area → Quonset Point landfall.
   Tag `[C4]`.
4. **Landfall + substation markers** — Quonset Point, North Kingstown
   substation. Tag `[C4]`.
5. **Optional split-power annotation** — visual note or two-color cable
   segment showing the 400 MW RI / 304 MW CT split downstream of the
   substation. Tag `[C3]`.

Visual payoff: a federal lease polygon drawn on open water, a turbine field
now filling it, and a single cable thread carrying that into two states' grids
— the paper authority and the physical result in one frame.

---

## Claim ledger (draft — unverified)

Type key — **R** Reported (traces to a source URL) · **B** Background (general
knowledge) · **I** Inference (connecting dots the sources didn't).

| ID | Claim | Type | Source(s) | Flags |
|----|-------|------|-----------|-------|
| C1 | Revolution Wind sits in BOEM lease area OCS-A 0486, ~13.3 nautical miles (24.1 km) southeast of the Rhode Island coast, centered near 41.150°N, 71.070°W. | R | BOEM MARA page; Wikipedia (Revolution Wind) | pull real polygon boundary, not just centroid |
| C2 | The project consists of 65 Siemens Gamesa offshore turbines. | R | Hartford Business Journal; offshorewind.biz | — |
| C3 | Total capacity is 704 MW, split 400 MW to Rhode Island and 304 MW to Connecticut — enough for more than 350,000 homes. | R | ecoportal.net; offshorewind.biz | — |
| C4 | Export cables make landfall at Quonset Point in North Kingstown, RI, running about one mile underground to a newly built substation. | R | BOEM non-technical MARA summary | confirm substation site name/coords |
| C5 | Developers are Ørsted and Global Infrastructure Partners' Skyborn Renewables, a 50/50 joint venture; Eversource Energy, an original co-developer, exited its ownership stake in 2024. | R | Windpower Monthly; Hartford Business Journal | — |
| C6 | On August 22, 2025, BOEM issued a stop-work order against Revolution Wind citing national-security concerns, when the project was roughly 80% complete. | R | Ørsted company announcement (2025-08); offshorewind.biz (2025-08-20, "80 Pct of Completion") | — |
| C7 | A federal court ruling (reported ~September 22, 2025) allowed work to resume; construction restarted in fall 2025. | R | CT Mirror (2025-09-22) | reconcile against a separate "resumed November 2025" reference — pin one date |
| C8 | On December 22, 2025, Interior/BOEM issued a second stop-work order to Revolution Wind, part of a broader pause on "all large-scale offshore wind projects under construction," again citing national-security/radar-interference concerns. | R | CT Mirror (2025-12-22); Utility Dive | — |
| C9 | Revolution Wind LLC sued in the US District Court for D.D.C. — *Revolution Wind, LLC v. Burgum*, No. 1:25-cv-02999 — challenging the second suspension order. | R | Civil Rights Litigation Clearinghouse | confirm presiding judge's name before publishing |
| C10 | The court granted a preliminary injunction (reported ~January 12, 2026), finding Revolution Wind likely to succeed on the merits and likely to suffer irreparable harm, and enjoined the second stop-work order. | R | offshorewind.biz (2026-01-13) | reconcile against the broader "all five projects cleared by Feb 2, 2026" framing — confirm Revolution Wind's own ruling date specifically |
| C11 | The stated rationale for both suspension orders was a Department of Defense assessment — described as classified — alleging the turbines could interfere with military radar. | R | Spencer Fane legal summary; EDF | get a primary-document citation for the DoD assessment before publishing |
| C12 | Interior Secretary Doug Burgum defended the order, stating: "The prime duty of the United States government is to protect the American people." | R | search-aggregated summary | trace to a primary quote source (Interior press release or the court filing) before publishing |
| C13 | The court found Interior "failed to rationalize its abrupt change in position" on the second order, and suggested the national-security justification may have been pretextual. | R | Spencer Fane legal summary | pull the direct language from the opinion itself, not a law-firm summary |
| C14 | As of March 2026, Revolution Wind began delivering power to the New England grid while still under construction. | R | offshorewind.biz (2026-03-14); CT Public (2026-03-13) | — |
| C15 | As of early-to-mid 2026 the project was roughly 87–90%+ complete, with the large majority of its 65 turbines installed. | R | multiple aggregator summaries, Aug 2026 search | sources give slightly different %/installed-count figures at slightly different dates — pin one number to one as-of date before publishing |
| C16 | Full commercial operation is expected in the second half of 2026. | R | CT Public (2026-03-13) | — |
| C17 | Eversource recorded financial charges tied to the Revolution Wind stop-work orders — reported as $75 million and, separately, $164 million. | R | Windpower Monthly; Hartford Business Journal | reconcile whether these are sequential/cumulative charges or the same figure restated across reports |
| C18 | Revolution Wind was one of five East Coast offshore wind projects under construction — alongside Coastal Virginia Offshore Wind, Empire Wind, Sunrise Wind, and Vineyard Wind — hit with stop-work orders in the December 2025 action; by early February 2026, courts had struck down all five. | R | Lexology; EDF; offshorewind.biz (2026-02-03) | — |
| C19 | Two federal stop-work orders in five months against an 80%+-built offshore wind farm — both struck down in court — show how a single executive leasing authority can nearly halt near-finished infrastructure entirely at one administration's discretion, with courts rather than Congress providing the check. | **I** | — (synthesis of C1/C6/C8/C10/C13/C18) | **This is the story's thesis and it is Inference. Never let it read as Reported.** Sources call the orders "unjustified" or note courts found them likely pretextual; the "law vs. built object" and "courts as the check" framing is ours. |

**Ledger health check (draft):** 1 clear Inference of 19 (~5%) — well within the
"kill above ~40%" rule, and it's the thesis rather than a smuggled fact. The
real risk here is different from Lobito's: not too much inference, but too
many **soft-sourced current-events claims** pulled from aggregated search
summaries rather than primary documents (C10, C11, C12, C13, C17 especially).
Before drafting, re-pull C9–C13 directly from the court docket or a single
wire-service report, and C17 from Eversource's own SEC filing/earnings
release — this whole story's credibility rests on the stop-work-order timeline
being exactly right.

---

## GIS verification pass — results (2026-08-10)

Pulled real geometry directly from BOEM's official ArcGIS REST services (Office
of Renewable Energy Programs), queried by `LEASE_NUMBER = OCS-A 0486` /
`PROJECT_NAME LIKE '%Revolution%'`. This replaces the illustrative/approximate
placeholders used in the first map draft.

| ID | Claim | Type | Source(s) | Flags |
|----|-------|------|-----------|-------|
| C20 | BOEM's official Wind Lease Boundaries layer confirms lease OCS-A 0486 is held by "Revolution Wind, LLC," covers 83,789 acres, was leased 10/1/2013 for a 25-year term, and gives the real two-part lease-boundary polygon (a small detached parcel sits northeast of the main block). | R | BOEM ArcGIS FeatureServer — `Wind_Lease_Boundaries__BOEM_` (layer 8), Office of Renewable Energy Programs | **RESOLVES the C1 flag.** Primary government GIS source, not an aggregator. |
| C21 | BOEM's official turbine-siting layer lists 195 candidate turbine positions for Revolution Wind — three sets of 65 (labeled "Option 1/2/3" in the data), each an "8-12 MW class" position, max height 266m, max rotor diameter 220m. The map uses Option 1 as a representative set. | R | BOEM ArcGIS FeatureServer — `Offshore_Wind_-_Proposed_or_Installed_Turbine_Locations` | **Does not fully resolve C2/C15.** BOEM's own Record of Decision (Aug 21, 2023) approved "Alternative G" — up to 79 candidate locations for 65 turbines — which is not obviously the same as any single "Option" in this dataset. It is NOT confirmed that "Option 1" matches the as-built layout. Before publishing individual turbine coordinates as fact, cross-check against the ROD/COP or a post-construction as-built filing. |
| C22 | BOEM's data lists two offshore substations for Revolution Wind — AF08 and AL11 — linked by an inter-substation cable (~7.9 mi per the official export-cable layer), exporting via twin 275kV circuits (~38.9 mi each) to a landfall at Quonset Point, North Kingstown, RI (41.585°N, 71.426°W). | R | BOEM ArcGIS FeatureServer — `Offshore_Wind_-_Proposed_or_Installed_Substations`, `Export_Cables_(Proposed_or_Installed)_view`, `Offshore_Wind_-_Proposed_or_Installed_Offshore_Landings` | **RESOLVES the C4 flag** (landfall coordinates) and adds the two-substation detail, which wasn't in the story draft. All records carry `STATUS: Proposed` in BOEM's schema — this is BOEM's permitted/filed layout, not an independent as-built confirmation, though it's a stronger source than anything used elsewhere in this dossier. |

**Note on all BOEM records:** every feature pulled carries `STATUS: "Proposed"` —
BOEM's public GIS reflects the permitted Construction and Operations Plan, not
a live as-built survey. That's normal (BOEM doesn't appear to re-survey and
republish as-built positions), but it means "here's what was filed" is a more
defensible caption than "here's exactly what's standing today."

## Verification still needed (carry into `sources.html`)

1. ~~Lease polygon boundary~~ — **DONE 2026-08-10.** Real polygon pulled from
   BOEM's official GIS service; see C20.
2. **Turbine positions** — real BOEM-filed candidate positions now used (C21),
   but it is still unconfirmed whether the "Option 1" set used on the map
   matches the actually-built layout ("Alternative G" per the ROD). Cross-check
   against the ROD/COP or an as-built filing before treating individual
   turbine coordinates as fact.
3. ~~Landfall/substation coordinates~~ — **DONE 2026-08-10.** Real coordinates
   for Quonset Point landfall and both offshore substations pulled from BOEM's
   GIS services; see C22.
4. **Timeline reconciliation** — C7 (Sept vs Nov 2025 resumption) and C10
   (Jan 12 vs "by Feb 2" framing) need one pinned date each, ideally from
   court-docket entries rather than news aggregation.
5. **Judge's name** (C9/C10) — get it directly from the docket
   (`Revolution Wind, LLC v. Burgum`, 1:25-cv-02999, D.D.C.) before publishing.
6. **Primary quote for Burgum** (C12) and **primary opinion language** (C13) —
   both currently sourced through secondary summaries; trace to source.
7. **Eversource charges** (C17) — reconcile $75M vs $164M via Eversource's own
   investor materials.
8. **Completion percentage** (C15) — pin one figure to one as-of date close to
   the actual drafting date, since this number keeps moving.

---

## Sources (publisher · what it supports)

- BOEM — *Revolution Wind Farm Project, Rhode Island* (non-technical MARA
  summary) — lease location, landfall, substation: https://www.boem.gov/renewable-energy/state-activities/revwind-non-technical-mara
- BOEM — *Revolution Wind* project page: https://www.boem.gov/renewable-energy/state-activities/revolution-wind
- Wikipedia — *Revolution Wind* — lease coordinates, capacity, turbine count: https://en.wikipedia.org/wiki/Revolution_Wind
- Ørsted — company announcement, Aug 2025 stop-work order: https://orsted.com/en/company-announcement-list/2025/08/revolution-wind-receives-offshore-stop-work-order--145387701
- offshorewind.biz (2025-08-20) — "Revolution Wind at 80 Pct of Completion": https://www.offshorewind.biz/2025/08/20/revolution-wind-at-80-pct-of-completion/
- CT Mirror (2025-09-22) — "Judge allows work to resume on CT Revolution Wind project": https://ctmirror.org/2025/09/22/revolution-wind-trump-injunction-granted/
- CT Mirror (2025-12-22) — "Trump administration pauses Revolution Wind project — again": https://ctmirror.org/2025/12/22/trump-administration-pauses-offshore-revolution-wind-project-again/
- Utility Dive — "4 of 5 offshore wind farms challenge Trump administration stop work order": https://www.utilitydive.com/news/orsted-equinor-offshore-wind-projects-stop-order-trump-burgum/808728/
- Civil Rights Litigation Clearinghouse — *Revolution Wind, LLC v. Burgum*, 1:25-cv-02999 (D.D.C.), case docket: https://clearinghouse.net/case/46916/
- offshorewind.biz (2026-01-13) — "US Federal Court Clears Revolution Wind to Resume Construction": https://www.offshorewind.biz/2026/01/13/us-federal-court-clears-revolution-wind-to-resume-construction-as-orsted-skyborns-lawsuit-against-stop-work-orders-progresses/
- Spencer Fane — legal analysis of the injunction ruling: https://www.spencerfane.com/insight/revolution-wind-may-proceed-with-its-offshore-wind-energy-project-the-trump-administration-loses-another-court-battle/
- EDF — "Courts Strike Down All Five Stop-Work Orders for Offshore Wind Projects": https://www.edf.org/media/courts-strike-down-all-five-stop-work-orders-offshore-wind-projects
- Lexology — "Court Lifts Stop-Work Orders for Three Paused Offshore Wind Projects": https://www.lexology.com/library/detail.aspx?g=08a004bd-f861-43be-82a4-40a237e9fd6a
- offshorewind.biz (2026-02-03) — "All Five Halted US Offshore Wind Farms Resume Construction": https://www.offshorewind.biz/2026/02/03/all-five-halted-us-offshore-wind-farms-resume-construction/
- CT Public (2026-03-13) — "Revolution Wind ... comes online": https://www.ctpublic.org/news/2026-03-13/revolution-wind-comes-online-new-england-power-grid
- offshorewind.biz (2026-03-14) — "Revolution Wind Starts Delivering Power": https://www.offshorewind.biz/2026/03/14/revolution-wind-starts-delivering-power/
- Windpower Monthly — "Eversource Energy to take $75 million charge over Revolution Wind": https://www.windpowermonthly.com/article/1936204/eversource-energy-75-million-charge-revolution-wind
- Hartford Business Journal — "Eversource takes $164M charge tied to Revolution Wind stop-work orders": https://hartfordbusiness.com/article/eversource-takes-164m-charge-tied-to-revolution-wind-stop-work-orders/
- Revolution Wind (project site) — construction updates: https://revolution-wind.com/construction-updates
- BOEM (Office of Renewable Energy Programs) — official ArcGIS REST services, queried directly for this dossier's map geometry (C20–C22):
  - Wind Lease Boundaries: https://services7.arcgis.com/G5Ma95RzqJRPKsWL/ArcGIS/rest/services/Wind_Lease_Boundaries__BOEM_/FeatureServer/8
  - Turbine Locations: https://services7.arcgis.com/G5Ma95RzqJRPKsWL/ArcGIS/rest/services/Offshore_Wind_-_Proposed_or_Installed_Turbine_Locations/FeatureServer/0
  - Substations: https://services7.arcgis.com/G5Ma95RzqJRPKsWL/ArcGIS/rest/services/Offshore_Wind_-_Proposed_or_Installed_Substations/FeatureServer/1
  - Offshore Landings: https://services7.arcgis.com/G5Ma95RzqJRPKsWL/ArcGIS/rest/services/Offshore_Wind_-_Proposed_or_Installed_Offshore_Landings/FeatureServer/0
  - Export Cables: https://services7.arcgis.com/G5Ma95RzqJRPKsWL/ArcGIS/rest/services/Export_Cables_(Proposed_or_Installed)_view/FeatureServer/15
- BOEM — Revolution Wind Record of Decision (Alternative G, 65 turbines, Aug 21 2023): https://www.boem.gov/sites/default/files/documents/renewable-energy/state-activities/Revolution-Wind-Record-of-Decision-OCS-A-0486_3.pdf
