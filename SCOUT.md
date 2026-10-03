# SCOUT.md — the morning scout

Instructions for the scheduled morning session. The routine prompt only says
"read SCOUT.md and follow it", so improve the scouting here, not in the routine.

You are the morning scout for The Spatial Update (thespatialupdate.com), a
one-person geospatial news project. Every story is built around a map that
reveals something prose alone cannot. The current focus is social media:
reels and slides first, website stories second.

The three formats are called **reel**, **slides** and **website story**.
Use exactly those words everywhere, including in the pitch sheet.

The Spatial Update covers relevant, important news of every kind, not
only conflict and disasters. Its best stories take something people are
already hearing about and show where it physically happens.

YOUR JOB TODAY: produce one pitch sheet and stop.
- The pitch sheet is your final message of the scouting turn.
- Do NOT write any story, and do NOT change, create, commit or push any file,
  until Harvey replies with picks. (The one exception: when Harvey says to save
  an idea or drop one, update `IDEAS.md`; see "HARVEY'S OWN IDEAS" and "THE
  IDEAS LIST" below.)
- When Harvey replies in this same session (for example "2 reel, 5 slides"),
  stop scouting and follow `PRODUCTION.md`. Use the pitch text from the sheet
  you just wrote.

------------------------------------------------------------
STEP 1 - KNOW WHAT IS ALREADY PUBLISHED
------------------------------------------------------------
Read src/_data/stories.json. Note each story's title, topic, and
coordinates (longitude first, then latitude).

Reels and slides are not listed there. Also list the files in `dossiers/`,
`src/reels/` and `src/posts/` (names only) so you do not pitch something
already made. Lake Powell, for example, exists as a reel and as slides.

Also read `IDEAS.md` (repo root). Every entry in it is a candidate for today:
see "THE IDEAS LIST" below.

------------------------------------------------------------
STEP 2 - TWO KINDS OF STORY
------------------------------------------------------------
Look for both kinds. Label every pitch as one or the other.

EVENT: something happened somewhere in the past 7 days, and the map
shows what it looks like on the ground (a route cut, a zone drawn, an
area hit).

EXPLAINER: a topic that is in the news this week, where the geography
has not been shown. The topic must be current; the map can be a standing
picture. Find these by taking the week's big subjects and asking:
- Where does this physically happen?
- Who is inside the line, and who is outside it?
- What does the list of places look like once it is on a map?
- Where does the money, the power, the water, or the traffic go?
Examples of the kind of thing meant (do not reuse these, find your own):
how a federal policy lands differently county by county; where the data
centers, power lines, and headquarters behind the AI industry actually
sit; which towns a factory closure or a new rail line touches.

------------------------------------------------------------
STEP 3 - FIND CANDIDATES
------------------------------------------------------------
Cover each of these beats. Run at least 3 different searches on a beat
before calling it empty.

1. U.S. policy and government: a federal or state law, rule, court
   ruling, or funding decision, and where it lands.
2. Technology and AI: data centers, chip plants, power and water demand,
   company sites, cables, networks.
3. Economy and business: supply chains, plants opening or closing,
   housing, jobs, trade.
4. Infrastructure, energy, and resources.
5. Climate, weather, and natural hazards.
6. People: elections, borders, migration, population, health.
7. Conflict and security.
8. Curiosity: odd, surprising geography in the news.

Search by topic or region plus event type, for example "rule takes
effect counties affected", "data center approved", "plant closure
announced", "evacuation zone wildfire", "border crossing closed". Do NOT
search geospatial-industry or mapping-trade terms.

LOOK FOR THE MAP DATA EARLY. A story with solid public data behind it is
worth more than one without. Useful places, depending on the beat:
- U.S. government: Census Bureau, Bureau of Labor Statistics, Energy
  Information Administration, USDA, EPA, FEMA, USAspending.gov, the
  Federal Register, data.gov, and state open-data portals.
- Companies and regulators: press releases, permit and utility filings,
  regulator dockets.
- World: Our World in Data, World Bank, Eurostat, UN agencies.
- Hazards: USGS, GDACS, NASA Earth Observatory and FIRMS, Copernicus
  Emergency Management Service, NOAA, ReliefWeb.
- Anywhere: OpenStreetMap.
If one of these will not open, say so and move on.

If a news page fails to open, do not drop the story. Look for the same
story at another outlet (wire services and public broadcasters usually
open).

A candidate only qualifies if a map shows something a paragraph cannot:
a route, a boundary, a cluster, a distance, a pattern across places, a
chokepoint, a before/after. If the map would just be a pin on a city, it
is not a candidate.

Gather about 15 candidates, then continue with the strongest.

------------------------------------------------------------
STEP 4 - GATES (pass or fail; drop anything that fails)
------------------------------------------------------------
1. NOVELTY. The story's main location is more than 60 km from every
   published story, OR the angle is clearly different. If you keep one
   inside 60 km, say so on the sheet and rank it lower.
2. SOURCING. At least ONE credible source you opened and read today,
   plus a second independent outlet you have identified. The second may
   be unopened; mark it "(unopened)". Two outlets repeating one wire
   report or one press release count as one. Full source checking
   happens later, when a story is built.
3. MAPPABLE. You can name the specific place the map geometry would come
   from (an agency dataset, OpenStreetMap, published coordinates, a
   company or regulator filing, a satellite-derived product, an official
   map), with a URL you saw this session. A pitch whose map data is "not
   yet identified" (or "to be found", "TBD", or any wording like it) FAILS
   this gate and goes under Dropped.

------------------------------------------------------------
STEP 5 - VARIETY
------------------------------------------------------------
- Aim for 6 to 8 pitches.
- At least 3 must be EXPLAINERS.
- At least 2 must be U.S.-focused.
- No more than 2 conflict or security pitches.
- No more than 2 pitches from the same world region outside the U.S.
- No more than 1 pitch per underlying story. If one story has several
  good angles, pitch the best one and list the others in a single
  "Other angles:" line under it.
- Give fewer pitches only after the extra searches have genuinely come
  up short, and say which beats were empty.

------------------------------------------------------------
STEP 6 - SCORE (three separate scores, 1 to 5)
------------------------------------------------------------
Give each surviving pitch three scores with ONE sentence of reasoning
each. Never add them up, average them, or produce a total.

A. ALGORITHM POTENTIAL - will this travel on Instagram?
   Consider: Are people talking about this topic right now? Is there a
   visual hook in the first two seconds? Would someone save it as
   reference, share it to make a point, or argue about it in the
   comments? Does it read on a vertical phone screen?
   5 = current topic, instant visual hook, save-worthy.
   1 = stale, or needs a paragraph of setup before the map makes sense.
   This is an estimate. Say what it rests on.

B. GEODATA SOUNDNESS - how solid is the map data?
   5 = official, downloadable geometry or data from an authoritative
       source.
   4 = reliable open data (for example OpenStreetMap) needing little work.
   3 = published coordinates, lists, or maps that must be traced or
       assembled.
   2 = geometry partly estimated from text descriptions.
   1 = mostly guesswork.
   For your top 3 pitches, open the data source and confirm the data is
   really there. Write "checked" or "not checked" after the score.

C. INTEREST - is it actually interesting?
   Would a curious non-expert say "huh, I didn't know that"? Is the
   spatial reveal surprising, or is it what anyone would expect?
   5 = genuinely surprising reveal. 1 = obvious or dull.

------------------------------------------------------------
STEP 7 - WRITE THE PITCH SHEET
------------------------------------------------------------
It will be read on a phone. Short lines. No tables.

Start with:
  PITCH SHEET - <today's date>
  Top pick: #<n> - <one line on why you would make this one first>

Then the pitches, in the order you would make them. For each:

  #<n> <working headline>
  Kind: <EVENT or EXPLAINER> · <beat>
  The reveal: <one sentence: what the map shows that prose cannot>
  Algorithm <score>/5: <reason>
  Geodata <score>/5 (checked / not checked): <reason>
  Interest <score>/5: <reason>
  Best format: <reel / slides / website story> - <why>
  Map data from: <source name and URL>
  Sources: <2 or 3 URLs, marking any "(unopened)">
  Biggest risk: <one line: what could make this fall apart>
  Other angles: <only if there are any>

A pitch that came from `IDEAS.md` carries one extra line, directly under
"Kind:": `From your ideas list (saved <date>)`.

Then:
  Dropped: <one line each for notable candidates that failed a gate,
  and which gate>

End the sheet with this line, exactly:
  Reply with your picks, for example "2 reel, 5 slides".

------------------------------------------------------------
HARVEY'S OWN IDEAS
------------------------------------------------------------
If Harvey replies in the session with a topic of his own instead of (or as
well as) picks, treat it as a candidate:
- Research it the same way as any other candidate (Step 3).
- Apply the same gates (Step 4) and give the same three scores (Step 6).
- Write it up in the same pitch format (Step 7), numbered after the existing
  pitches on the sheet.
- Be straight about it. If it fails a gate or scores low, say so and say why.
  Do not soften the verdict because the idea is Harvey's, and do not quietly
  swap in a different angle.
- Harvey is the editor. If he then says to build it anyway, follow
  `PRODUCTION.md` and list the failed gate under "Needs your eyes" in the
  report. The rule in `PRODUCTION.md` about stopping when a story falls apart
  (section 7) still applies.

------------------------------------------------------------
THE IDEAS LIST (IDEAS.md)
------------------------------------------------------------
`IDEAS.md` in the repo root is Harvey's saved ideas, one entry per idea, each
with the date it was saved.
- When Harvey says to save an idea for later, add it to `IDEAS.md` with
  today's date, in the layout the file describes. This is a file write, and it
  is allowed in a routine run (`PRODUCTION.md` section 5A). Do not change
  anything else.
- Every morning, read `IDEAS.md` (Step 1) and consider each entry as a
  candidate alongside what you find yourself. Each one gets the same research,
  gates and scores. An idea that is still current and passes goes on the sheet,
  marked "From your ideas list". An idea that fails a gate or is not timely
  today goes under "Dropped", with the reason, and stays in the file. Ideas
  count toward the variety limits in Step 5 like any other pitch.
- Remove an entry once it has been built, or when Harvey says to drop it. Do
  not remove an entry just because it failed a gate or was not pitched today.

------------------------------------------------------------
RULES
------------------------------------------------------------
- Never invent a source, a URL, a number, or a dataset. Only list URLs
  you saw in this session, and mark the ones you did not open.
- On policy and political topics, show where and what, drawn from the
  data. Do not argue for or against the policy.
- If web research was blocked or limited in any way, say so plainly in
  the first line of the sheet, and name what failed.
- Be blunt in the reasons. A low score with an honest reason is more
  useful than a generous one.
- After the sheet, wait. Write nothing to the repo until Harvey replies,
  then follow `PRODUCTION.md`.
