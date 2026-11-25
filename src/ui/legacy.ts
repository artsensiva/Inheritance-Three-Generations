import type { Ending, HeirDir } from '../engine/types'
import { TOWN, SKILLS } from '../content/catalog'

const W = 1080
const H = 1350
const ROMAN = ['I', 'II', 'III']
export const DIR_LABEL: Record<HeirDir, string> = {
  steward: 'kept the house and the trade',
  scholar: 'sold up to send a child to study',
  share: 'divided the estate among the children',
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function wrap(text: string, size: number, width: number): string[] {
  const maxChars = Math.max(10, Math.floor(width / (size * 0.5)))
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur)
      cur = w
    } else cur = (cur + ' ' + w).trim()
  }
  if (cur) lines.push(cur)
  return lines
}

function lines(text: string, x: number, y: number, size: number, width: number, opts: { weight?: number; fill?: string; italic?: boolean; max?: number; lh?: number } = {}): { svg: string; end: number } {
  let ls = wrap(text, size, width)
  if (opts.max && ls.length > opts.max) {
    ls = ls.slice(0, opts.max)
    ls[ls.length - 1] = ls[ls.length - 1].replace(/[ ,.;:]*$/, '') + '…'
  }
  const lh = opts.lh ?? Math.round(size * 1.3)
  const svg = ls
    .map((l, i) => `<text x="${x}" y="${y + i * lh}" font-size="${size}" font-weight="${opts.weight ?? 400}" fill="${opts.fill ?? '#2a2118'}"${opts.italic ? ' font-style="italic"' : ''}>${esc(l)}</text>`)
    .join('')
  return { svg, end: y + ls.length * lh }
}

/** A self-contained SVG legacy card. Everything shown is drawn from the recorded ending. */
export function legacySvg(family: string, e: Ending, opts: { demo?: boolean } = {}): string {
  const parts: string[] = []
  parts.push(`<rect width="${W}" height="${H}" fill="#f1e6cf"/>`)
  parts.push(`<rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="#2a2118" stroke-width="3"/>`)
  parts.push(`<rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="#a63d2f" stroke-width="1.5"/>`)
  parts.push(`<text x="${W / 2}" y="104" text-anchor="middle" font-size="22" letter-spacing="5" fill="#a63d2f">${esc(TOWN.toUpperCase())} · FAMILY ARCHIVE</text>`)
  parts.push(`<text x="${W / 2}" y="168" text-anchor="middle" font-size="54" font-weight="700" fill="#2a2118">The ${esc(family)} Line</text>`)
  parts.push(`<text x="${W / 2}" y="226" text-anchor="middle" font-size="36" font-style="italic" fill="#2f6b66">${esc(e.title)}</text>`)
  const bl = lines(e.blurb, 120, 276, 24, W - 240, { italic: true, max: 3, fill: '#4a3d2e' })
  parts.push(bl.svg)
  let y = Math.max(bl.end + 24, 360)
  const gens = e.generations
  gens.forEach((g, i) => {
    const bx = 90, bw = W - 180, bh = 168
    parts.push(`<rect x="${bx}" y="${y}" width="${bw}" height="${bh}" rx="10" fill="#fbf5e6" stroke="#2a2118" stroke-width="2"/>`)
    parts.push(`<circle cx="${bx + 62}" cy="${y + bh / 2}" r="36" fill="${g.died ? '#7a6a58' : '#a63d2f'}"/>`)
    parts.push(`<text x="${bx + 62}" y="${y + bh / 2 + 11}" text-anchor="middle" font-size="30" font-weight="700" fill="#fbf5e6">${ROMAN[i]}</text>`)
    parts.push(`<text x="${bx + 124}" y="${y + 46}" font-size="32" font-weight="700" fill="#2a2118">${esc(g.name)} ${esc(g.family ?? '')}</text>`)
    parts.push(`<text x="${bx + 124}" y="${y + 78}" font-size="22" font-style="italic" fill="#2f6b66">${esc(g.epithet)}</text>`)
    const key = g.keyChoices.length ? g.keyChoices.slice(0, 2) : ['A quiet life, quietly lived']
    key.forEach((k, j) => {
      const kl = lines('· ' + k, bx + 124, y + 112 + j * 28, 21, bw - 380, { max: 1, fill: '#4a3d2e' })
      parts.push(kl.svg)
    })
    const top = Object.entries(g.skills).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0).slice(0, 2).map(([k, v]) => `${SKILLS[k]?.name ?? k} ${v}`)
    parts.push(`<text x="${bx + bw - 24}" y="${y + 46}" text-anchor="end" font-size="22" fill="#2a2118">Knowledge peak ${g.peakKnowledge}</text>`)
    parts.push(`<text x="${bx + bw - 24}" y="${y + 76}" text-anchor="end" font-size="22" fill="#2a2118">${g.died ? 'lost before their time' : `Health at the end ${g.endHealth}`}</text>`)
    if (top.length) parts.push(`<text x="${bx + bw - 24}" y="${y + 106}" text-anchor="end" font-size="20" font-style="italic" fill="#4a3d2e">${esc(top.join(' · '))}</text>`)
    y += bh
    const next = gens[i + 1]
    if (next) {
      parts.push(`<path d="M${W / 2} ${y} v34" stroke="#2a2118" stroke-width="3"/>`)
      const label = next.dir ? DIR_LABEL[next.dir] : 'the line continued'
      parts.push(`<text x="${W / 2 + 18}" y="${y + 24}" font-size="20" font-style="italic" fill="#a63d2f">${esc(label)}</text>`)
      y += 34
    }
  })
  y += 30
  const amb = e.ambition
  if (opts.demo) {
    parts.push(`<rect x="90" y="${y}" width="${W - 180}" height="86" rx="8" fill="#efe0c2" stroke="#2a2118" stroke-width="1.5"/>`)
    parts.push(`<text x="120" y="${y + 36}" font-size="26" font-weight="700" fill="#2a2118">The story continues…</text>`)
    parts.push(`<text x="120" y="${y + 68}" font-size="22" fill="#2a2118">Two more generations will inherit these choices.</text>`)
  } else {
    parts.push(`<rect x="90" y="${y}" width="${W - 180}" height="86" rx="8" fill="${amb.met ? '#dfe9d6' : '#efe0c2'}" stroke="#2a2118" stroke-width="1.5"/>`)
    parts.push(`<text x="120" y="${y + 36}" font-size="26" font-weight="700" fill="#2a2118">Ambition: ${esc(amb.title)}</text>`)
    parts.push(`<text x="120" y="${y + 68}" font-size="22" fill="#2a2118">${amb.met ? '✓ Fulfilled' : 'Not fulfilled this time'} — ${esc(amb.conds.map((c) => (c.ok ? '✓' : '✗')).join(' '))}</text>`)
  }
  y += 126
  const t = e.threads[0]
  const note = t ? t.sentences[0] + ' ' + t.sentences[t.sentences.length - 1] : e.facts[0] ?? ''
  if (note) {
    parts.push(`<text x="120" y="${y}" font-size="20" letter-spacing="3" fill="#a63d2f">THE THREAD THAT MATTERED</text>`)
    const nl = lines(note, 120, y + 32, 23, W - 240, { max: 4, fill: '#2a2118' })
    parts.push(nl.svg)
  }
  parts.push(`<text x="${W / 2}" y="${H - 70}" text-anchor="middle" font-size="22" letter-spacing="4" fill="#2a2118">INHERITANCE · THREE GENERATIONS${opts.demo ? ' · FREE DEMO' : ''}</text>`)
  parts.push(`<text x="${W / 2}" y="${H - 44}" text-anchor="middle" font-size="16" fill="#6a5a46">A fictional town in a fictional era.</text>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif" role="img" aria-label="Legacy card for the ${esc(family)} family">${parts.join('')}</svg>`
}

export function svgDataUrl(svg: string) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

export async function svgToPngBlob(svg: string): Promise<Blob> {
  const img = new Image()
  img.decoding = 'async'
  const loaded = new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('Could not render the card')) })
  img.src = svgDataUrl(svg)
  await loaded
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')
  ctx.drawImage(img, 0, 0, W, H)
  return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('PNG export failed'))), 'image/png'))
}

/** Render the card to PNG and trigger a browser download. */
export async function savePng(svg: string, filename: string): Promise<void> {
  const blob = await svgToPngBlob(svg)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
