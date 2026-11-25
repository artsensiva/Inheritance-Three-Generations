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

## Choosing a provider
Pick one that is cookieless and does not store personal data on the visitor's device. Reports below come from third-party reviews found in a quick search, not from the providers' own pricing pages, so **check current terms and prices yourself**:
* *Umami Cloud*: a free Hobby tier is reported (about 100,000 events a month on one website, 6 months of data). Script from `cloud.umami.is` with a `data-website-id` UUID. Also self-hostable.
* *Plausible*: paid, reported from about $9 a month, with a trial and no free plan. Script with a `data-domain` attribute.
* *GoatCounter*: the hosted free tier is reported as non-commercial only, with conflicting reports of commercial prices; self-hosting is free. Because this is a commercial game, read its terms before using the free tier.

## Legal note
This is not legal advice. Whether a cookieless counter needs consent or a notice depends on your jurisdiction and provider. The site already names the analytics host in its privacy text and honours Do Not Track and Global Privacy Control; a lawyer or the provider's compliance documentation should confirm it is enough for where you operate.
