# CESS — Centre for Ecological and Social Sustainability

Website for the Centre for Ecological and Social Sustainability at CHRIST (Deemed
to be University), Bangalore.

The Centre sits in the **Department of Social Work** at CHRIST. That was open for a
while — the two source documents named different schools — and was settled by the
client in `docs/CESS WEBSITE.docx` (2026-08-14), which both instructs "instead of
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
- `?pop=N` — click the Nth discipline in the About row (1-based) and leave its
  panel open; reports the dialog's title, body length and whether the in-place
  description was hidden. A screenshot cannot click, and the row starts at
  opacity 0, so this is the only way to see or check that component.
- `?debug=travel` — sample each marquee's scroll position over a couple of
  seconds and report how far it moved and whether it wrapped. The row travels by
  writing `scrollLeft`, so nothing about it shows in a screenshot or in the
  computed styles. It is the one debug view that leaves the motion running.
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
  tiny — this is rhythm, not a second colour. Currently on areas, building and
  opportunities.
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
  The script duplicates the track, so a scroll position of exactly one track
  width shows the same thing as a position of zero — which only holds while a
  track is wider than the row, hence the repeat-until-wide-enough loop for short
  sets.
  **The row travels by writing `scrollLeft`, not by animating a transform**, and
  that is the whole point: the client asked for a row that moves on its own and
  that the reader can also take hold of. Travel and drag write the same number,
  so a reader grabbing the row is not fighting an animation, and letting go does
  not snap it back to where an animation had got to. The position is wrapped into
  one track width every frame; because the wrap point is where the content
  repeats, crossing it is invisible. Speed is px/sec so every row travels at the
  same pace whatever it carries.
  Travel stops for a pointer over the row, focus inside it, a drag in progress,
  or the section being off screen. Under `prefers-reduced-motion`, or with no
  script at all, the row simply does not travel — it is a scroll container
  either way, so it stays draggable and swipeable.
  Consequences worth knowing: `animation:none` does **not** stop it, so the
  server's debug views set `window.CESS_NO_AUTOSCROLL` instead; and `.marq` needs
  `scroll-behavior:auto`, or the smooth scrolling inherited from `html` tries to
  animate every per-frame write and the row crawls.
- **Drag to pan** (`dragToPan` in `main.js`) is on every horizontal scroller —
  both rails and all three marquees. Mouse and pen only: a touch screen already
  drags an `overflow-x` container natively, and taking the pointer there would
  mean deciding for ourselves whether a finger meant to pan the row or scroll the
  page, which is the judgement the browser already makes correctly. Marquees pass
  a wrap function so their position loops; rails leave it out and let the browser
  clamp at the ends. A drag of more than 4px swallows the click that follows it,
  so releasing over a card does not also activate it.

- **The discipline line** (`.disc`) carries the About section's "We combine" set
  as one continuous line — no boxes, a hairline between each term, the accent
  drawing itself under a term on hover as the term lifts. The client's document
  marks this row "(POPUP)", so each term is a real `<button>` opening a native
  `<dialog>`. The dialog is filled from the clicked item rather than holding its
  own copy of the text, so each description has exactly one home in the markup.
  Every description is the Centre's own wording, lifted from the areas and
  certificate-course copy elsewhere on the page — check there before editing one.
  **The line never wraps.** Six terms are about 590px and the About column is
  wider than the default prose split for exactly that reason (`#about .prose`);
  below the width it needs, the row scrolls rather than wrapping, which keeps
  the single-line reading everywhere and keeps a stray separator off the start
  of a wrapped line. A row that scrolls inside a grid item also needs
  `min-width:0` on that item, or the column and then the page grow to fit it.
  Without the dialog the descriptions simply read in place: `main.js` sets
  `pop-ok` on the root only after confirming `showModal`, and that class is what
  hides them — never hide them from CSS alone.
  On hover each term gets a **crayon scribble** in its own colour, the same
  drawn-by-hand language as the area illustrations. It is one SVG in `--scribble`
  used as a *mask*, so the shape is shared and only `background` changes per
  word; six background-images would be six copies of the same drawing. The
  scribble sits at `z-index:-1`, which is why the button carries
  `isolation:isolate` — without a stacking context of its own it would fall
  behind the section instead of behind the word.

**Two components are built and supported but not currently on the page.** Both
carried annual-report and Dean's-document material that the client's own document
does not ask for, and went out with it (2026-08-16, see *Scope* below). The CSS
and JS are deliberately left in place — the client may well want this content
back, and both are the right answer when it returns. Neither costs anything while
unused: the JS binds through `$$()`, which no-ops on an empty list.

- **Disclosures** (`.more`) keep dense cards to their headline: a programme card
  shows its title and its number, and folds venue, partner and findings into a
  native `<details>`. Prefer this to deleting content the report supports.
  One control opens a whole row: a `.disc-all` button in the rail bar toggles
  every `<details>` in its rail. Each card still owns a real `<details>`, so
  with no script every card opens on its own and the group button is hidden —
  the per-card summaries only step aside once `.js` is on the root.
- **The pinned stack** (`.stack`): the heading column
  sticks while the objectives travel past it, and `main.js` fades each objective
  by its distance from a reading line at 42% of the viewport, so exactly one is
  at full strength. The script binds to `.stack` / `.stack__list` / `.stack__dots`
  by class, not by id, so a new one needs no JS change. Pinning is pure CSS, so
  the section releases itself when the list ends — but only if `.stack__list` keeps a bottom tail taller than the
  viewport gap, or the heading unpins while the last objective is still being
  read. Below 901px the columns collapse and the fade is switched off.
  `?debug=stack` remains the only way to check it: sticky never engages in a tall
  screenshot window.

- **Reveals run in two stages and both ways.** A section's heading is meant to
  land before the information under it, so `main.js` observes with two entry
  lines: `.r` in general trips at 8% up the viewport, and anything matching
  `LATE` — cards, marquees, the discipline row, `[data-late]` — waits until 22%,
  so it arrives as the reader carries on scrolling. Add `data-late` for cases
  the selector cannot name.
  Elements also fade back out, so returning to one plays the fade again rather
  than finding it already resolved. **Exit is watched by a separate observer at
  the true viewport edge**, never the staged entry line: reusing the -22% line
  for exit would fade a heading out while it is still on screen and being read.
  Inside a `.head`, the wrapper itself no longer animates and its children carry
  the motion in order — eyebrow, heading, then the line beside it. Nesting one
  fade inside another only muddies both. Anything staged this way is invisible
  until its parent is `.in`, so it needs its own entry in both the
  `prefers-reduced-motion` block and the server's `?reveal=all` style, or a
  reduced-motion reader and every screenshot get an empty section head.
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
`?debug=` query and `?reveal=all` freeze all animation for the same reason, and
also set `window.CESS_NO_AUTOSCROLL` — the marquees travel from a rAF loop that
`animation:none` cannot reach, and a rAF that never settles keeps the clock busy
just as an infinite animation does.

**`--dump-dom` captures at load, and `--timeout` does not delay it.** A debug
view that sets `document.title` after a `setTimeout` reports nothing — which is
why every flag above writes its title synchronously. When a view genuinely has
to watch something over time, request `/__slow?ms=N` from the page: the server
holds that image open for N ms, which holds the load event open with it.
`?debug=travel` is the working example.

## Content rules

`docs/CESS WEBSITE.docx` is **the source of truth for site content** — see *Scope*
below. `docs/cess-facts-2025-26.md`, extracted from the Centre's 2025–2026 annual
report, remains the reference for anything the client document does not cover:
programmes, participant numbers, partners, outcomes, strategy. It ends with a list
of open questions; check it before publishing anything it flags.

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

`images/areas/` holds seven hand-drawn illustrations, one per area of
engagement, supplied by the client and numbered to match: `01-…` is the card
numbered 01. They are decorative — each card says in words what its picture says
in pencil — so the `<img>` takes `alt=""` rather than repeating the heading to a
screen reader. Source files were 2–9MB each; they ship resized to 900px wide and
converted to WebP (~40KB each, `sips -Z 900` then `cwebp -q 80`). Anything added
later should go through the same pass — the originals are far too heavy to serve.

The other rows still have no photography. `.mcard__fig` draws a soft field from
the same orb language as the page rather than leaving an empty box; dropping an
`<img>` inside covers the drawing, with no other change to the card. The
certificate course row is deliberately without one: the client asked for the
picture area to come off it, and those cards carry `.mcard--text`.

## Scope — the client document governs the page

`docs/CESS WEBSITE.docx` (formerly delivered as ` improvements.docx`) is the
client's own annotated review — text plus nine screenshots. The screenshots are of
a **different build** of the CESS site, not this one, so its instructions map by
role rather than by matching text: its "areas" screenshot means `#areas` here, its
"accomplishments" one became `#building`, and so on. It is the Centre speaking
about itself, and it overrides the annual report wherever the two differ.

**The screenshots are content, not just layout.** Where the document says "put the
same thing" or "same format change the information", the words inside that
screenshot are the copy to use — that is where `#programme` and `#research` get
their headings, ledes and cards.

On 2026-08-16 the client confirmed the page should carry **only** what that
document contains. The page is now exactly its sequence:

    hero → about → areas → programme → building → research → opportunities → contact

Seven sections were removed at that point — programmes (nine, three tiers), impact
(feedback charts), partners, strategy (five objectives), the triple-pillar
framework, the value proposition and the plan of action — along with the hero
stats strip and the Vision/Mission cards in `#about`. None of it was wrong; it
simply came from the annual report and the Dean's document, and the client's
document never asks for it. It is all in git history, and the components that
carried it are still in the CSS and JS.

Card copy is held to the document's own words: where it lists a bare title, the
card carries the title and nothing else. Do not reintroduce supporting lines from
the annual report without asking.

Still outstanding from the document: it asks for photographs in the marquee cards
("use animated pictures"), deferred until images are licensed, and for LinkedIn,
Instagram and the official CESS email, which the client will send. The footer has
a commented-out social block ready for them.
