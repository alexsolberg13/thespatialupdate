# Slide text — Lake Powell post

DRAFT for Harvey to rewrite in his own voice. Seven slides plus the closing slide
(8 in all) and a caption. Every line below is the exact text on the slide, with the
ID of the claim it rests on in `dossiers/lake-powell.md` (the source record). **No
new facts:** every ID is a row already in that ledger (`C#` = claim, `S#` = source).
`site` marks the site's own words (wordmark, follow prompt, the word "Sources"),
which carry no claim.

`npm run render-slides` checks this file against the slides: it fails if a line of
slide text is missing here, if a line here is not on a slide, if an ID is not in the
dossier, or if the caption in `index.html` differs from the caption below.

Row **C7** (the "8 feet") is an arithmetic inference: 3,518.08 ft (C3) minus the
3,510 ft target (C5). It says only "above" the target. 3,510 is called a target,
never a minimum (see the dossier's C5 note).

---

## Slide 1 — cover
- **chip:** As of Sep 30, 2026 [C3]
- **kicker:** Colorado River [C1]
- **headline:** Lake Powell was 8 feet above its operating target [C3, C5, C7]
- **label:** Glen Canyon Dam [C16]

## Slide 2 — number
- **chip:** As of Sep 30, 2026 [C3]
- **kicker:** Lake Powell’s elevation [C3]
- **number:** 3,518 [C3]
- **unit:** feet [C3]
- **line:** Reclamation’s daily reading for September 30, 2026. [C3]

## Slide 3 — number
- **kicker:** Operating target [C5]
- **number:** 3,510 [C5]
- **unit:** feet [C5]
- **line:** Reclamation’s 2027–2028 rules aim to keep the lake at or above it. [C5]

## Slide 4 — number
- **kicker:** Consultation level [C6]
- **number:** 3,500 [C6]
- **unit:** feet [C6]
- **line:** If the lake is projected below this, the rules call for consultation on further actions. [C6]

## Slide 5 — number
- **kicker:** Minimum power pool [C4]
- **number:** 3,490 [C4]
- **unit:** feet [C4]
- **line:** At this level, water can only leave Glen Canyon Dam through the river outlet works. [C4]

## Slide 6 — map
- **kicker:** Where it sits [C16]
- **headline:** Two lakes behind two dams [C16]
- **line:** Powell sits behind Glen Canyon Dam; Mead sits behind Hoover Dam. [C16]
- **label:** Lake Powell [C16]
- **label:** Lake Mead [C16]
- **legend:** Reservoir [C16]
- **legend:** Dam [C16]

## Slide 7 — map
- **kicker:** 2027 and 2028 [C9]
- **headline:** 1.25 million acre-feet a year [C9]
- **line:** Deliveries to Arizona, California and Nevada drop; the split shown is their proposed sharing agreement. [C9, C10]
- **label:** Arizona [C10]
- **label:** −760,000 [C10]
- **label:** California [C10]
- **label:** −440,000 [C10]
- **label:** Nevada [C10]
- **label:** −50,000 [C10]
- **label:** Upper Division [C14, C21]
- **legend:** 2027–28 cut (acre-feet) [C9]
- **legend:** No required cut [C14]

## Slide 8 — closing
- **kicker:** Sources [site]
- **source:** Bureau of Reclamation, news release 5392, Aug 21, 2026 [S1]
- **source:** Record of Decision and 2027–2028 Operating Guidelines, Aug 2026 [S2, S3]
- **source:** Reclamation daily reservoir levels, Sep 30, 2026 [S4]
- **source:** Colorado River Compact, 1922 [S10]
- **source:** Map data: U.S. Census Bureau, Natural Earth (lakes at full pool, not today’s shoreline), © OpenStreetMap contributors [S7, S8, S9]
- **brand:** The Spatial Update [site]
- **follow:** Follow for the next story on the map. [site]

---

## Caption

Blank lines separate paragraphs. The caption is the sentences below, IDs removed.
At most 150 words.

- As of September 30, 2026, Lake Powell was 8 feet above its operating target. [C3, C5, C7]
- The lake stood at 3,518 feet. [C3]
- Reclamation’s 2027–2028 rules aim to keep it at 3,510 feet or higher. [C5]

- Two lines sit below. [C4, C6]
- At 3,500 feet, the rules call for consultation on further actions. [C6]
- At 3,490, the minimum power pool at Glen Canyon Dam, water can only leave through the river outlet works. [C4]

- Deliveries to Arizona, California and Nevada drop by 1.25 million acre-feet a year in 2027 and 2028. [C9]
- Reclamation’s documents require no cut from the four Upper Division states. [C14, C21]

- Sources are on the last slide. [site]
- #LakePowell #ColoradoRiver [site]

---

## Before posting

1. **Refresh the Powell level.** 3,518.08 ft is Reclamation's September 30, 2026
   daily row, and that page says its automatic reports "have not been checked for
   errors" (C3). Read the current number at
   https://www.usbr.gov/lc/region/g4000/hourly/levels.html. If it has moved, change
   the chip, "8 feet", "3,518" and the caption, then run `npm run render-slides`.
   The slides keep "As of Sep 30, 2026" on every slide that shows the lake's level
   (slides 1 and 2).
2. **3,510 is a target / buffer, not a floor** (C5). The Reclamation press release
   calls it a "minimum elevation"; the Operating Guidelines call it an operational
   buffer above a protected 3,500 ft. The slides use the Guidelines' wording.
3. **The split on slide 7 is conditional** (C10): the Lower Basin states' proposed
   sharing agreement. If it is not fully executed the Secretary decides. The slide
   line says "proposed".
4. **Division vs Basin.** The map says "Upper Division" and "No required cut" as the
   1922 Compact defines the Divisions (C21). Reclamation's press release says "Lower
   Basin States" for the same three states.
5. **Reservoir outlines are full-pool shapes** (Natural Earth), not today's
   shoreline; the closing slide says so. The Glen Canyon Dam point can sit slightly
   off the generalized lake outline (about 1 km).
6. **The slide maps are drawn from the story's GeoJSON, with no basemap.** The
   state and reservoir outlines and the dams are exactly the reel's data. Two
   label positions are display-only choices on slide 6 (Lake Mead) and slide 7
   (California, moved east of the reel's anchor so the name stays off the coast; the
   point at -119.2, 36.4 was checked by code to lie inside California).
