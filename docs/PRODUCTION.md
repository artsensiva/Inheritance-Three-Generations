# Production launch checklist

Status of the public site (landing page + free demo), as of this document. "Done" items are in the repository and covered by tests; "Needs you" items cannot be done from code.

## Done
* Static, script-light site; the demo needs no server. Content-Security-Policy on every page (`scripts/headers.ts`); only the analytics origins are allowed, if analytics are on.
* 404 page, canonical links and `sitemap.xml` (from `SITE_URL`, defaulted by the Pages workflow).
* Accessibility checked on the game (axe-clean, keyboard, reduced motion); landing page uses semantic headings, alt text and focus styles.
* CI on every PR (type-check, build, tests, site build, simulation smoke, dominance check); Dependabot; secret scanning and push protection are enabled.
* Visit analytics (optional, cookie-free, honours Do Not Track and Global Privacy Control).
* Legal page generator: Impressum and privacy from `LEGAL_DETAILS`; with a payment link also withdrawal and thank-you pages. The build **fails** while any `[[PLACEHOLDER]]` is open.
* All rights reserved `LICENSE`.

## Needs you before going public
1. **`LEGAL_DETAILS`.** A commercial site run from Germany needs an Impressum (§ 5 DDG) and privacy information (Art. 13 GDPR) even if it only offers a free demo and counts visits. Provide the real name, address and email. Have the texts reviewed by a lawyer.
2. **A decision to publish.** Publishing re-enables GitHub Pages, and GitHub Pages serves a public site from a public repository (private repositories need a paid plan).
3. **Outside playtesting** (5-10 people) before spending on ads.
4. **Selling the game** needs the steps in `docs/PAYMENTS.md` (Stripe link, withdrawal consent, download build).

## Known limits
* **GitHub Pages cannot send HTTP headers**, so there is no `X-Frame-Options`/`frame-ancestors`, HSTS control or custom cache policy. The CSP is a `<meta>` tag. If clickjacking protection matters, host behind a service that can set headers.
* **No social preview image.** Link previews will show text only; most platforms need a PNG or JPG, which the build does not produce yet.
* **No `robots.txt`.** It only works at a domain root, not under `/Inheritance-Three-Generations/`. Search engines will still find the pages through the sitemap and links.
* **Branch protection is off** on `main`, and Dependabot security updates are disabled. Turning these on is an owner decision (settings, not code).
* **Analytics measure page views only** (no demo starts or completions).

## Deploying
```bash
gh variable set LEGAL_DETAILS --body '{"name":"…","street":"…","postalCity":"…","email":"…"}'
gh api -X POST repos/artsensiva/Inheritance-Three-Generations/pages -f build_type=workflow
gh workflow run "Deploy site to GitHub Pages"
```
Then open the site, click through the demo to the end screen, save a card, and check the GoatCounter dashboard.
