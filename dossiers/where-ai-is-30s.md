# Source record — Where AI actually is, 30-second cut

**Slug:** `where-ai-is-30s` (format: reel only; a shorter cut of `where-ai-is`)
**Built:** 2026-10-05. Branch `claude/story-where-ai-is-30s`.
**Status:** Draft for Harvey's review. Nothing here is published until the report says so.
**Question the reel answers:** Same as `where-ai-is`: where are five big AI companies headquartered, and where are the largest AI data centers (Epoch AI's list)? Cut to about 30 seconds.

**This reel uses the same sources, claim ledger (C1 to C23), geometry and code checks as `dossiers/where-ai-is.md`.** Read that file for the source table, the "Could not open" and "Harvey to verify" lists, the geometry table and the independent check. `src/reels/where-ai-is-30s-data.geojson` is an identical copy of `src/reels/where-ai-is-data.geojson` (checked byte for byte).

## Claims used, and what changed from the longer cut

| Beat | On screen | Claims |
|------|-----------|--------|
| 1 | "Five AI headquarters within about 60 km" | C1 to C6 |
| 2 | "93 sites, none listed in California"; "Epoch's ten largest US sites, by power" | C9, C10, C11, C23 |
| 3 | "Colossus 2 sits 2,900 km from OpenAI"; "Memphis, Tennessee, in a straight line" | C13, C19 |
| 4 | "Two states hold four of the ten" | C10, C16 |
| 5 | "Epoch covers about 43% of AI computing"; "Its own estimate, with a range of 23% to 81%" | C20 |

- **No new fact was added**; every line is a shortened version of a line already checked in the longer cut. The two new headline wordings are "93 sites, none listed in California" (C9 + C11) and "Colossus 2 sits 2,900 km from OpenAI" (C13 + C19; the sub says it is a straight line).
- **Dropped from this cut:** the San Francisco office sizes (C7, C8), the Memphis two-site total (C12), New Carlisle and Anthropic's use of it (C14), the Ohio sum (C15), Fairwater and Abilene (C17, C18) and the Malaysia note (C21). The ten pins are still the ten largest US sites, so the on-screen sub says "Epoch's ten largest US sites, by power" and the narration says the ten largest in the US are on the map.
- **The Malaysia caveat (C21) is not in the narration or on screen.** The longer cut says it; here the headline "93 sites" and "ten largest US sites" are scoped to Epoch's list and to the US.

### Code checks run (2026-10-05)
- GeoJSON copy is identical to the longer cut's file (which parses; 15 Point features; coordinates in the continental US box; 14 of 15 pins in the right state by point-in-polygon, Colossus 2 on the generalized line; see the longer dossier).
- Reel: `check-reels` (see the report for whether the basemap was stubbed). Voice: `check-voice` via the build.

## Independent check (2026-10-05)

A separate agent with no access to the drafting re-opened the Epoch CSV and hub page as raw text (the other sources only through the dossier). **No wrong number found**: 60.4 km, 2,898 km, 93 rows, the ten, four of ten in Indiana and Ohio, 43% (23% to 81%) all recomputed. It flagged, and what was done:

1. "93 sites, none with a California address" overstated, because 13 rows have no address. Headline now "93 sites, none listed in California"; narration keeps "none has a California address listed".
2. "93 sites" is worldwide and the ten pins are the US ten, which reads as the ten largest of the 93. Beat 2's sub now says "Epoch's ten largest US sites, by power" and the narration adds "The ten largest in the US are on this map."
3. "Colossus 2 is 2,900 km away" did not say from what, and read as a tease. Now "Colossus 2 sits 2,900 km from OpenAI", sub "Memphis, Tennessee, in a straight line"; narration says "The biggest of them".
4. "within 60 km" is strictly 60.4 km. Now "within about 60 km".
5. Beat 5's kicker "What's missing" read as a tease. Now "Epoch's coverage".

Left as is: Meta's and Nvidia's pins are city centres (stated in the longer dossier's Geometry table); the Epoch hub now dates its 43% estimate "as of October 5" (the longer dossier says October 4; the reel chip says "As of Oct 2026").
