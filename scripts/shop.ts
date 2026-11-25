/**
 * Optional "buy the full game" flow for the static site, built around a Stripe Payment Link.
 *
 * Off by default: nothing here is generated unless PAYMENT_LINK_URL is set at build time.
 * No payment data ever touches this site or the game. The buyer is sent to Stripe's hosted checkout,
 * and Stripe sends them back to /thanks/ (configured in the Payment Link, see docs/PAYMENTS.md).
 *
 *   PAYMENT_LINK_URL         https://buy.stripe.com/… link created in your own Stripe dashboard
 *   PRICE_LABEL              price as shown at checkout, e.g. "€9.99" (required with the link)
 *   DOWNLOAD_URL             optional https link shown on the thanks page
 *   LEGAL_DETAILS            JSON with the seller details for the legal pages (see LegalDetails)
 *   ALLOW_PLACEHOLDER_LEGAL  "1" lets the build succeed while [[PLACEHOLDERS]] remain (previews only)
 *
 * The legal pages are templates, not legal advice. Anything still unfilled is rendered as a visible
 * [[PLACEHOLDER]], and the build refuses to go live with placeholders unless explicitly told otherwise.
 */
export interface LegalDetails {
  name: string
  street: string
  postalCity: string
  country: string
  email: string
  phone?: string
  vatId?: string
  /** true: small-business scheme (§ 19 UStG, no VAT); false: prices include VAT; unset: placeholder. */
  smallBusiness?: boolean
  /** Consumer arbitration board (§ 36 VSBG): "unwilling" or "willing"; unset leaves a placeholder. */
  disputeResolution?: 'unwilling' | 'willing'
  /** Who hosts the download file, e.g. "itch.io"; unset leaves a placeholder. */
  deliveryHost?: string
}

export interface ShopConfig {
  paymentUrl: string
  price: string
  downloadUrl: string | null
  legal: LegalDetails
  allowPlaceholders: boolean
}

export const PLACEHOLDER = /\[\[[^\]]+\]\]/g

const LEGAL_DEFAULTS = {
  name: '[[YOUR FULL NAME OR COMPANY NAME]]',
  street: '[[STREET AND NUMBER]]',
  postalCity: '[[POSTCODE AND CITY]]',
  country: 'Germany',
  email: '[[CONTACT EMAIL ADDRESS]]',
}
const LEGAL_KEYS = new Set(['name', 'street', 'postalCity', 'country', 'email', 'phone', 'vatId', 'smallBusiness', 'disputeResolution', 'deliveryHost'])

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Escape text and turn [[PLACEHOLDERS]] into highlighted marks. */
export function html(s: string): string {
  return escapeHtml(s).replace(/\[\[([^\]]+)\]\]/g, '<mark class="ph">[[$1]]</mark>')
}

export function findPlaceholders(text: string): string[] {
  return [...new Set((text.match(PLACEHOLDER) ?? []).map((m) => m))]
}

function httpsUrl(raw: string, name: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`${name} is not a valid URL`)
  }
  if (url.protocol !== 'https:' || !url.hostname) throw new Error(`${name} must be an https URL`)
  if (url.username || url.password) throw new Error(`${name} must not contain credentials`)
  return url
}

function parseLegal(raw: string): LegalDetails {
  let given: Record<string, unknown> = {}
  if (raw) {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error('LEGAL_DETAILS must be a JSON object')
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('LEGAL_DETAILS must be a JSON object')
    given = parsed as Record<string, unknown>
  }
  for (const [k, v] of Object.entries(given)) {
    if (!LEGAL_KEYS.has(k)) throw new Error(`LEGAL_DETAILS: unknown field "${k}"`)
    if (k === 'smallBusiness') {
      if (typeof v !== 'boolean') throw new Error('LEGAL_DETAILS: "smallBusiness" must be true or false')
    } else if (k === 'disputeResolution') {
      if (v !== 'unwilling' && v !== 'willing') throw new Error('LEGAL_DETAILS: "disputeResolution" must be "unwilling" or "willing"')
    } else if (typeof v !== 'string' || v.trim() === '' || v.length > 200) {
      throw new Error(`LEGAL_DETAILS: "${k}" must be a non-empty string of at most 200 characters`)
    }
  }
  const s = (k: keyof typeof LEGAL_DEFAULTS) => (typeof given[k] === 'string' ? (given[k] as string).trim() : LEGAL_DEFAULTS[k])
  const opt = (k: string) => (typeof given[k] === 'string' ? (given[k] as string).trim() : undefined)
  return {
    name: s('name'),
    street: s('street'),
    postalCity: s('postalCity'),
    country: s('country'),
    email: s('email'),
    phone: opt('phone'),
    vatId: opt('vatId'),
    smallBusiness: typeof given.smallBusiness === 'boolean' ? given.smallBusiness : undefined,
    disputeResolution: given.disputeResolution === 'willing' || given.disputeResolution === 'unwilling' ? given.disputeResolution : undefined,
    deliveryHost: opt('deliveryHost'),
  }
}

export interface LegalConfig {
  legal: LegalDetails
  allowPlaceholders: boolean
}

/** Legal pages without a buy flow: enabled by LEGAL_DETAILS alone (Impressum and privacy are needed for a commercial site in Germany even when it only offers a free demo). */
export function parseLegalConfig(env: Record<string, string | undefined>): LegalConfig | null {
  const raw = (env.LEGAL_DETAILS ?? '').trim()
  if (!raw) return null
  return { legal: parseLegal(raw), allowPlaceholders: (env.ALLOW_PLACEHOLDER_LEGAL ?? '').trim() === '1' }
}

export function parseShopConfig(env: Record<string, string | undefined>): ShopConfig | null {
  const link = (env.PAYMENT_LINK_URL ?? '').trim()
  if (!link) return null
  const url = httpsUrl(link, 'PAYMENT_LINK_URL')
  if (url.hostname !== 'buy.stripe.com') throw new Error('PAYMENT_LINK_URL must be a Stripe Payment Link (https://buy.stripe.com/…)')
  const price = (env.PRICE_LABEL ?? '').trim()
  if (!price) throw new Error('PRICE_LABEL is required when PAYMENT_LINK_URL is set (the price exactly as shown at checkout, e.g. "€9.99")')
  if (price.length > 24 || !/\d/.test(price)) throw new Error('PRICE_LABEL must contain a number and be at most 24 characters')
  const dl = (env.DOWNLOAD_URL ?? '').trim()
  return {
    paymentUrl: url.toString(),
    price,
    downloadUrl: dl ? httpsUrl(dl, 'DOWNLOAD_URL').toString() : null,
    legal: parseLegal((env.LEGAL_DETAILS ?? '').trim()),
    allowPlaceholders: (env.ALLOW_PLACEHOLDER_LEGAL ?? '').trim() === '1',
  }
}

/** Price/VAT sentence. Must match the tax settings of the Payment Link. */
export function vatNote(l: LegalDetails): string {
  if (l.smallBusiness === true) return 'No VAT is charged (small-business scheme, § 19 UStG).'
  if (l.smallBusiness === false) return 'Price includes statutory VAT.'
  return '[[VAT NOTE: say whether the price includes VAT or the small-business scheme applies]]'
}

export function buyButton(c: ShopConfig): string {
  return `<a class="btn primary" href="${escapeHtml(c.paymentUrl)}" rel="noopener">Buy the full game · ${html(c.price)}</a>`
}

export function buyNote(c: ShopConfig): string {
  return `<p class="note buy-note">One-time purchase of a digital product; checkout is hosted by Stripe. ${html(vatNote(c.legal))} Please read the <a href="./withdrawal/">withdrawal information</a> before you buy.</p>`
}

export function footerLinks(prefix: string, withWithdrawal: boolean): string {
  return `<nav class="legal-links" aria-label="Legal"><a href="${prefix}impressum/">Impressum</a> · <a href="${prefix}privacy/">Privacy</a>${withWithdrawal ? ` · <a href="${prefix}withdrawal/">Withdrawal</a>` : ''}</nav>`
}

export interface PageSpec {
  dir: string
  title: string
  description: string
  robots: 'index' | 'noindex'
  body: string
}

const draftBanner = '<p class="draft" role="note"><b>Draft template.</b> The highlighted placeholders have not been filled in, and this text has not been reviewed by a lawyer. Do not put this page live as it is.</p>'

function addressBlock(l: LegalDetails): string {
  return `<p>${html(l.name)}<br>${html(l.street)}<br>${html(l.postalCity)}<br>${html(l.country)}</p>`
}

export function legalPages(l: LegalDetails, opts: { analyticsHost: string | null; shop: ShopConfig | null }): PageSpec[] {
  const shop = opts.shop
  const contact = `<p>Email: ${html(l.email)}${l.phone ? `<br>Phone: ${html(l.phone)}` : ''}</p>`
  const impressum = `
<h1>Impressum</h1>
<p class="note">Legal notice under § 5 DDG (Germany).</p>
<h2>Provider</h2>${addressBlock(l)}
<h2>Contact</h2>${contact}
${l.vatId ? `<h2>VAT ID</h2><p>${html(l.vatId)}</p>` : ''}
${shop && l.smallBusiness === true ? '<p>No VAT is charged because of the small-business scheme (§ 19 UStG).</p>' : ''}
<h2>Responsible for content (§ 18 (2) MStV)</h2>${addressBlock(l)}
${shop ? `<h2>Consumer dispute resolution</h2>
<p>${
    l.disputeResolution === 'willing'
      ? 'We are willing to take part in dispute resolution proceedings before a consumer arbitration board.'
      : l.disputeResolution === 'unwilling'
        ? 'We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.'
        : html('[[DISPUTE RESOLUTION: set disputeResolution to "willing" or "unwilling"]]')
  }</p>` : ''}`

  const analytics = opts.analyticsHost
    ? `<p>We count visits with an analytics service (${html(opts.analyticsHost)}) to see how many people visit and which page they open. It is not loaded if your browser sends Do Not Track or Global Privacy Control. The service is meant to work without cookies; see its own privacy statement for details. Legal basis: Art. 6 (1)(f) GDPR (our interest in understanding how the site is used).</p>`
    : '<p>This site does not use analytics or tracking.</p>'
  const privacy = `
<h1>Privacy</h1>
<p class="note">Information under Art. 13 GDPR.</p>
<h2>Who is responsible</h2>${addressBlock(l)}${contact}
<h2>The game</h2>
<p>The game runs in your browser. Your progress is saved only in your browser's local storage on your own device; it is never sent to us.${shop ? '' : ' We do not collect contact details or any other data from players.'}</p>
<h2>Hosting and server logs</h2>
<p>This site is served by GitHub Pages (GitHub, Inc., a Microsoft company, USA). When you open a page, your IP address and technical request data are processed by the host to deliver the page and keep it secure. Legal basis: Art. 6 (1)(f) GDPR. Data may be transferred to the USA; see GitHub's privacy statement.</p>
<h2>Visit statistics</h2>${analytics}
${shop ? `<h2>Buying the full game</h2>
<p>If you buy, you leave this site for Stripe's hosted checkout. Payments are processed by Stripe Payments Europe, Ltd., Dublin, Ireland. Stripe collects the data you enter (such as name, email address, billing address and payment details) and technical data such as your IP address. We receive your name, email address, billing country, and the details of the order, but not your full card or bank details. We use them to process the order, send you the product, issue the receipt, and keep the records required by law. Legal basis: Art. 6 (1)(b) and (c) GDPR. Stripe also processes some data for its own purposes, such as fraud prevention and legal obligations, as an independent controller; see Stripe's privacy policy.</p>
<h2>Delivery</h2>
<p>${l.deliveryHost ? `The download file is provided through ${html(l.deliveryHost)}, which can see your IP address and the request when you download. See that service's privacy statement.` : html('[[DELIVERY HOST: set deliveryHost to the service that hosts the download file]]')}</p>
<h2>How long we keep data</h2>
<p>We delete order data when it is no longer needed, except where statutory retention periods under German commercial and tax law require us to keep it.</p>` : ''}
<h2>Your rights</h2>
<p>You have the right to access, rectification, erasure, restriction of processing, data portability and objection under the GDPR, and the right to complain to a data protection supervisory authority, for example the one responsible for your place of residence or ours. Contact us using the details above.</p>`

  const withdrawal = `
<h1>Withdrawal</h1>
<p class="note">Information on the right of withdrawal for consumers in the EU. Digital content not on a physical medium.</p>
<h2>Right of withdrawal</h2>
<p>You have the right to withdraw from this contract within 14 days without giving any reason. The withdrawal period is 14 days from the day the contract is concluded.</p>
<p>To exercise it, you must inform us of your decision by a clear statement (for example a letter or an email) to:</p>${addressBlock(l)}${contact}
<p>You can use the sample withdrawal form, but you do not have to. To meet the deadline it is enough to send the notice before the period ends.</p>
<h2>Consequences of withdrawal</h2>
<p>If you withdraw, we will refund all payments we received from you without undue delay, and at the latest within 14 days of receiving your notice. We refund using the same payment method you used for the purchase, at no cost to you.</p>
<h2>Early expiry for digital content</h2>
<p>Your right of withdrawal expires early if we have started to provide the digital content after you expressly agreed that we may start before the withdrawal period ends, and confirmed that you lose your right of withdrawal as soon as we start. You give this agreement and confirmation at checkout before you pay.</p>
<p class="note">Template wording. Before selling, replace it with the official model withdrawal notice (Anlage 1 to Art. 246a EGBGB) and have it reviewed.</p>`

  const thanks = `
<h1>Thank you</h1>
<p>If you have just bought <b>Inheritance: Three Generations</b>, thank you for supporting a small independent game. Stripe emails a receipt to the address you gave at checkout.</p>
<h2>Your download</h2>
${shop?.downloadUrl ? `<p><a class="btn primary" href="${escapeHtml(shop.downloadUrl)}" rel="noopener">Download the full game</a></p>` : `<p>${html('[[DOWNLOAD LINK: set DOWNLOAD_URL for the build buyers receive]]')}</p>`}
<p class="note">Keep this link for yourself. If it does not work, write to ${html(l.email)} and include the email address you used at checkout.</p>
<h2>Questions or refunds</h2>
<p>Contact ${html(l.email)}. Details on cancelling a purchase are in the <a href="../withdrawal/">withdrawal information</a>.</p>
<p><a href="../play/">Back to the free demo</a> · <a href="../">Home</a></p>`

  const pages: PageSpec[] = [
    { dir: 'impressum', title: 'Impressum', description: 'Legal notice for Inheritance: Three Generations.', robots: 'index', body: impressum },
    { dir: 'privacy', title: 'Privacy', description: 'How this site handles personal data.', robots: 'index', body: privacy },
  ]
  if (shop) {
    pages.push(
      { dir: 'withdrawal', title: 'Withdrawal', description: 'Right of withdrawal for the digital product.', robots: 'index', body: withdrawal },
      { dir: 'thanks', title: 'Thank you', description: 'Purchase confirmation and download.', robots: 'noindex', body: thanks },
    )
  }
  return pages
}

export function renderPage(shell: string, p: PageSpec, footer: string): string {
  const body = findPlaceholders(p.body).length ? `${draftBanner}\n${p.body}` : p.body
  return shell
    .replace('{{TITLE}}', `${escapeHtml(p.title)} — Inheritance: Three Generations`)
    .replace('{{DESCRIPTION}}', escapeHtml(p.description))
    .replace('{{ROBOTS}}', p.robots === 'noindex' ? 'noindex, nofollow' : 'index, follow')
    .replace('{{BODY}}', body)
    .replace('{{FOOTER_LINKS}}', footer)
}
