# Selling the game with a Stripe Payment Link

The site can sell the full game through a **Stripe Payment Link**: a hosted checkout page that you create in your own Stripe dashboard. No payment data touches this site or the game, and there is no Stripe secret key anywhere in the repository. The flow is **off by default**. Until `PAYMENT_LINK_URL` is set, the live site is unchanged.

> **Not legal advice.** The legal pages are templates. A German-run shop has legal duties (Impressum, privacy information, withdrawal information, VAT, possibly more). Have the texts reviewed before you charge anyone. Using the official model withdrawal notice (Anlage 1 zu Art. 246a EGBGB) is the safest route.

## What gets built
With `PAYMENT_LINK_URL` set, `npm run build:site` adds:

| Where | What |
|---|---|
| `/` | "Buy the full game · price" button, a note on VAT and withdrawal, footer links, privacy text that names Stripe |
| `/play/` | the demo end screen shows the same buy button |
| `/impressum/`, `/privacy/`, `/withdrawal/` | legal page templates filled from `LEGAL_DETAILS` |
| `/thanks/` | post-purchase page with the download link (`noindex`) |

## Configuration (repository variables; public values only)
| Variable | Meaning |
|---|---|
| `PAYMENT_LINK_URL` | `https://buy.stripe.com/…` (only this host is accepted) |
| `PRICE_LABEL` | the price exactly as shown at checkout, e.g. `€9.99` (it must match Stripe; the site does not read it from Stripe) |
| `DOWNLOAD_URL` | https link shown on `/thanks/` |
| `LEGAL_DETAILS` | JSON, see below |

`LEGAL_DETAILS` fields: `name`, `street`, `postalCity`, `country` (default Germany), `email`, optional `phone`, optional `vatId`, `smallBusiness` (`true` = no VAT under § 19 UStG, `false` = prices include VAT), `disputeResolution` (`"willing"` or `"unwilling"` to take part before a consumer arbitration board), `deliveryHost` (who hosts the download, e.g. `"itch.io"`). The Impressum is public by law, so these values end up on the public site anyway.

`LEGAL_DETAILS` also works on its own, without a payment link: the site then gets just the Impressum and privacy pages (see `docs/PRODUCTION.md`).

Anything missing is rendered as a yellow `[[PLACEHOLDER]]` on a page marked "Draft template". **The build fails** if the payment link is set and any placeholder is left, so the site cannot go live with a checkout button next to unfinished legal text.

## Preview it locally with placeholders
```bash
PAYMENT_LINK_URL=https://buy.stripe.com/test_example PRICE_LABEL='€9.99' ALLOW_PLACEHOLDER_LEGAL=1 npm run build:site
python3 -m http.server 4173 -d site   # then open http://localhost:4173/
```
`ALLOW_PLACEHOLDER_LEGAL=1` is for previews only; do not set it as a repository variable.

## Setting it up (your steps in Stripe)
1. In the Stripe dashboard create a product and a **Payment Link** (start in test mode and use a test link, which is also a `buy.stripe.com` address).
2. **After payment:** choose "Don't show confirmation page" and redirect to `https://artsensiva.github.io/Inheritance-Three-Generations/thanks/`.
3. **Tax:** set the tax behaviour to match `smallBusiness`. A Kleinunternehmer charges no VAT; otherwise use inclusive prices (and Stripe Tax if you need it for EU sales).
4. **Terms and withdrawal consent:** a purchase of digital content starts immediately, so ask for consent before payment. Add a required consent checkbox to the link (terms of service, pointing at the `/withdrawal/` page) and custom text, e.g. "I agree that you start providing the digital content now, and I understand that I lose my right of withdrawal once you have started." Have this wording checked.
5. Collect the customer's email (Stripe does by default) so receipts and refunds work.
6. Set the variables and redeploy:
```bash
gh variable set PAYMENT_LINK_URL --body "https://buy.stripe.com/YOUR_LINK"
gh variable set PRICE_LABEL --body "€9.99"
gh variable set DOWNLOAD_URL --body "https://…/your-download"
gh variable set LEGAL_DETAILS --body '{"name":"…","street":"…","postalCity":"…","email":"…","smallBusiness":true,"disputeResolution":"unwilling","deliveryHost":"…"}'
gh workflow run "Deploy site to GitHub Pages"
```
7. Make one real test purchase (a test-mode link first, then a small live one you refund) and read what the buyer sees.

## Limits you should know
* **The download link is not protected.** `/thanks/` is a public page: anyone with the address can use the link, and a Payment Link cannot verify a visit. Fine for a first small release; for anything more, serve the file from a store (itch.io, Steam) or add a server check against the Stripe session. The page is `noindex` and not linked from anywhere else.
* **There is no downloadable build yet.** The repository produces the web build (`npm run build`) but not a packaged game; decide what buyers receive before you sell.
* **The repository is public**, so the full game's source and writing are readable by anyone. The repository is licensed **All rights reserved** (see `LICENSE`), which allows viewing but not reuse; that does not stop people from reading it, so make it private if you want the source hidden.
* **Analytics are page views only.** If analytics are on, `/thanks/` views are a rough proxy for purchases; Stripe's dashboard is the source of truth.
* **Refunds** are done in the Stripe dashboard. Complaints, receipts and invoices for Kleinunternehmer vs. VAT-registered sellers have their own rules; ask your tax adviser.
