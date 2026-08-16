# CESS — Centre for Ecological and Social Sustainability

Website for the Centre for Ecological and Social Sustainability at CHRIST (Deemed
to be University), Bangalore.

Content comes from the Centre's own review of the draft, which the Centre
confirmed should govern the page in full. It supplies every section:

```
hero → about → areas → certificate course → what we're building
     → research → opportunities → closing
```

The earlier draft also carried the programmes, feedback data, partners and
strategy from the Annual Activity & Impact Report 2025–2026. That material was
removed in favour of the Centre's own document, which does not ask for it. It
remains in git history, and the components that presented it are still in the
stylesheet and script.

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
assets/js/main.js   scroll reveal, mobile menu, rails, marquees and the
                    page's motion
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
