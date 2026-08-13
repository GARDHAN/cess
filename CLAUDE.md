# CESS — Centre for Ecological and Social Sustainability

Website for the Centre for Ecological and Social Sustainability at CHRIST (Deemed
to be University), Bangalore.

The Centre is attributed to the university directly and **no school is named** —
the two source documents disagreed and it was never confirmed. Don't reintroduce a
school name without it being verified.

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

- **The page is one continuous descent.** `body` carries a single
  `linear-gradient` over the whole document height (`--g0` → `--g6`), so the
  background lightens with scroll position rather than at section edges: deep
  emerald at the hero, sage after it, off-white by the footer. `html` is painted
  `--g6` so the body background doesn't propagate to the canvas and stretch.
- **The dark zone spans three sections** — hero, about, areas — as `.tone-1`,
  `.tone-2`, `.tone-3`, each starting on exactly the colour the one above ended
  on. One dark section alone made the step to pale too abrupt.
- **Only the last dark section melts out**, via `.tone-melt`, and the fade must
  sit entirely inside empty padding: `padding-bottom` = melt height + a gap.
  Cards on a dark ground are translucent, so any overlap lightens the ground
  *through* them while their text is still light — content appears to dissolve.
  The selector is doubled (`.tone-melt.tone-melt`) because `.sec` sets
  `padding-block` later in the file and that shorthand would otherwise win.
- The melt's final stop must stay exactly `--g0`, the page gradient's first
  stop, or the join shows as a band. Don't add dark sections below the melt;
  it breaks the one-way progression.
- The body gradient's hold (`--g0` until ~22%) is pinned to where the dark zone
  actually ends. If sections are added or removed above that point, re-measure
  with `?debug=sections` and move the stop, or a flat or reversed band appears.
- No radial glows on the grounds. A bloom over a flat emerald reads as a smudge,
  not light.

**Validating the ramp.** After any change to the grounds, render the full page
and check the background is monotonically lightening — average a row across both
gutters (a single pixel column picks up ±1 gradient dither and gives false
regressions), sample below y=130 to skip the fixed header, and use a tolerance of
about 0.004 in relative luminance. Every section should enter at the luminance
the one above left off.
- `.on-dark` switches text/card treatment, and is now used by the hero alone.
- `.micro` label over value is the data pattern throughout.
- `.pill` buttons, `.card` grids, `.row` lists, `.rule` hairlines.
- `.r` marks anything that reveals on scroll; `data-d="1..4"` staggers it.
  The reveal is gated behind a `.js` class set by an inline script in `<head>`,
  so a failed script load leaves the page fully readable instead of blank.
  Do not move those rules back onto bare `.r`.
- Every animation is disabled under `prefers-reduced-motion`. Keep it that way.

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
