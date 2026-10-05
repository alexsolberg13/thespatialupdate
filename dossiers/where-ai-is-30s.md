# Source record — Where AI actually is, 30-second cut

**Slug:** `where-ai-is-30s` (format: reel only; a shorter cut of `where-ai-is`)
**Built:** 2026-10-05. Branch `claude/story-where-ai-is-30s`.
**Status:** Draft for Harvey's review. Nothing here is published until the report says so.
**Question the reel answers:** Same as `where-ai-is`: where are five big AI companies headquartered, and where are the largest AI data centers (Epoch AI's list)? Cut to about 30 seconds.

**This reel uses the same sources, claim ledger (C1 to C23), geometry and code checks as `dossiers/where-ai-is.md`.** Read that file for the source table, the "Could not open" and "Harvey to verify" lists, the geometry table and the independent check. `src/reels/where-ai-is-30s-data.geojson` is an identical copy of `src/reels/where-ai-is-data.geojson` (checked byte for byte).

## Claims used, and what changed from the longer cut

| Beat | On screen | Claims |
|------|-----------|--------|
| 1 | "Five AI headquarters within 60 km" | C1 to C6 |
| 2 | "93 sites, none with a California address"; "The ten largest US sites, by power" | C9, C10, C11, C23 |
| 3 | "Colossus 2 is 2,900 km away"; "Memphis, Tennessee, from OpenAI's headquarters" | C13, C19 |
| 4 | "Two states hold four of the ten" | C10, C16 |
| 5 | "Epoch covers about 43% of AI computing"; "Its own estimate, with a range of 23% to 81%" | C20 |

- **No new fact was added**; every line is a shortened version of a line already checked in the longer cut. The two new headline wordings are "93 sites, none with a California address" (C9 + C11) and "Colossus 2 is 2,900 km away" (C13 + C19; the sub names what it is measured from).
- **Dropped from this cut:** the San Francisco office sizes (C7, C8), the Memphis two-site total (C12), New Carlisle and Anthropic's use of it (C14), the Ohio sum (C15), Fairwater and Abilene (C17, C18) and the Malaysia note (C21). The ten pins are still the ten largest US sites, so the on-screen sub says "the ten largest US sites, by power".
- **The Malaysia caveat (C21) is not in the narration or on screen.** The longer cut says it; here the headline "93 sites" and "ten largest US sites" are scoped to Epoch's list and to the US.

### Code checks run (2026-10-05)
- GeoJSON copy is identical to the longer cut's file (which parses; 15 Point features; coordinates in the continental US box; 14 of 15 pins in the right state by point-in-polygon, Colossus 2 on the generalized line; see the longer dossier).
- Reel: `check-reels` (see the report for whether the basemap was stubbed). Voice: `check-voice` via the build.
