# Visit analytics

The site can count visits with a privacy-conscious analytics service. It is **off by default**: nothing is added to the live site until you set the variables below. No data about players is collected by the game itself; progress is saved only in each player's browser.

## What it measures
* Page views of the landing page (`/`) and the demo (`/play/`), from which you can read visits, sources and countries as the provider reports them.
* It does **not** measure demo starts, demo completions, sign-ups or purchases. Those need custom events or a different tool; ask before adding them, because that is a further decision about what to collect.

## How it works
1. At build time `npm run build:site` reads `ANALYTICS_SCRIPT_SRC` (an `https` URL) and optional `ANALYTICS_ATTRS` (a JSON object of `data-*` attributes, at most 8).
2. If set, it writes `site/analytics.js` and adds `<script defer src="…analytics.js">` to the landing page and the demo. If unset, none of this exists.
3. `analytics.js` is same-origin. It does nothing when the browser sends **Do Not Track** or **Global Privacy Control**; otherwise it adds the provider's script with your attributes.
4. The privacy text on the landing page and the demo title screen changes automatically to name the analytics host, so the statement stays truthful.

Invalid configuration fails the build (http URLs, non-`data-*` attributes, bad JSON are rejected).

## Turning it on
1. Choose a provider and create the account yourself (accounts, billing and terms are yours to accept).
2. Copy the script URL and any `data-*` attributes from the provider's dashboard.
3. Set repository variables (public values only; do not put secrets here) and redeploy:

```bash
gh variable set ANALYTICS_SCRIPT_SRC --body "https://example-provider.invalid/script.js"
gh variable set ANALYTICS_ATTRS --body '{"data-website-id":"YOUR-ID"}'
gh workflow run "Deploy site to GitHub Pages"
```

To turn it off again: `gh variable delete ANALYTICS_SCRIPT_SRC` and redeploy.

## GoatCounter (the chosen provider)
Verified from GoatCounter's own documentation (goatcounter.com/help/start) and terms (goatcounter.com/help/terms) on 2026-11-25:
* The official snippet is `<script data-goatcounter="https://MYCODE.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>`. In this project that maps to:
  * `ANALYTICS_SCRIPT_SRC` = `https://gc.zgo.at/count.js`
  * `ANALYTICS_ATTRS` = `{"data-goatcounter":"https://MYCODE.goatcounter.com/count"}`
* **Commercial use:** the terms say the hosted service "is currently offered for free for reasonable public usage" and that running a personal website *or small-to-medium business* on it is fine, but sending millions of pageviews a day is not. (Third-party reviews I found earlier described the free tier as non-commercial only; the official terms say otherwise. Terms can change, so re-read them before relying on this.) The terms also put the responsibility for following local data-protection law (for example GDPR) on you.
* Ad blockers commonly block `goatcounter.com` and `gc.zgo.at`, so counts will be lower than real visits.
* Pageviews are recorded per path. On GitHub Pages the paths include the repository prefix (`/Inheritance-Three-Generations/` for the landing page and `/Inheritance-Three-Generations/play/` for the demo).

### Setup
1. **You** create the account at https://www.goatcounter.com/signup (choose a site code, which becomes `MYCODE.goatcounter.com`). Accounts, e-mail and password are yours; I do not create them or enter your password.
2. Give the site code to whoever configures the repository, or run:

```bash
gh variable set ANALYTICS_SCRIPT_SRC --body "https://gc.zgo.at/count.js"
gh variable set ANALYTICS_ATTRS --body '{"data-goatcounter":"https://MYCODE.goatcounter.com/count"}'
gh workflow run "Deploy site to GitHub Pages"
```

3. Open the live site, wait about 10 seconds and check the GoatCounter dashboard. To keep your own visits out, see GoatCounter's "Prevent tracking my own pageviews?" help page.

## Other providers
Any cookieless provider that loads a single script with `data-*` attributes works with the same two variables. Notes below come from third-party reviews, not the providers' own pricing pages, so check current terms and prices yourself:
* *Umami Cloud*: a free Hobby tier is reported (about 100,000 events a month on one website, 6 months of data). Script from `cloud.umami.is` with a `data-website-id` UUID. Also self-hostable.
* *Plausible*: paid, reported from about $9 a month, with a trial and no free plan. Script with a `data-domain` attribute.

## Legal note
This is not legal advice. Whether a cookieless counter needs consent or a notice depends on your jurisdiction and provider. The site already names the analytics host in its privacy text and honours Do Not Track and Global Privacy Control; a lawyer or the provider's compliance documentation should confirm it is enough for where you operate.
