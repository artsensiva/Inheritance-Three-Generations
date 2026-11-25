/**
 * Optional, privacy-conscious visit analytics for the static site.
 *
 * Nothing is added unless ANALYTICS_SCRIPT_SRC is set at build time. The tracker is never embedded
 * directly: pages load a tiny same-origin loader (analytics.js) that does nothing when the browser
 * sends Do Not Track or Global Privacy Control, and otherwise appends the provider's script.
 *
 *   ANALYTICS_SCRIPT_SRC  https URL of the provider's script
 *   ANALYTICS_ATTRS       optional JSON object of data-* attributes, e.g. {"data-website-id":"…"}
 */
export interface AnalyticsConfig {
  src: string
  host: string
  attrs: Record<string, string>
}

export function parseAnalyticsConfig(env: Record<string, string | undefined>): AnalyticsConfig | null {
  const rawSrc = (env.ANALYTICS_SCRIPT_SRC ?? '').trim()
  if (!rawSrc) return null
  let url: URL
  try {
    url = new URL(rawSrc)
  } catch {
    throw new Error('ANALYTICS_SCRIPT_SRC is not a valid URL')
  }
  if (url.protocol !== 'https:' || !url.hostname) throw new Error('ANALYTICS_SCRIPT_SRC must be an https URL')
  let attrs: Record<string, string> = {}
  const rawAttrs = (env.ANALYTICS_ATTRS ?? '').trim()
  if (rawAttrs) {
    let parsed: unknown
    try {
      parsed = JSON.parse(rawAttrs)
    } catch {
      throw new Error('ANALYTICS_ATTRS must be a JSON object')
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('ANALYTICS_ATTRS must be a JSON object')
    const entries = Object.entries(parsed as Record<string, unknown>)
    if (entries.length > 8) throw new Error('ANALYTICS_ATTRS allows at most 8 attributes')
    for (const [k, v] of entries) {
      if (!/^data-[a-z0-9-]{1,40}$/.test(k)) throw new Error(`ANALYTICS_ATTRS: "${k}" is not an allowed attribute (data-* only)`)
      if (typeof v !== 'string' || v.length > 300) throw new Error(`ANALYTICS_ATTRS: "${k}" must be a string of at most 300 characters`)
      attrs = { ...attrs, [k]: v }
    }
  }
  return { src: url.toString(), host: url.hostname, attrs }
}

/** Contents of site/analytics.js: honours Do Not Track and Global Privacy Control. */
export function analyticsLoader(cfg: AnalyticsConfig): string {
  return `(function () {
  var n = window.navigator || {};
  if (n.doNotTrack === '1' || window.doNotTrack === '1' || n.msDoNotTrack === '1' || n.globalPrivacyControl === true) return;
  var cfg = ${JSON.stringify({ src: cfg.src, attrs: cfg.attrs })};
  var s = document.createElement('script');
  s.src = cfg.src;
  s.defer = true;
  for (var k in cfg.attrs) if (Object.prototype.hasOwnProperty.call(cfg.attrs, k)) s.setAttribute(k, cfg.attrs[k]);
  document.head.appendChild(s);
})();
`
}

/** Insert a same-origin loader tag before </head>. Idempotent. */
export function injectLoader(html: string, loaderPath: string): string {
  if (html.includes(`src="${loaderPath}"`)) return html
  if (!html.includes('</head>')) throw new Error('No </head> found to inject the analytics loader')
  return html.replace('</head>', `  <script defer src="${loaderPath}"></script>\n</head>`)
}

export function privacyParagraph(cfg: AnalyticsConfig | null, payments = false): string {
  const base = 'Progress is saved only in your own browser, on your own device.'
  // Buying sends the visitor to Stripe; the sentence must appear whenever the buy button exists.
  const pay = payments ? ' If you buy the game, you leave this site for the hosted checkout of Stripe; see the <a href="./privacy/">privacy information</a>.' : ''
  if (!cfg) return `The game has no accounts, no tracking and no cookies. ${base} This page loads nothing from other websites.${pay}`
  return `The game has no accounts and this site sets no cookies. ${base} We count visits with an analytics service (${cfg.host}), only to see how many people visit and which page they open. It is not loaded if your browser sends Do Not Track or Global Privacy Control.${pay}`
}

export function demoPrivacyNote(cfg: AnalyticsConfig | null): string {
  return cfg ? cfg.host : ''
}
