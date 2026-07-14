# Adding a New Story — Guide for Harvey

This is the how-to for adding a new story (a new map + article) to the
site. You do not need to know how to code. There's a script that builds
everything for you — you just answer some plain-English questions.

## What a "story" is made of

Every story on the site is 4 pieces:

1. **`src/stories/<slug>/index.md`** — the article text, plus the
   settings at the top (title, region, where the map starts centered,
   etc.). This is the file you'll edit by hand to write the actual story.
2. **`src/stories/<slug>/data.geojson`** — the dots that show up on the
   map, and the text that appears in the popup when someone clicks one.
3. **`src/_includes/sidebar-<slug>.njk`** — the small legend/toggle box
   that sits in the sidebar next to the map.
4. **An entry in `src/_data/stories.json`** — this is what makes the
   story show up as a dot on the homepage map, in the `/stories/` list,
   in the sitemap, and in the RSS feed. If a story is missing from any of
   those, this is almost always why — its entry got left out.

`<slug>` is just the title turned into a web-safe folder name, e.g.
"Puget Sound Ferries" becomes `puget-sound-ferries`.

The script below creates all 4 pieces at once, already wired together
and working, with one placeholder dot on the map. You then go back and
replace the placeholder text and add your real map points.

## Step 1 — Open a terminal in VS Code

Press **Ctrl + `** (the backtick key, top-left of most keyboards, under
Esc) to open VS Code's built-in terminal. It should already say
"PowerShell" at the top.

## Step 2 — Run the script

Type this and press Enter:

```
py scripts\new_story.py
```

It will ask you questions one at a time — just type an answer and press
Enter. Where a question shows a number list, type the number. Where it
shows `[Press Enter to use: ...]`, pressing Enter with nothing typed
just accepts that default.

You'll be asked for:

- **Story title** — the headline, e.g. "Puget Sound Ferries: A System Under Strain"
- **One-sentence description** — shown in the homepage popup and story cards
- **Region** — pick a number from the list of existing regions, or choose "type a new one"
- **Category** — pick a number: news / economy / geography / demographics / military
- **Tag** — a short label for the homepage; a sensible default is suggested, just press Enter to accept it, or type your own
- **Location** — paste the coordinates you copied from Google Maps (see Step 3 below)
- **Dot color** — pick a number: gold, red, teal, or blue (see meanings below)
- **Zoom** — how close the map starts zoomed in; press Enter for the default
- **Byline** — press Enter for a sensible default, or type your own

**Dot colors, and what they usually mean on this site:**
- **red** — conflict / military
- **teal** — cooperation / geography
- **gold** — economy / news
- **blue** — everything else / general

At the end it shows a summary of everything and asks **"Create this
story? (y/n)"**. Type `y` and press Enter. It then prints exactly which
files it made and what to do next.

## Step 3 — Getting coordinates from Google Maps

1. Open [Google Maps](https://maps.google.com) in your browser.
2. Right-click the exact spot you want the story centered on.
3. At the top of the menu that pops up, you'll see two numbers, like
   `47.5301, -122.6362`. Click them — this copies them to your clipboard.
4. Paste that straight into the script when it asks for "Location."

That's latitude first, then longitude — exactly the order Google gives
it to you. **Just paste it as-is; the script does the lat/lon conversion
for you.** (More on why this matters in Step 5 below — it's the single
easiest thing to get backwards when editing the map by hand later.)

If you paste something that only makes sense flipped around, the script
will notice and ask you to confirm before continuing.

## Step 4 — Write the story text

Open `src/stories/<slug>/index.md`. Below the `---` block near the top
(that's the settings the script filled in — you don't need to touch it),
you'll see two placeholder paragraphs. Replace them with your real
writing. Add as many paragraphs as you like — just leave a blank line
between each one.

## Step 5 — Add more dots to the map

Open `src/stories/<slug>/data.geojson`. The script starts you off with
one dot, sitting right on the story's main coordinates. Add more by
pasting additional entries inside the `"features": [ ... ]` list.

Here's a full point you can copy, paste, and edit. Paste it right after
an existing `}` inside the features list, and add a comma after the
*previous* entry's closing `}` (JSON needs a comma between list items,
but not after the very last one):

```json
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-122.335, 47.608] },
      "properties": {
        "type": "point",
        "title": "Colman Dock, Seattle",
        "description": "The busiest ferry terminal in the system, serving over 9 million riders a year.",
        "stat": "9M riders/year"
      }
    }
```

**Important — `coordinates` is `[longitude, latitude]`.** That's the
*opposite* order from what Google Maps gives you (which is latitude
first). If you're copying a new point straight from Google Maps, flip
the two numbers before pasting them in here. This is the single most
common mistake — see Troubleshooting below for what it looks like when
you get it wrong.

The default map layer the script sets up reads these properties on each
point automatically — stick to them and everything (including the
click popup) just works:
- `type` — a category label of your choosing (e.g. `"point"`); doesn't
  need to match anything, it's just there for your own organization
- `title` — bold headline in the popup
- `description` — the paragraph of text in the popup
- `stat` — optional; a short highlighted figure at the top of the popup
  (e.g. `"9M riders/year"`); leave it out entirely if you don't have one

**This file must stay valid JSON.** If you're not sure you got the
commas right, paste the whole file into [jsonlint.com](https://jsonlint.com)
and click Validate — it'll point to the exact line that's broken.

**Optional — an easier way to place points:** [geojson.io](https://geojson.io)
lets you click on a map to drop points (or draw lines/shapes) visually,
then copy the GeoJSON it generates straight into this file. If you use
it, just make sure each point still has `type`, `title`, and
`description` in its `properties` so the popup shows correctly.

## Step 6 — Preview it

In the terminal, run:

```
npm start
```

Then open **http://localhost:8080** in your browser and click through to
your new story from the homepage map or the `/stories/` list. Press
`Ctrl+C` in the terminal when you're done previewing.

## Step 7 — Publish it

If you want to double check the site builds cleanly first, run:

```
npm run build
```

That regenerates everything in `docs/` (the folder GitHub Pages
publishes from). If it finishes without red error text, you're good.

Then, in VS Code's **Source Control** tab (the icon with branching lines
in the left sidebar):

1. Type a short message describing what you added (e.g. "Add Puget
   Sound ferries story").
2. Click the checkmark (Commit).
3. Click **Sync Changes** / **Push**.

The live site rebuilds automatically a minute or two after you push —
no other steps needed.

## Testing note

`py scripts\new_story.py --defaults` skips all the questions and creates
a canned story called "Test Story (delete me)" instead. **This is for
testing the script only** — don't use it for a real story. If you ever
see a story with that name, it's safe to delete: remove its folder under
`src/stories/`, its `sidebar-*.njk` file under `src/_includes/`, and its
entry in `src/_data/stories.json`.

## Troubleshooting

**Build error mentioning `sidebarInclude`**
Every story's `index.md` needs a `sidebarInclude:` line in the settings
block pointing at a real file, e.g. `sidebar-puget-sound-ferries.njk`.
If it's missing, empty, or misspelled (doesn't exactly match a file in
`src/_includes/`, including the `sidebar-` prefix and `.njk` ending),
the whole build breaks. The script always fills this in correctly for
new stories — this mostly matters if you're hand-editing an existing
one.

**A dot shows up in the ocean, or somewhere obviously wrong**
This is almost always swapped coordinates — longitude and latitude
written in the wrong order. Remember: Google Maps gives you
"latitude, longitude", but every coordinate stored in this site's files
(in `index.md` and in `data.geojson`) is written the opposite way,
`[longitude, latitude]`. Double check the order wherever you hand-edited
a coordinate.

**A story doesn't show up on the homepage or in `/stories/`**
Check `src/_data/stories.json` — the story needs its own entry there
(region, coordinates, tag, type, title, description, url, color). The
script adds this automatically when you create a story through it; this
usually only comes up if an entry got deleted or a story's files were
copied by hand instead of using the script.

**The map loads but shows no dots at all**
Check `data.geojson` for a JSON mistake (usually a missing or extra
comma) — see Step 5 above for how to validate it.

**"A story already exists at src/stories/..."**
The script won't overwrite a story with the same title/slug — it either
picks the next available name automatically (adding `-2`, `-3`, etc.) or
tells you so. If you really meant to redo an existing story, delete its
folder under `src/stories/`, its `sidebar-*.njk` file, and its entry in
`src/_data/stories.json` first.

**Something else looks wrong**
Run `npm start` and read the terminal — it usually names the exact file
and line. If you're stuck and haven't pushed yet, you can always discard
the changes from the Source Control tab and start over.
