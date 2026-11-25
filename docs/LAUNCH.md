# Launch notes

Everything here is a hypothesis to test, not a forecast. No demand for the game has been demonstrated, and none of the steps below has been done unless it says so.

## What exists in the repository
* Free demo and landing page: `npm run build:site` → `site/` (landing page at `/`, demo at `/play/`).
* A desktop build is not packaged yet (Tauri or Electron would be needed for Steam).

## Suggested order
1. **Host the static site** (any static host: GitHub Pages, Cloudflare Pages, Netlify). Deploying is a publishing step and needs the owner's decision and account.
2. **Test demand cheaply** before spending much: several landing-page framings, cost per sign-up. Provisional rule from the earlier memo: continue at $0.25 or less per sign-up, stop above $0.75 (assumptions, not industry norms). This needs sign-up collection or analytics, which the site deliberately does not have; adding either is a decision about collecting user data.
3. **Playtest** with 5–10 observed players; compare the playable demo with a plain written summary.
4. **Payment probe**: early access on a store checkout with a stated delivery date and refund terms; count completed payments, not clicks.
5. **Steam** only if the earlier steps hold up: a $100 app fee per title (recoupable after $1,000 in sales, per Steamworks), a "coming soon" page to build wish-lists, desktop packaging, age-rating and tax forms.

## Payments
Do not build payments into the game. Use the checkout of the store you sell through. The owner needs bank and tax details, possibly a registered business, and must confirm that each platform pays out to their country.

## Open decisions for the owner
* Country and payment channel; budget cap for any ad spend.
* Whether the repository should stay public for a paid game (the code and all writing are visible), and which licence applies. No licence is included.
* Whether to collect emails or analytics, and under which privacy statement.
