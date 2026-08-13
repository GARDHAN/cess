# CESS — Centre for Ecological and Social Sustainability

Website for the Centre for Ecological and Social Sustainability at CHRIST (Deemed
to be University), Bangalore.

The Centre sits in the **Department of Social Work** at CHRIST. That was open for a
while — the two source documents named different schools — and was settled by the
client in `docs/ improvements.docx` (2026-08-14), which both instructs "instead of
faculty u can mention department social work" and gives the footer line verbatim.
Use the department, not a school. "Faculty" still means academic staff elsewhere on
the page and should stay that way.

## Stack

Plain HTML, CSS, and JavaScript. No framework, no build step, no `npm install`.
Open a file and it works.

This is deliberate: the site is content, not application. Nothing changes after
page load, so there is no state for a framework to manage. Staying dependency-free
also means the finished site is a folder of files that can be handed to university
IT and hosted anywhere, with no toolchain to keep alive.

If shared layouts become worth it (many pages repeating nav/footer), revisit then
— not before.

## Running it

```
node tools/dev-server.mjs                    # serves index.html on :8080
node tools/dev-server.mjs other.html 3000    # any file, any port
```

Opens the browser and reloads it on every save. Zero dependencies — it is just
Node's own http and fs. `NO_OPEN=1` skips launching the browser.

Two query flags help when checking work in headless Chrome, which otherwise
captures a page of invisible sections:

- `?reveal=all` — force every scroll-reveal into its final state
- `?debug=widths` — list elements wider than the viewport into `<title>`,
  readable via `--dump-dom`

Note Chrome headless clamps its window to a 500px minimum width; asking for less
lays out at 500 and crops the image, which looks like a layout bug and is not one.

## Files

- `index.html` — the site. Formerly draft-3.html; the earlier drafts were
  removed once this superseded them (they remain in git history).
- `assets/css/main.css`, `assets/js/main.js` — the stylesheet and script, split
  out of the draft. Component styles for the report content are appended at the
  end of the CSS, after the original design system.
- `images/brand/` — logos. `christ-logo.png` is the CHRIST master and
  `christ-logo-112.png` is what the page loads. The Centre's own logo was
  lifted from page 1 of its annual report: `cess-logo.png` is the full lockup,
  `cess-wordmark.png` is the leaf-C with ESS (descriptor type removed) and is
  what the header uses, `cess-mark.png` is the leaf alone.
- `cess Dean.md` — the Dean's strategy document: vision statement, strategic goals
  2026–27, long-term goals 2027–32. Source of truth for the Centre's own wording.

## Design system

Tokens live in `:root`. Use them rather than literal colours.

- **Flat off-white ground** (`--paper: #FAFAF7`) across the whole site. No
  gradient descent, no dark sections, no per-section grounds.
- **Orbs** carry the only colour besides type: very large, very faint radial
  circles bleeding in from the corners of some sections (`.has-orb` on the
  section, `.orb` + a placement modifier inside). They sit near the threshold of
  visibility on purpose — if one reads as a shape rather than as warmth, it is
  too strong. `.has-orb` clips them, which is what keeps them off the page's
  horizontal scroll.
- **Rails** carry any section with more items than a row should hold:
  `.rail-wrap` > `.rail` (id, `tabindex="0"`, `role="region"`, `aria-label`) plus
  a `.rail__bar` of two buttons. Items sized by `grid-auto-columns:
  minmax(clamp(...), 1fr)`, so a rail with few enough items simply fills the row
  and the script marks it `data-pos="none"`, hiding its controls.
- Scroll-snap parks the first item behind the rail's own 3px padding, so a rail
  at rest reports `scrollLeft` of about 3, not 0. The end-detection tolerance in
  `main.js` (`EPS`) exists for that; don't tighten it or the left arrow never
  disables and the edge mask never clears.
- **Marquees** are the rail's moving cousin, used where the client asked for a row
  that travels on its own: `.marq` > `.marq__row` > `.marq__track` of `.mcard`s.
  The script duplicates the track and both slide left by exactly their own width,
  so the loop has no seam — which only holds while a track is wider than the row,
  hence the repeat-until-wide-enough loop for short sets. Duration is set from the
  measured width so every marquee travels at the same px/sec whatever it carries.
  It pauses on hover and focus, and falls back to a plain scroller under
  `prefers-reduced-motion` or if the script never runs.

A marquee's infinite animation stops headless Chrome's virtual clock from ever
going idle, so `--virtual-time-budget` hangs on this page. Use `--timeout=6000`
instead. Any `?debug=` query also freezes the tracks for the same reason.

## Content rules

`docs/cess-facts-2025-26.md` is **the source of truth for site content** —
programmes, participant numbers, partners, outcomes, strategy, vision and mission,
all extracted from the Centre's 2025–2026 annual report (`docs/` holds the source
PDF). It ends with a list of open questions; check it before publishing anything
it flags.

**Never invent facts about CHRIST or CESS.** Not dates, not counts, not names of
partner institutions, not funding figures. If a number is needed for a section to
demonstrate its shape, mark it visibly as illustrative and pending confirmation —
never let placeholder data read as verified institutional fact. This site is meant
to become official.

Do not sum participant figures across programmes — the report's own numbers
overlap. See Q3 in the facts file.

## University chrome

The top bar carries CHRIST's identity, so it uses the university's colours, taken
from the official logo: `--christ-blue: #264796`, `--gold: #C7A65D`, and
`--navy: #12204A` for the utility strip. These are confined to the bar — the page
below is CESS green.

The site currently uses no photography. The CC BY-SA stock photographs that were
in `images/` were removed unused; if any come back, the licence requires visible
attribution on every page that shows them.

The client asked for pictures in the marquee cards and none are licensed yet, so
`.mcard__fig` draws a soft field from the same orb language as the page rather
than leaving an empty box. Dropping an `<img>` inside the element covers the
drawing — no other change to the card is needed.

## Client review, 2026-08-14

`docs/ improvements.docx` is the client's own annotated review — text plus nine
screenshots. The screenshots are of a **different build** of the CESS site, not
this one, so its instructions map by role rather than by matching text: its
"areas" screenshot means `#areas` here, its "accomplishments" one became
`#building`, and so on. Content in that document overrides the annual report
wherever the two differ; it is the Centre speaking about itself.
