#!/usr/bin/env python3
"""
finalize.py -- Stage 4 finisher for The Spatial Update.

Turns a *tagged draft* story into a *publishable* one. During drafting, every
sentence in a story's body carries an inline claim tag keyed to its row in the
claim ledger (sources.html), e.g.:

    Fighting displaced roughly 4,000 residents. [C7]

Once Harvey has rewritten the draft in his own voice (Stage 4), this script:

  1. REFUSES to run while any ``[NEW]`` tag remains in the body -- those mark
     sentences Harvey added that still need a source. This is the gate that
     stops an unsourced claim from ever reaching the published page.
  2. Converts each inline claim tag ``[C7]`` into a small numbered footnote
     that links to that claim's row in the story's ledger
     (``./sources/#C7``), so the published page keeps its audit trail.
  3. Writes the result back to the story's SOURCE file.

WHY IT EDITS THE SOURCE (reconciling the old CLAUDE.md spec):
The original section-5 sketch said finalize "writes into docs/stories/". That
predates the current setup, where the site is an Eleventy build: ``docs/`` is
GENERATED from ``src/`` and anything written straight into ``docs/`` is wiped by
the next ``npm run build``. So finalize edits the source
``src/stories/<slug>/index.md`` in place; the normal ``npm run build`` then
produces the finished published page. (Section 3 already flags that Stage 3's
``story.md`` / ``story.geojson`` names should be reconciled to the real
``index.md`` / ``data.geojson`` -- this script uses the real ones.)

USAGE (Windows / VS Code PowerShell terminal, from the repo root):

    py scripts\\finalize.py <slug>              # finalize src/stories/<slug>/index.md in place
    py scripts\\finalize.py <slug> --check       # dry run: report tags, don't write
    py scripts\\finalize.py <slug> --strip       # just remove tags (no footnotes)
    py scripts\\finalize.py --file <path>        # operate on an explicit file (testing/one-offs)

Exit codes: 0 = clean/done, 1 = refused (a [NEW] tag remains, or a bad path).

Stdlib only. Works the same on Windows and Linux/Mac.
"""

import argparse
import re
import sys
from pathlib import Path

# Windows console codepage can choke on the characters this script prints
# (arrows, dashes). Force UTF-8 so it never crashes on output.
for _stream_name in ("stdout", "stderr"):
    _stream = getattr(sys, _stream_name, None)
    if _stream is not None and hasattr(_stream, "reconfigure"):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

SCRIPT_PATH = Path(__file__).resolve()
REPO_ROOT = SCRIPT_PATH.parent.parent  # scripts/ -> repo root
STORIES_DIR = REPO_ROOT / "src" / "stories"

# A single claim tag, e.g. [C7] or [C19].
CLAIM_RE = re.compile(r"\[(C\d+)\]")
# A run of one or more ADJACENT claim tags, e.g. [C13][C14] -> one footnote.
CLAIM_RUN_RE = re.compile(r"(?:\[C\d+\])+")
# A not-yet-sourced marker Harvey adds to new sentences.
NEW_RE = re.compile(r"\[NEW\]")


def split_front_matter(text):
    """Return (front_matter_with_delimiters, body).

    Front matter is the leading ``---\\n ... \\n---\\n`` block. It holds the
    map JavaScript and must never be touched, so we only ever transform the
    body that follows it. If there's no front matter, the whole thing is body.
    """
    if text.startswith("---"):
        m = re.match(r"^(---\n.*?\n---\n)(.*)$", text, re.DOTALL)
        if m:
            return m.group(1), m.group(2)
    return "", text


def find_new_lines(body):
    """Return [(line_number, line_text), ...] for every line holding a [NEW]."""
    hits = []
    for i, line in enumerate(body.split("\n"), start=1):
        if NEW_RE.search(line):
            hits.append((i, line.strip()))
    return hits


def convert_body(body, strip=False):
    """Replace runs of claim tags with footnotes (or nothing, if strip).

    Returns (new_body, ordered_ids) where ordered_ids is the distinct claim
    IDs in order of first appearance -- handy for the summary printout.
    """
    ordered_ids = []
    for m in CLAIM_RE.finditer(body):
        cid = m.group(1)
        if cid not in ordered_ids:
            ordered_ids.append(cid)

    def replace_run(match):
        ids = CLAIM_RE.findall(match.group(0))
        if strip:
            return ""
        links = [
            '<a href="./sources/#%s">%s</a>' % (cid, cid[1:])  # C7 -> label "7"
            for cid in ids
        ]
        return '<sup class="cite">%s</sup>' % ",".join(links)

    new_body = CLAIM_RUN_RE.sub(replace_run, body)

    if strip:
        # Tidy the space a mid-sentence tag leaves behind: " ." -> "." and
        # any doubled spaces -> single. (Line-leading indentation is left be.)
        new_body = re.sub(r"[ \t]+([.,;:!?])", r"\1", new_body)
        new_body = re.sub(r"(?<=\S)[ \t]{2,}(?=\S)", " ", new_body)

    return new_body, ordered_ids


def resolve_target(args):
    """Figure out which file to operate on, or exit(1) with a clear message."""
    if args.file:
        path = Path(args.file).resolve()
    elif args.slug:
        path = STORIES_DIR / args.slug / "index.md"
    else:
        print("ERROR: give a <slug> or --file <path>. See --help.")
        sys.exit(1)
    if not path.exists():
        print("ERROR: no such file: %s" % path)
        sys.exit(1)
    return path


def main():
    parser = argparse.ArgumentParser(
        description="Finalize a tagged draft story into a publishable one.",
    )
    parser.add_argument("slug", nargs="?", help="story slug under src/stories/")
    parser.add_argument("--file", help="operate on this exact file instead of a slug")
    parser.add_argument("--check", action="store_true",
                        help="dry run: report tags and [NEW] gate, write nothing")
    parser.add_argument("--strip", action="store_true",
                        help="remove claim tags entirely instead of footnoting them")
    args = parser.parse_args()

    path = resolve_target(args)
    text = path.read_text(encoding="utf-8")
    front_matter, body = split_front_matter(text)

    # --- Gate 1: the [NEW] check. Always enforced, even in --check. ---
    new_hits = find_new_lines(body)
    if new_hits:
        print("REFUSING to finalize %s" % path)
        print("  %d sentence(s) still tagged [NEW] (added but not yet sourced):" % len(new_hits))
        for line_no, line_text in new_hits:
            preview = (line_text[:80] + "...") if len(line_text) > 80 else line_text
            print("    body line %d: %s" % (line_no, preview))
        print("  Source each one and remove its [NEW] tag, then run finalize again.")
        sys.exit(1)

    # --- Count what's there (print the count -- house style: a zero is visible). ---
    total_tags = len(CLAIM_RE.findall(body))
    _, ordered_ids = convert_body(body)  # cheap; just to get the distinct list
    print("Story: %s" % path)
    print("  Claim tags in body: %d  (distinct claims: %d)" % (total_tags, len(ordered_ids)))
    if ordered_ids:
        print("  Claims cited: %s" % ", ".join(ordered_ids))

    if total_tags == 0:
        print("  Nothing to convert -- no [C#] tags found (already finalized?).")
        return

    if args.check:
        print("  [--check] Clean: no [NEW] tags. %d tag(s) would be %s."
              % (total_tags, "stripped" if args.strip else "footnoted"))
        return

    new_body, _ = convert_body(body, strip=args.strip)
    path.write_text(front_matter + new_body, encoding="utf-8")

    action = "stripped" if args.strip else "converted to footnotes linking ./sources/#C#"
    print("  Done: %d claim tag(s) %s." % (total_tags, action))
    print("  Next: run 'npm run build', preview, then commit via Source Control.")


if __name__ == "__main__":
    main()
