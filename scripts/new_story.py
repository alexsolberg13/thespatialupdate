#!/usr/bin/env python3
"""
new_story.py -- New Story wizard for The Spatial Update.

Creates everything a new story needs:
  - src/stories/<slug>/index.md         (front matter + story text)
  - src/stories/<slug>/data.geojson      (the dots that show on the map)
  - src/_includes/sidebar-<slug>.njk     (the sidebar legend/toggle box)
  - appends one entry to src/_data/stories.json (homepage map + /stories/ index)

USAGE (Windows / VS Code PowerShell terminal, from the repo root):

    py scripts\\new_story.py

That starts a friendly wizard that asks one question at a time. Just
answer each question and press Enter. See STORY-GUIDE.md at the repo
root for the full walkthrough (with pictures of what each step looks
like and how to add more map points afterward).

For automated testing only (creates a canned "Test Story (delete me)"
entry with no prompts -- not meant for real stories):

    py scripts\\new_story.py --defaults

Stdlib only. Works the same on Windows and on Linux/Mac.
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

# ----------------------------------------------------------------------
# Windows console gotcha:
# PowerShell's console codepage is sometimes not UTF-8, and this script
# prints characters like the middle dot "·" (used in tags/bylines, e.g.
# "Iran · Military"). Without this, Python can crash with a
# UnicodeEncodeError on some Windows setups the moment it tries to print
# one of those characters. Forcing UTF-8 with errors="replace" means the
# script never crashes because of a console encoding mismatch.
# ----------------------------------------------------------------------
for _stream_name in ("stdout", "stderr", "stdin"):
    _stream = getattr(sys, _stream_name, None)
    if _stream is not None and hasattr(_stream, "reconfigure"):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

# ----------------------------------------------------------------------
# Setup / constants
# ----------------------------------------------------------------------

SCRIPT_PATH = Path(__file__).resolve()
REPO_ROOT = SCRIPT_PATH.parent.parent  # scripts/ -> repo root

STORIES_DIR = REPO_ROOT / "src" / "stories"
INCLUDES_DIR = REPO_ROOT / "src" / "_includes"
STORIES_JSON = REPO_ROOT / "src" / "_data" / "stories.json"

TYPE_CHOICES = ["news", "economy", "geography", "demographics", "military"]

# value -> (hex color, one-line description of what it usually means here)
COLOR_INFO = {
    "gold": ("#e8c87a", "economy / news"),
    "red": ("#e05a4e", "conflict / military"),
    "teal": ("#3ecfb2", "cooperation / geography"),
    "blue": ("#5b9bd5", "other / general"),
}
COLOR_CHOICES = list(COLOR_INFO.keys())


# ----------------------------------------------------------------------
# Small helpers
# ----------------------------------------------------------------------

def slugify(text):
    """Turn a title into a URL-safe, hyphenated slug."""
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-{2,}", "-", text)
    return text.strip("-")


def unique_slug(base_slug):
    """Return a slug that doesn't collide with an existing story folder.

    If src/stories/<base_slug>/ already exists, tries base_slug-2,
    base_slug-3, etc. and returns the first one that's free (and whether
    it had to change, so callers can tell the user).
    """
    candidate = base_slug
    n = 2
    while (STORIES_DIR / candidate).exists():
        candidate = "%s-%d" % (base_slug, n)
        n += 1
    return candidate, candidate != base_slug


def yaml_str(value):
    """Render a Python string as a safe double-quoted YAML scalar.

    json.dumps produces JSON-style escaping (quotes, backslashes, control
    chars), which is also valid inside a YAML double-quoted scalar, so
    this is a safe (and simple) way to get arbitrary text into front
    matter without worrying about YAML's own quoting rules.
    """
    return json.dumps(str(value), ensure_ascii=False)


def indent_block(text, spaces=2):
    """Indent every non-blank line of a multi-line string.

    Used for YAML literal block scalars (the `key: |` fields) -- every
    line of the block needs a consistent indent, but fully blank lines
    are left alone since YAML doesn't require (or want) trailing
    whitespace on them.
    """
    pad = " " * spaces
    lines = text.split("\n")
    return "\n".join((pad + line) if line.strip() else "" for line in lines)


def load_stories():
    """Load src/_data/stories.json, returning [] if it's missing/broken."""
    if not STORIES_JSON.exists():
        return []
    try:
        data = json.loads(STORIES_JSON.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return data
    except (OSError, ValueError):
        pass
    return []


def existing_regions(stories):
    regions = []
    for entry in stories:
        r = entry.get("region")
        if r and r not in regions:
            regions.append(r)
    return regions


def in_range_lat(x):
    return -90.0 <= x <= 90.0


def in_range_lon(x):
    return -180.0 <= x <= 180.0


# ----------------------------------------------------------------------
# Generic prompt helpers (all plain ASCII-safe, one question at a time)
# ----------------------------------------------------------------------

def ask_text(prompt, example=None, default=None, allow_blank=False):
    """Ask a free-text question.

    - If `default` is given, pressing Enter returns that default.
    - Otherwise, if `allow_blank`, pressing Enter returns "".
    - Otherwise it keeps asking until something is typed.
    """
    suffix = "  (e.g. %s)" % example if example else ""
    if default is not None:
        suffix += "\n  [Press Enter to use: %s]" % default
    while True:
        raw = input("%s%s\n> " % (prompt, suffix)).strip()
        if raw:
            return raw
        if default is not None:
            return default
        if allow_blank:
            return ""
        print("  Please enter something.\n")


def ask_yes_no(prompt, default_yes=True):
    hint = "Y/n" if default_yes else "y/N"
    while True:
        raw = input("%s (%s)\n> " % (prompt, hint)).strip().lower()
        if raw == "":
            return default_yes
        if raw in ("y", "yes"):
            return True
        if raw in ("n", "no"):
            return False
        print("  Please answer y or n.\n")


def ask_choice_from_list(prompt, options, allow_custom_label=None):
    """Show a numbered list; return the chosen string.

    If allow_custom_label is given, an extra final option lets the user
    type a value that isn't in the list.
    """
    print(prompt)
    for i, opt in enumerate(options, start=1):
        print("  %d. %s" % (i, opt))
    custom_num = None
    if allow_custom_label:
        custom_num = len(options) + 1
        print("  %d. %s" % (custom_num, allow_custom_label))
    while True:
        raw = input("> ").strip()
        if raw.isdigit():
            n = int(raw)
            if 1 <= n <= len(options):
                return options[n - 1]
            if custom_num and n == custom_num:
                return ask_text("Type your own value:")
        print("  Please enter a number from the list above.\n")


def ask_color():
    print("Dot color on the homepage map? (what it usually means on this site)")
    for i, name in enumerate(COLOR_CHOICES, start=1):
        _, meaning = COLOR_INFO[name]
        print("  %d. %s  -  %s" % (i, name, meaning))
    while True:
        raw = input("> ").strip()
        if raw.isdigit():
            n = int(raw)
            if 1 <= n <= len(COLOR_CHOICES):
                return COLOR_CHOICES[n - 1]
        print("  Please enter a number from the list above.\n")


def parse_latlon_pair(raw):
    """Parse a 'lat, lon' string as copied from Google Maps.

    Google Maps always gives latitude first, then longitude, e.g.
    "47.5301, -122.6362". This returns (lat, lon, was_swapped) where
    was_swapped is True only when the numbers as typed don't make sense
    as (lat, lon) but DO make sense the other way around -- i.e. the
    #1 gotcha of this whole script: story front matter and GeoJSON both
    need coordinates as [longitude, latitude], the OPPOSITE order from
    what Google Maps copies. We parse in the human (lat, lon) order
    here, and the caller is responsible for writing them out as
    [lon, lat] wherever they're saved to a file.
    """
    nums = re.findall(r"-?\d+(?:\.\d+)?", raw)
    if len(nums) < 2:
        raise ValueError(
            "Could not find two numbers in that. Paste it exactly as Google "
            "Maps gives it, e.g. 47.5301, -122.6362"
        )
    a, b = float(nums[0]), float(nums[1])

    as_given_ok = in_range_lat(a) and in_range_lon(b)
    swapped_ok = in_range_lat(b) and in_range_lon(a)

    if as_given_ok:
        # Either it's unambiguous, or both orderings happen to be
        # possible (e.g. 32.5, 53.0) -- in that common case we trust
        # the order the user typed, since that's the Google Maps order.
        return a, b, False
    if swapped_ok:
        # Only makes sense the other way around.
        return b, a, True
    raise ValueError(
        "Those numbers don't work as latitude/longitude either way "
        "(latitude must be -90 to 90, longitude -180 to 180). "
        "Please re-paste the coordinates from Google Maps."
    )


def ask_latlon():
    print(
        "Location -- paste the coordinates from Google Maps (right-click the\n"
        "spot -> click the numbers to copy). They look like:\n"
        "  47.5301, -122.6362"
    )
    while True:
        raw = input("> ").strip()
        try:
            lat, lon, was_swapped = parse_latlon_pair(raw)
        except ValueError as e:
            print("  %s\n" % e)
            continue
        if was_swapped:
            confirmed = ask_yes_no(
                "  That only makes sense flipped around -- did you mean "
                "latitude %s, longitude %s?" % (lat, lon)
            )
            if not confirmed:
                print("  Okay, let's try again.\n")
                continue
        return lat, lon


def ask_zoom():
    while True:
        raw = input(
            "Zoom level -- how close the map starts zoomed in (2 = wide area, "
            "12 = a single city). Press Enter for the default (5).\n> "
        ).strip()
        if raw == "":
            return 5.0
        try:
            z = float(raw)
        except ValueError:
            print("  Please enter a number, or just press Enter.\n")
            continue
        if 2 <= z <= 12:
            return z
        print("  Zoom is usually between 2 and 12.\n")


# ----------------------------------------------------------------------
# Interactive wizard
# ----------------------------------------------------------------------

def run_interactive():
    print("=" * 60)
    print("  New Story Wizard -- The Spatial Update")
    print("=" * 60)
    print()

    title = ask_text(
        "What's the story called?",
        example="The Strait of Hormuz: Oil's Most Critical Passage",
    )
    print()

    description = ask_text(
        "One-sentence description (used in the map popup and story cards)?",
        example="21 million barrels of oil transit this chokepoint every day.",
    )
    print()

    stories = load_stories()
    regions = existing_regions(stories)
    region = ask_choice_from_list(
        "Region? Pick an existing one, or type a new one.",
        regions,
        allow_custom_label="Type a new region",
    ) if regions else ask_text("Region?", example="Middle East")
    print()

    story_type = ask_choice_from_list(
        "Category? (one of the 5 story types)",
        TYPE_CHOICES,
    )
    print()

    tag_default = "%s · %s" % (region, story_type.capitalize())
    tag = ask_text(
        "Tag (short label shown on the homepage)?",
        default=tag_default,
    )
    print()

    lat, lon = ask_latlon()
    print()

    color = ask_color()
    print()

    zoom = ask_zoom()
    print()

    month_year = datetime.now().strftime("%B %Y")
    byline_default = "Updated %s · Data: add your sources here" % month_year
    byline = ask_text(
        "Byline (shown under the headline)?",
        default=byline_default,
    )
    print()

    return dict(
        title=title,
        description=description,
        region=region,
        tag=tag,
        type=story_type,
        color=color,
        lat=lat,
        lon=lon,
        zoom=zoom,
        byline=byline,
    )


def build_defaults_answers():
    """Canned answers for `--defaults` -- automated testing only.

    Creates a clearly-fake "Test Story (delete me)" entry so the whole
    pipeline (files + stories.json + an eleventy build) can be exercised
    without a human sitting at the keyboard. Not meant for real stories.
    """
    month_year = datetime.now().strftime("%B %Y")
    return dict(
        title="Test Story (delete me)",
        description="A canned test entry created by --defaults to check the story script end to end.",
        region="Test Region",
        tag="Test Region · News",
        type="news",
        color="blue",
        lat=47.6062,
        lon=-122.3321,
        zoom=5.0,
        byline="Updated %s · Data: add your sources here" % month_year,
    )


# ----------------------------------------------------------------------
# File content generation
# ----------------------------------------------------------------------

def build_map_layers_js(color_hex):
    """Runs inside map.on('style.load'), right after the 'story-data'
    source has been created from ./data.geojson. Draws every feature in
    that source as a colored circle, and wires up a click popup built
    defensively (and safely, via escapeHtml) from each feature's
    properties: title, description, and optional stat."""
    return (
        "map.addLayer({\n"
        "  id: 'story-dot', type: 'circle', source: 'story-data',\n"
        "  paint: {\n"
        "    'circle-radius': 7,\n"
        "    'circle-color': '%s',\n"
        "    'circle-opacity': 0.92,\n"
        "    'circle-stroke-width': 1.5,\n"
        "    'circle-stroke-color': 'rgba(255,255,255,0.15)'\n"
        "  }\n"
        "});\n"
        "\n"
        "function escapeHtml(value) {\n"
        "  return String(value === undefined || value === null ? '' : value).replace(/[&<>\"']/g, function (c) {\n"
        "    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' }[c];\n"
        "  });\n"
        "}\n"
        "\n"
        "const storyPopup = new mapboxgl.Popup({ closeButton: true, maxWidth: '280px', offset: 12 });\n"
        "\n"
        "map.on('click', 'story-dot', function (e) {\n"
        "  const p = e.features[0].properties || {};\n"
        "  const tagHtml = p.stat ? '<div class=\"popup-tag\">' + escapeHtml(p.stat) + '</div>' : '';\n"
        "  storyPopup.setLngLat(e.features[0].geometry.coordinates.slice()).setHTML(\n"
        "    '<div class=\"popup-inner\">' +\n"
        "      tagHtml +\n"
        "      '<div class=\"popup-title\">' + escapeHtml(p.title || 'Untitled') + '</div>' +\n"
        "      '<div class=\"popup-desc\">' + escapeHtml(p.description || '') + '</div>' +\n"
        "    '</div>'\n"
        "  ).addTo(map);\n"
        "});\n"
        "\n"
        "map.on('mouseenter', 'story-dot', function () { map.getCanvas().style.cursor = 'pointer'; });\n"
        "map.on('mouseleave', 'story-dot', function () { map.getCanvas().style.cursor = ''; });"
    ) % color_hex


def build_map_events_js():
    """Runs once, right after the map is created (not inside style.load).
    Wires the sidebar's "Show locations" checkbox to the story-dot
    layer's visibility. The layer itself is created by mapLayers above;
    by the time anyone can click the checkbox the style has finished
    loading, so setLayoutProperty is safe to call here."""
    return (
        "const togglePoints = document.getElementById('toggle-points');\n"
        "if (togglePoints) {\n"
        "  togglePoints.addEventListener('change', function (e) {\n"
        "    map.setLayoutProperty('story-dot', 'visibility', e.target.checked ? 'visible' : 'none');\n"
        "  });\n"
        "}"
    )


def build_index_md(answers, slug):
    color_hex = COLOR_INFO[answers["color"]][0]
    map_layers = indent_block(build_map_layers_js(color_hex))
    map_events = indent_block(build_map_events_js())

    # THE #1 GOTCHA: front matter coordinates are written [lon, lat] --
    # the opposite order from the (lat, lon) the user typed in, which is
    # itself the order Google Maps copies. Get this backwards and the
    # story's map centers in the wrong place (often in the ocean).
    front_matter = (
        "---\n"
        "layout: story.njk\n"
        "title: %s\n"
        "region: %s\n"
        "type: %s\n"
        "byline: %s\n"
        "coordinates: [%s, %s]\n"
        "zoom: %s\n"
        "projection: \"mercator\"\n"
        "sidebarInclude: %s\n"
        "mapLayers: |\n"
        "%s\n"
        "mapEvents: |\n"
        "%s\n"
        "---\n"
    ) % (
        yaml_str(answers["title"]),
        yaml_str(answers["region"]),
        yaml_str(answers["type"]),
        yaml_str(answers["byline"]),
        answers["lon"],
        answers["lat"],
        answers["zoom"],
        yaml_str("sidebar-%s.njk" % slug),
        map_layers,
        map_events,
    )

    body = (
        "\n"
        "Replace this paragraph with your opening: what happened, where, "
        "and why it matters.\n"
        "\n"
        "Replace this paragraph with background and context. Keep it "
        "short -- readers can explore the map for the details.\n"
    )

    return front_matter + body


def build_data_geojson(title, description, lat, lon):
    """One starter point, sitting right on the story's own coordinates.
    Coordinates here are also [lon, lat] -- see the gotcha note above."""
    fc = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]},
                "properties": {
                    "type": "point",
                    "title": title,
                    "description": description,
                },
            }
        ],
    }
    return json.dumps(fc, indent=2, ensure_ascii=False) + "\n"


def build_sidebar_njk(color_hex):
    return (
        "<div class=\"section-block\">\n"
        "  <div class=\"section-label\">Legend</div>\n"
        "  <div class=\"legend-row\">\n"
        "    <div class=\"legend-dot\" style=\"background:%s\"></div>\n"
        "    Story locations\n"
        "  </div>\n"
        "</div>\n"
        "\n"
        "<div class=\"section-block\">\n"
        "  <div class=\"section-label\">Show / hide</div>\n"
        "  <label class=\"layer-toggle\">\n"
        "    <input type=\"checkbox\" id=\"toggle-points\" checked />\n"
        "    Show locations\n"
        "  </label>\n"
        "</div>\n"
    ) % color_hex


# ----------------------------------------------------------------------
# Summary / confirmation
# ----------------------------------------------------------------------

def print_summary(answers, slug):
    color_hex = COLOR_INFO[answers["color"]][0]
    print("-" * 60)
    print("Here's what will be created:")
    print()
    print("  Title:       %s" % answers["title"])
    print("  Description: %s" % answers["description"])
    print("  Region:      %s" % answers["region"])
    print("  Type:        %s" % answers["type"])
    print("  Tag:         %s" % answers["tag"])
    print("  Location:    lat %s, lon %s" % (answers["lat"], answers["lon"]))
    print("  Color:       %s (%s)" % (answers["color"], color_hex))
    print("  Zoom:        %s" % answers["zoom"])
    print("  Byline:      %s" % answers["byline"])
    print()
    print("  Files:")
    print("    src/stories/%s/index.md" % slug)
    print("    src/stories/%s/data.geojson" % slug)
    print("    src/_includes/sidebar-%s.njk" % slug)
    print("    src/_data/stories.json  (a new entry will be appended)")
    print("-" * 60)


# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------

def parse_args(argv):
    p = argparse.ArgumentParser(
        description="Create a new story for The Spatial Update.",
    )
    p.add_argument(
        "--defaults",
        action="store_true",
        help=(
            "For testing only: skip all questions and create a canned "
            "'Test Story (delete me)' entry. Not for real stories."
        ),
    )
    return p.parse_args(argv)


def main():
    args = parse_args(sys.argv[1:])

    if not STORIES_JSON.exists():
        print(
            "ERROR: Could not find %s\n"
            "Is this script inside the site repo's scripts/ folder?" % STORIES_JSON
        )
        sys.exit(1)

    if args.defaults:
        answers = build_defaults_answers()
    else:
        answers = run_interactive()

    base_slug = slugify(answers["title"])
    if not base_slug:
        print("ERROR: Could not build a usable file/folder name from that title.")
        sys.exit(1)

    slug, was_renamed = unique_slug(base_slug)
    if was_renamed:
        print(
            "Note: src/stories/%s/ already exists, so this story will be "
            "saved as %s instead.\n" % (base_slug, slug)
        )

    print_summary(answers, slug)

    if not args.defaults:
        if not ask_yes_no("Create this story?"):
            print("Okay, nothing was created.")
            return

    color_hex = COLOR_INFO[answers["color"]][0]

    # --- Generate all file contents first; only write once everything
    #     has succeeded, so we never leave a half-created story behind.
    index_md = build_index_md(answers, slug)
    data_geojson = build_data_geojson(answers["title"], answers["description"], answers["lat"], answers["lon"])
    sidebar_njk = build_sidebar_njk(color_hex)

    try:
        stories = json.loads(STORIES_JSON.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        print("ERROR: Could not read/parse src/_data/stories.json: %s" % e)
        sys.exit(1)

    new_entry = {
        "region": answers["region"],
        "coordinates": [round(answers["lon"], 6), round(answers["lat"], 6)],
        "tag": answers["tag"],
        "type": answers["type"],
        "title": answers["title"],
        "description": answers["description"],
        "url": "/stories/%s/" % slug,
        "color": answers["color"],
    }
    stories.append(new_entry)

    # --- Now write everything ---
    story_dir = STORIES_DIR / slug
    story_dir.mkdir(parents=True, exist_ok=True)
    (story_dir / "index.md").write_text(index_md, encoding="utf-8")
    (story_dir / "data.geojson").write_text(data_geojson, encoding="utf-8")

    INCLUDES_DIR.mkdir(parents=True, exist_ok=True)
    (INCLUDES_DIR / ("sidebar-%s.njk" % slug)).write_text(sidebar_njk, encoding="utf-8")

    STORIES_JSON.write_text(
        json.dumps(stories, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # --- Report back ---
    print()
    print("Done! Created your new story: %s" % answers["title"])
    print()
    print("Next steps:")
    print("  1. Open src/stories/%s/index.md and write your story text." % slug)
    print("  2. Add more map points to data.geojson (see STORY-GUIDE.md).")
    print("  3. Preview it: run 'npm start' then open http://localhost:8080")
    print("  4. When you're happy: run 'npm run build', then commit & push")
    print("     using the Source Control tab in VS Code.")
    print()


if __name__ == "__main__":
    main()
