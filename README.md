# CESS — Centre for Ecological and Social Sustainability

Website for the Centre for Ecological and Social Sustainability at CHRIST (Deemed
to be University), Bangalore.

Content is drawn from the Centre's Annual Activity & Impact Report 2025–2026:
nine programmes across three strategic tiers, the feedback and impact data, the
confirmed partners, and the strategy and measurable targets for 2026–2027.

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
assets/js/main.js   scroll reveal, sticky header
images/brand/       CHRIST logo
tools/dev-server.mjs
CLAUDE.md           conventions, design system, content rules
```

Plain HTML, CSS and JavaScript. No framework and no build step, so the finished
site is a folder that can be handed to university IT and hosted anywhere.

## Status

Working draft, under review. Two items are unconfirmed and marked as such on the
page or in `CLAUDE.md`:

- **The school name.** The site currently reads *School of Social Sciences*; the
  2025–26 report names the Dean of the *School of Psychological Sciences,
  Education & Social Work*. One of these is wrong.
- **Contact details** are placeholders pending confirmation.

Participant figures are per-programme and are deliberately not summed — the
source report's own numbers overlap between programmes.
