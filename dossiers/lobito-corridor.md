# Dossier — Lobito Corridor

**Slug:** `lobito-corridor`
**Built:** 2026-08-09 (by-hand research packet; Stage 2 `build_dossier.py` not yet built — this is the first real dossier the schema can be derived from)
**Status:** Verification pass complete 2026-08-09. Stage 3 draft folder created at
`src/stories/lobito-corridor/` (index.md + data.geojson + sidebar + sources.html).
The story's **`sources.html` is now the live claim ledger** — treat it as
authoritative over the draft table below. The verified coordinates live in the
story's `data.geojson` (this file's table kept some estimates; the story file
corrected them, e.g. Luacano to `[21.65, -11.217]`).
**Region:** Southern/Central Africa (new region for the site)
**Balance type:** Infrastructure / cooperation / great-power competition (not conflict)

---

## Spatial thesis (why this needs a map)

The Central African Copperbelt — the world's densest concentration of copper and
cobalt — is **landlocked**. The whole story is which ocean its ore drains to:

- **West → Atlantic:** the Lobito Corridor, a rehabbed 1970s Angolan railway
  (Port of Lobito → the Copperbelt), backed by the US and EU.
- **East → Indian Ocean:** the TAZARA railway (Copperbelt → Dar es Salaam),
  a 1970s Chinese-built line now being modernized under a fresh Chinese deal.

Same ore body, two oceans, two blocs. The map *is* the argument: draw the two
lines diverging from the same mining belt to opposite coasts and the geopolitics
is self-evident. This is a map-first story, not an event with a location.

---

## Two projects — do NOT conflate them

A common reporting error. There are two distinct builds under the "Lobito" banner:

1. **Rehabilitation of the existing Benguela line** (Lobito → Luau → Kolwezi).
   Operated by Lobito Atlantic Railway (LAR); financed by US DFC + DBSA (+ AFC).
   This is the line running today.
2. **New greenfield Zambia extension** (Luacano → Jimbe → Chingola, ~800 km of
   *new* track). Led by the Africa Finance Corporation (AFC); separate ~$1bn+
   project; groundbreaking 2026. This does not exist yet.

Keep the financing figures and timelines attached to the right project.

---

## Geography — route nodes

Coordinates stored **lon-first** `[lon, lat]` per site convention (GeoJSON spec).
Southern hemisphere latitudes are negative. **Only Lobito is verified**; every
other coordinate is an approximate pointer to verify before publishing (house
rule: machine/estimated coordinates are pointers, never published fact).

### Existing corridor (Lobito → Kolwezi)

| Node | Country | `[lon, lat]` | Confidence |
|------|---------|--------------|-----------|
| Port of Lobito (Atlantic terminus) | Angola | `[13.5464, -12.35]` | **verified (Wikipedia)** |
| Benguela | Angola | `[13.407, -12.578]` | approx — verify |
| Huambo | Angola | `[15.739, -12.776]` | approx — verify |
| Kuito | Angola | `[16.933, -12.383]` | approx — verify |
| Luena | Angola | `[19.917, -11.783]` | approx — verify |
| Luacano (junction for Zambia branch) | Angola | `[20.62, -11.22]` | **low — verify** |
| Luau (Angola–DRC border) | Angola | `[22.224, -10.706]` | approx — verify |
| Dilolo (DRC border town) | DRC | `[22.335, -10.712]` | approx — verify |
| Kolwezi (copper–cobalt hub) | DRC | `[25.47, -10.72]` | approx — verify |
| Lubumbashi | DRC | `[27.48, -11.66]` | approx — verify |

### Greenfield Zambia extension (planned)

| Node | Country | `[lon, lat]` | Confidence |
|------|---------|--------------|-----------|
| Jimbe (Angola–Zambia border) | Zambia | `[24.28, -11.15]` | **low — verify** |
| Chingola (Zambian Copperbelt) | Zambia | `[27.881, -12.529]` | approx — verify |

### Competing corridor (TAZARA)

| Node | Country | `[lon, lat]` | Confidence |
|------|---------|--------------|-----------|
| Kapiri Mposhi (TAZARA jct, Zambia) | Zambia | `[28.665, -13.971]` | approx — verify |
| Dar es Salaam (Indian Ocean terminus) | Tanzania | `[39.208, -6.792]` | approx — verify |

---

## Map layers (for `data.geojson`)

Each feature to be tagged with the claim ID that justifies it.

1. **Lobito Corridor rail line** (existing/rehab) — LineString:
   Lobito → Benguela → Huambo → Kuito → Luena → Luacano → Luau → Dilolo →
   Kolwezi. Solid line. Tag `[C1][C2][C3][C5]`.
2. **Greenfield Zambia extension** — LineString: Luacano → Jimbe → Chingola.
   Dashed (planned/under construction). Tag `[C10][C11]`.
3. **TAZARA (competing eastern route)** — LineString: Kapiri Mposhi →
   Dar es Salaam. Distinct colour (e.g. the "cooperation" teal vs Lobito's
   accent gold). Tag `[C14][C15]`.
4. **Point markers:** Port of Lobito (Atlantic), Kolwezi (cobalt), Chingola
   (Copperbelt), Dar es Salaam (Indian Ocean), Luau/Dilolo (border crossing).
5. **Optional shaded region:** the Central African Copperbelt straddling
   DRC (Lualaba / Haut-Katanga) and Zambia. Tag `[C12]`.

The visual payoff: two lines diverging from one shaded ore belt to opposite
coasts.

---

## Claim ledger

Type key — **R** Reported (traces to a source URL) · **B** Background (general
knowledge) · **I** Inference (connecting dots the sources didn't).

| ID | Claim | Type | Source(s) | Flags |
|----|-------|------|-----------|-------|
| C1 | The Lobito Corridor connects the Port of Lobito on Angola's Atlantic coast to the Copperbelt of the DRC and Zambia. | R | Wikipedia; Engineering News | — |
| C2 | The Angola section runs ~1,289 km from Lobito to Luau on the Angola–DRC border. | R | Engineering News (search summary) | number vs C4 — verify |
| C3 | The DRC section is ~450 km (Luau→Kolwezi), run under a track-access deal with SNCC. | R | Engineering News (search summary) | single-source — verify |
| C4 | Total Lobito→Kolwezi is ~1,700 km. | R | Engineering News (search summary) | **DISAGREES** with Wikipedia's "1,300 km" for "the corridor" — reconcile: 1,300 likely = Angola line only |
| C5 | Route runs via Benguela, Huambo, Kuito, Luena, Luacano, Luau. | R | Engineering News (search summary) | verify station list & order |
| C6 | LAR operates under a 30-year concession awarded by Angola in 2022; took over operations in 2024. | R | Wikipedia (Lobito Atlantic Railway); search summary | — |
| C7 | LAR is owned by Lobito Atlantic Holdings — a consortium of Trafigura, Mota-Engil, and Vecturis. | R | Trafigura; search summary | Engineering News names only Trafigura + Mota-Engil — confirm Vecturis |
| C8 | In December 2025 a $753m package closed: $553m US DFC + $200m DBSA. | R | Trafigura press; Railway Supply | **DISAGREES** with C9-adjacent Aug-2026 report of $786m — see flag |
| C9 | An Aug 4 2026 report states DBSA + US DFC reached financial close at **$786m**. | R | Engineering News 2026-08-04 | Reconcile with C8 — is $786m a later/expanded close, or the same deal restated? Verify before publishing either number |
| C10 | Rehabilitation is expected to raise Lobito's mineral capacity ~tenfold to 4.6 Mt/yr and cut mineral logistics costs up to 30%. | R | Trafigura / Railway Supply (search summary) | verify against primary press release |
| C11 | A separate greenfield extension adds ~800 km new track: ~280 km Angola (Luacano→Jimbe) + ~515 km Zambia (border→Chingola); led by AFC. | R | Intl Railway Journal; Ecofin; Energy Capital & Power | figures ~ — verify |
| C12 | Groundbreaking on the Luacano–Jimbe branch (~259–260 km) was set for 27 Jan 2026; broader Zambia line to break ground in 2026. | R | search summaries | **verify it actually happened** (date is in the past as of writing) |
| C13 | The corridor serves copper and cobalt from the Central African Copperbelt; Kolwezi is a major copper–cobalt centre. | R/B | Wikipedia (Kolwezi, Lobito Corridor) | — |
| C14 | The DRC produces the large majority of the world's mined cobalt. | B | — | **needs a source for the exact share** (do not publish a % without one) |
| C15 | Copperbelt ore has historically been exported east/south via ports including Dar es Salaam; Lobito offers a shorter, "quicker, cheaper, more reliable" Atlantic route. | R | Wikipedia (Lobito Corridor) | "quicker/cheaper" is Wikipedia's phrasing — attribute or independently source |
| C16 | China signed a ~$1.4bn deal to modernize the competing TAZARA railway (Dar es Salaam↔Kapiri Mposhi, ~1,860 km, Cape gauge); foundation stone laid 20 Nov 2025 in Lusaka; contractor CCECC. | R | Railway Gazette; TanzaniaInvest; The Chanzo | — |
| C17 | TAZARA was built in the 1970s with Chinese support to give Zambia a copper-export route bypassing white-minority-ruled Rhodesia and South Africa. | R/B | TanzaniaInvest; general history | — |
| C18 | The US frames its Lobito backing as "securing critical minerals for mutual U.S.–Africa benefit"; Lobito is a G7 PGII flagship. | R | US Embassy / DFC press | verify PGII framing wording |
| C19 | The Copperbelt's ore can now plausibly exit to *either* ocean — west via Lobito (Atlantic, US/EU-aligned) or east via TAZARA (Indian Ocean, China-aligned) — making the same landlocked ore body a node in great-power competition. | **I** | — (synthesis of C1/C15/C16/C18) | **This is the story's thesis and it is Inference/analysis. Never let it read as Reported.** Sources call the lines "competing"; the two-oceans/two-blocs framing is ours. |

**Ledger health check:** 1 Inference of 19 (~5%), and it's clearly the thesis
rather than smuggled-in fact. Well within the "kill it above ~40% Inference"
rule. The real risks here are the two **disagreements** (total length C4;
financing C8/C9) and one **unsourced background** number (cobalt share C14) —
all resolvable with primary sources.

---

## Verification pass — results (2026-08-09)

Resolved:
1. **Length** ✔ — Trafigura's release confirms **1,300 km = the Angola section
   (Lobito→Luau)**; ~1,700 km is through to Kolwezi. Wikipedia's "1,300 km" was
   the Angola line, as suspected.
2. **Consortium** ✔ — **Vecturis confirmed** (Trafigura, Mota-Engil, Vecturis).
3. **Capacity** ✔ — DFC's own release confirms the ~10× to 4.6 Mt/yr and up-to-30%
   cost figures.
4. **Cobalt share** ✔ — DRC ≈ **72% of world output (2025)**; pin to USGS/Statista
   before publishing the exact %.
5. **Coordinates** ✔ (partial) — verified: Lobito, Luau, Luacano (corrected to
   `[21.65, -11.217]`), Kolwezi, Chingola, Kapiri Mposhi, Dar es Salaam.

Also resolved (second pass):
6. **Financing** ✔ — reconciled as signing vs close: agreements **signed Dec 2025**;
   **financial close 31 Jul 2026 at $786m** (announced 4 Aug), *including* $553m DFC
   + $200m DBSA. Use $786m as the current close figure. No contradiction.
7. **Groundbreaking** ✔ — the Jan 27 2026 date did NOT hold. The greenfield line is
   in **EPC bid evaluation**; groundbreaking **late 2026 / early 2027**; its own
   financial close ~**Q1 2027**. Line length ~**830 km**.

Still open (carried into `sources.html`):
- **Cobalt share** (C14) — pin ~72% to a single citable source (USGS/Statista).
- **Coordinates** — **Jimbe** and the **Mbeya** waypoint on TAZARA still approximate.
- **PGII framing** (C18) still needs its own source.
- **Stage 4** — Harvey humanizes the prose, then `finalize.py` strips the tags.

---

## Sources (publisher · what it supports)

- Wikipedia — *Lobito Corridor* — route, minerals, 1,300 km, TAZARA competition, $1.4bn China deal: https://en.wikipedia.org/wiki/Lobito_Corridor
- Wikipedia — *Lobito Atlantic Railway* — concession, consortium: https://en.wikipedia.org/wiki/Lobito_Atlantic_Railway
- Wikipedia — *Lobito* — verified port coordinates: https://en.wikipedia.org/wiki/Lobito
- Wikipedia — *Kolwezi* — copper/cobalt mining centre: https://en.wikipedia.org/wiki/Kolwezi
- Engineering News (2026-08-04) — $786m financial close: https://www.engineeringnews.co.za/article/dbsa-us-dfc-reach-786m-financial-close-on-lobito-corridor-railway-project-2026-08-04
- Engineering News (2026-07-10) — corridor project update / route & km: https://www.engineeringnews.co.za/article/lobito-corridor-railway-project-angola-update-2026-07-10
- Trafigura — $753m secured (Dec 2025 close): https://www.trafigura.com/news-and-insights/press-releases/2025/lobito-atlantic-railway-secures-usd753-million-to-accelerate-development-in-angola/
- Railway Supply — $753m close, capacity/cost figures: https://www.railway.supply/lobito-atlantic-railway-upgrade-financing-closes-at-753m/
- US Embassy Angola / DFC — loan signing, "securing critical minerals" framing: https://ao.usembassy.gov/dfc-ceo-ben-black-signs-loan-agreement-for-lobito-atlantic-railway-securing-critical-minerals-for-mutual-u-s-africa-benefit/
- International Railway Journal — Zambia greenfield to start 2026: https://www.railjournal.com/regions/africa/zambia-lobito-rail-project-to-start-in-2026/
- Ecofin Agency — EPC evaluation, construction start: https://www.ecofinagency.com/news-infrastructures/2711-50894-lobito-corridor-enters-epc-evaluation-phase-as-afc-confirms-construction-start-next-year
- Energy Capital & Power — Zambia–Lobito break ground 2026: https://energycapitalpower.com/zambia-lobito-rail-project-to-break-ground-in-2026/
- Railway Gazette (2025-12-04) — TAZARA revitalisation launched: https://www.railwaygazette.com/infrastructure/2025/12/04/china-backed-tazara-revitalisation-officially-launched/
- TanzaniaInvest — TAZARA rehab launch, history: https://www.tanzaniainvest.com/transport/tazara-railway-rehabilitation-launch
- The Chanzo (2025-11-21) — TAZARA launch, Lusaka ceremony: https://thechanzo.com/2025/11/21/tanzania-zambia-and-china-launch-tazara-railway-rehabilitation/
