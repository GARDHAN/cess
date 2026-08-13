# CESS — Centre for Ecological and Social Sustainability

Website for the Centre for Ecological and Social Sustainability at CHRIST (Deemed
to be University), Bangalore. (Which school it sits under is unresolved — see Q1
in `docs/cess-facts-2025-26.md`.)

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
- `images/brand/` — the CHRIST logo: `christ-logo.png` is the master,
  `christ-logo-112.png` is what the page loads.
- `cess Dean.md` — the Dean's strategy document: vision statement, strategic goals
  2026–27, long-term goals 2027–32. Source of truth for the Centre's own wording.

## Design system

Tokens live in `:root`. Use them rather than literal colours.

- Ground rhythm: dark sections (`.dark`) alternate with light. `.dark` melts into
  the page below via `::after`; `.dark--band` melts in from above; `.dark--last`
  ends the page and must not melt out.
- `.on-dark` switches text/card treatment for content on dark grounds.
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
