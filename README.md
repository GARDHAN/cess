# CESS — Centre for Ecological and Social Sustainability

Website for the Centre for Ecological and Social Sustainability at CHRIST (Deemed
to be University), Bangalore.

Content is drawn from the Centre's Annual Activity & Impact Report 2025–2026 —
nine programmes across three strategic tiers, the feedback and impact data, the
confirmed partners, and the strategy and measurable targets for 2026–2027 —
together with the Centre's own review of the draft, which supplies the hero,
about, areas, opportunities and closing copy.

## Viewing it

Open `index.html` in a browser. That is the whole site — there is nothing to
install and nothing to build.

For live reload while editing:

```
node tools/dev-server.mjs
```

Serves on <http://localhost:8080> and refreshes the browser on every save. Zero
dependencies; it uses only Node's standard library.

## Structure

```
index.html          the site
assets/css/main.css styles — design tokens in :root
assets/js/main.js   scroll reveal, mobile menu, rails, marquees, the
                    pinned-heading sections, and the page's motion
images/brand/       the CHRIST lockup and the Centre's own marks
tools/dev-server.mjs
CLAUDE.md           conventions, design system, content rules
```

Plain HTML, CSS and JavaScript. No framework and no build step, so the finished
site is a folder that can be handed to university IT and hosted anywhere.

## Status

Working draft, under review. What is outstanding is marked as such on the page
or in `CLAUDE.md`:

- **Contact details** are placeholders pending confirmation.
- **LinkedIn and Instagram** have not been supplied; the footer markup for them
  is written and commented out rather than pointing at a dead link.
- **Photography.** The Centre asked for pictures in the moving card rows and none
  are licensed yet, so each card carries a drawn plate in the site's own colours.
  Dropping an `<img>` into `.mcard__fig` covers it, with no other change.

The Centre sits in the **Department of Social Work**, confirmed by the Centre in
its review of the draft.

Participant figures are per-programme and are deliberately not summed — the
source report's own numbers overlap between programmes.
