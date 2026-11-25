/**
 * Build-time configuration.
 *  - VITE_DEMO=true      builds the free demo (one family, generation I and the heir decision).
 *  - VITE_WISHLIST_URL   optional link shown on the demo end screen. Leave unset until a store page exists.
 */
export const DEMO: boolean = import.meta.env.VITE_DEMO === 'true'
export const WISHLIST_URL: string = (import.meta.env.VITE_WISHLIST_URL as string | undefined)?.trim() ?? ''
export const DEMO_FAMILY = 'cooperage'
