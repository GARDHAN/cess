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

Query flags help when checking work in headless Chrome, which otherwise captures
a page of invisible sections. Everything reported into `<title>` is read back
with `--dump-dom`:

- `?reveal=all` — force every scroll-reveal into its final state
- `?open=all` — click every `.disc-all` (the real path, so their own state
  updates), then open any stray `<details>`; reports the counts in `<title>`
- `?nojs=1` — serve the page with every `<script>` stripped, to check the
  no-JavaScript path. Chrome's `--disable-javascript` is a **no-op** in current
  builds and `--blink-settings=scriptEnabled=false` renders nothing at all, so
  this is the only reliable way to see that path — don't trust either flag.
- `?debug=widths` — list elements wider than the viewport
- `?debug=sections` — each section's id and vertical extent
- `?debug=rails` — rail and marquee geometry, plus page scroll width
- `?debug=stack` — walk `#strategy` past the reading line and report, at each
  step, which objective is active and what the others faded to. This is the only
  way to check that section: sticky never engages in a tall screenshot window.
- `?y=N` — lift the document by N so a viewport-sized screenshot shows the page
  at that offset. It cannot scroll for real — headless Chrome screenshots the
  composited surface at the origin, so a scrolled page comes back blank — which
  also means sticky elements sit unpinned. Use `?debug=stack` for pinning.

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

- **Deep emerald ground** (`--paper: #103023`) across the whole site, light type
  on it at about 12.7:1, `--lime` as the single accent. Blue-leaning rather than
  olive — the client compared the two and picked this. Panels lift one step
  (`--paper-2`), the closing section drops one (`--paper-3`), and `html` takes
  that closing colour so the overscroll bounce matches what you are looking at
  when you hit the bottom.
- **Section shades** give the page rhythm: `.sec--lift` and `.sec--deep` sit a
  couple of percent either side of the ground, with a hairline at each join so
  the step reads as deliberate rather than as a rendering seam. Keep the deltas
  tiny — this is rhythm, not a second colour. Currently on areas, impact,
  building, framework and opportunities.
- **The masthead is the exception** and keeps its own light palette —
  `--chrome`, `--chrome-line`, `--chrome-mute`. It carries CHRIST's identity and
  the university lockup is drawn for a white ground. Anything placed in the bar
  takes chrome tokens, not page tokens, or it turns light-on-light.
- `--green` (#14603C) stays dark deliberately: it is used on the light masthead
  and on the light `.mcard__fig` picture plates, never against the ground. The
  accent that *does* sit on the ground is `--green-2`, which is light.
- **Orbs** give the flat ground depth: very large, faint radial circles bleeding
  in from the sides of some sections (`.has-orb` on the section, `.orb` + a
  placement modifier inside). On the dark ground they are light — pools of
  warmth lifting out of the green rather than stains laid on it.
  **Placements bleed sideways only.** A vertical offset puts the section's own
  overflow clip through the middle of the gradient, and at these alphas that
  draws a hard horizontal line across the page; off the left or right the clip
  lands at the viewport edge where nobody sees it. If you add a placement, keep
  the vertical translate at 0 and the orb no taller than its section.
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

- **Disclosures** (`.more`) keep dense cards to their headline: a programme card
  shows its title and its number, and folds venue, partner and findings into a
  native `<details>`. Prefer this to deleting content the report supports.
  One control opens a whole row: a `.disc-all` button in the rail bar toggles
  every `<details>` in its rail. Each card still owns a real `<details>`, so
  with no script every card opens on its own and the group button is hidden —
  the per-card summaries only step aside once `.js` is on the root.
- **The pinned stack** (`.stack`) is used twice, by `#strategy` and `#value`: the
  heading column
  sticks while the objectives travel past it, and `main.js` fades each objective
  by its distance from a reading line at 42% of the viewport, so exactly one is
  at full strength. The script binds to `.stack` / `.stack__list` / `.stack__dots`
  by class, not by id, so a third one needs no JS change. Pinning is pure CSS, so
  the section releases itself when the list ends — but only if `.stack__list` keeps a bottom tail taller than the
  viewport gap, or the heading unpins while the last objective is still being
  read. Below 901px the columns collapse and the fade is switched off.

- **Motion** lives in one block at the end of the stylesheet: reveal stagger,
  drifting orbs, a hero that recedes as you scroll off it, hairlines that draw
  in, disclosure content that arrives. It is all ambient or on-reveal — nothing
  moves while a reader is on a fixed piece of text — and the whole block is
  switched off under `prefers-reduced-motion`. The orbs animate `translate` and
  `scale`, which are their own properties, so they compose with the placement
  modifiers' `transform` instead of replacing it.

`.has-orb > *` must never be a bare universal selector. It sits after `.orb` and
`.hero__mark` in the sheet, so at equal specificity it stripped their
`position:absolute` and dropped them back into flow — the ghost wordmark then
pushed the whole hero down by its own height, which read as a padding problem
and was not one. The rule excludes them by name.

Infinite animations stop headless Chrome's virtual clock from ever going idle,
so `--virtual-time-budget` hangs on this page. Use `--timeout=6000` instead. Any
`?debug=` query and `?reveal=all` freeze all animation for the same reason.

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
