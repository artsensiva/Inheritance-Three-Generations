/**
 * Build-time configuration.
 *  - VITE_DEMO=true      builds the free demo (one family, generation I and the heir decision).
 *  - VITE_WISHLIST_URL   optional link shown on the demo end screen. Leave unset until a store page exists.
 */
export const DEMO: boolean = import.meta.env.VITE_DEMO === 'true'
export const WISHLIST_URL: string = (import.meta.env.VITE_WISHLIST_URL as string | undefined)?.trim() ?? ''
/** Stripe Payment Link and price label, set by the site build when the buy flow is enabled (see docs/PAYMENTS.md). */
export const BUY_URL: string = (import.meta.env.VITE_BUY_URL as string | undefined)?.trim() ?? ''
export const BUY_PRICE: string = (import.meta.env.VITE_BUY_PRICE as string | undefined)?.trim() ?? ''
export const DEMO_FAMILY = 'cooperage'
/** Host of the visit-analytics service, set by the site build when analytics is enabled. */
export const ANALYTICS_HOST: string = (import.meta.env.VITE_ANALYTICS_HOST as string | undefined)?.trim() ?? ''
