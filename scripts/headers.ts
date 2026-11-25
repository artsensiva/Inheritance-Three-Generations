/**
 * Production hardening for the static site: Content-Security-Policy, canonical/social tags,
 * sitemap and 404 page. GitHub Pages cannot send custom HTTP headers, so the policy is a <meta> tag
 * (it covers scripts, styles, images and connections, but not framing; frame-ancestors only works as a header).
 *
 *   SITE_URL   public address of the site, e.g. https://example.org/ (https; used for canonical links and the sitemap)
 */
import type { AnalyticsConfig } from './analytics'

export function parseSiteUrl(env: Record<string, string | undefined>): URL | null {
  const raw = (env.SITE_URL ?? '').trim()
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('SITE_URL is not a valid URL')
  }
  if (url.protocol !== 'https:' || !url.hostname) throw new Error('SITE_URL must be an https URL')
  if (url.username || url.password || url.search || url.hash) throw new Error('SITE_URL must be a plain address without credentials, query or fragment')
  if (!url.pathname.endsWith('/')) url.pathname += '/'
  return url
}

/** Origins the analytics script may load from and report to: the script host plus any https URL in its data-* attributes. */
export function analyticsOrigins(a: AnalyticsConfig | null): string[] {
  if (!a) return []
  const out = new Set<string>([new URL(a.src).origin])
  for (const v of Object.values(a.attrs)) {
    try {
      const u = new URL(v)
      if (u.protocol === 'https:') out.add(u.origin)
    } catch {
      /* not a URL */
    }
  }
  return [...out]
}

/**
 * "page": landing and legal pages (no inline styles). "app": the demo (React sets inline style attributes,
 * and the legacy card is exported through blob: and data: images).
 */
export function csp(kind: 'page' | 'app', a: AnalyticsConfig | null): string {
  const origins = analyticsOrigins(a).join(' ')
  const sp = (s: string) => (origins ? `${s} ${origins}` : s)
  const directives = [
    "default-src 'none'",
    sp("script-src 'self'"),
    kind === 'app' ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'",
    sp(kind === 'app' ? "img-src 'self' data: blob:" : "img-src 'self' data:"),
    sp("connect-src 'self'"),
    "base-uri 'none'",
    "form-action 'none'",
  ]
  return directives.join('; ')
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/** Insert CSP, referrer policy and (with SITE_URL) canonical and social URL tags right after <head>. Idempotent. */
export function hardenHead(htmlText: string, opts: { kind: 'page' | 'app'; analytics: AnalyticsConfig | null; canonical?: string | null }): string {
  if (htmlText.includes('Content-Security-Policy')) return htmlText
  if (!htmlText.includes('<head>')) throw new Error('No <head> found to harden')
  const tags = [
    `<meta http-equiv="Content-Security-Policy" content="${esc(csp(opts.kind, opts.analytics))}" />`,
    '<meta name="referrer" content="strict-origin-when-cross-origin" />',
  ]
  if (opts.canonical) {
    tags.push(`<link rel="canonical" href="${esc(opts.canonical)}" />`, `<meta property="og:url" content="${esc(opts.canonical)}" />`, '<meta property="og:type" content="website" />')
  }
  return htmlText.replace('<head>', `<head>\n  ${tags.join('\n  ')}`)
}

export function sitemap(site: URL, dirs: string[]): string {
  const urls = ['', ...dirs.map((d) => `${d}/`)].map((d) => `  <url><loc>${esc(new URL(d, site).toString())}</loc></url>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

/** 404 page. Missing URLs can be any depth, so the stylesheet and links are absolute (from SITE_URL) when known. */
export function notFoundPage(site: URL | null, a: AnalyticsConfig | null): string {
  const base = site ? site.pathname : './'
  return hardenHead(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Page not found — Inheritance: Three Generations</title>
  <meta name="robots" content="noindex" />
  <link rel="stylesheet" href="${esc(base)}landing.css" />
</head>
<body>
  <div class="wrap">
    <main id="main" class="prose">
      <h1>This page is not in the archive</h1>
      <p>The address may be mistyped, or the page has moved.</p>
      <p><a class="btn primary" href="${esc(base)}">Go to the start</a> <a class="btn" href="${esc(base)}play/">Play the free demo</a></p>
    </main>
  </div>
</body>
</html>
`,
    { kind: 'page', analytics: a },
  )
}
