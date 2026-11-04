/* The two wardrobes, drawn as vector art on a 1338x753 canvas. The clothes hung on the rails are the same
   drawings the doll wears, so what you tap is what she puts on. Returns the markup plus a click box per piece. */
import { GARMENTS } from './doll.js'

const CREAM = '#f7e9d6', CREAM2 = '#efd9bd', EDGE = '#c99f78', GOLD = '#d9a65a', ROSE = '#e8a3a3', ROSE2 = '#d48a8a'

// hang a garment from the rail: returns its markup and click box
function hung(slug, cx, railY, maxW = 84, maxH = 225) {
  const g = GARMENTS[slug], [bx, by, bw, bh] = g.box
  const k = Math.min(maxW / bw, maxH / bh)
  const top = railY + 18, x0 = cx - (bw * k) / 2
  const svg = `
    <path d="M${cx - 36} ${top} L${cx} ${railY + 6} L${cx + 36} ${top}" stroke="#b98a62" stroke-width="3.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M${cx} ${railY + 6} q0 -9 7 -10 q6 -1 6 -7" stroke="#b98a62" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <g transform="translate(${x0 - bx * k} ${top - by * k + 2}) scale(${k})">${g.svg}</g>`
  return { svg, box: [x0 - 6, railY - 8, x0 + bw * k + 6, top + bh * k + 8] }
}
const flat = (slug, x, y, k) => { // a folded piece lying on a shelf
  const g = GARMENTS[slug], [bx, by, bw, bh] = g.box
  return { svg: `<g transform="translate(${x - bx * k} ${y - by * k}) scale(${k})">${g.svg}</g>`, box: [x - 6, y - 6, x + bw * k + 6, y + bh * k + 6] }
}
const hatbox = (x, y, w, c1, c2) => `<g><rect x="${x}" y="${y - 30}" width="${w}" height="30" rx="5" fill="${c1}"/><rect x="${x - 3}" y="${y - 38}" width="${w + 6}" height="12" rx="5" fill="${c2}"/><path d="M${x + w / 2 - 9} ${y - 39} q9 -12 18 0 q-9 4 -18 0z" fill="#fff" opacity=".8"/></g>`
const leaves = (x, y, dir) => [0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="${x + dir * i * 9}" cy="${y + Math.sin(i * 1.6) * 8 + i * 6}" rx="9" ry="5" transform="rotate(${dir * (30 + i * 12)} ${x + dir * i * 9} ${y + i * 6})" fill="${i % 2 ? '#8fae7a' : '#a6c18d'}"/>`).join('')

function wardrobe(wx, pieces, shelf, lower, side) {
  const out = [], boxes = {}
  const W = 400, R = wx + W
  // open door (outer side)
  const d = side < 0
    ? `M${wx} 112 L${wx - 44} 128 L${wx - 44} 636 L${wx} 654Z`
    : `M${R} 112 L${R + 44} 128 L${R + 44} 636 L${R} 654Z`
  const dx = side < 0 ? wx - 44 : R
  out.push(`<path d="${d}" fill="${CREAM2}" stroke="${EDGE}" stroke-width="3"/>`)
  out.push(`<path d="M${side < 0 ? wx - 36 : R + 8} 160 l28 8 v150 l-28 -8z M${side < 0 ? wx - 36 : R + 8} 340 l28 8 v250 l-28 -8z" fill="none" stroke="${EDGE}" stroke-width="2" opacity=".7"/>`)
  out.push(`<circle cx="${side < 0 ? wx - 12 : R + 12}" cy="400" r="5" fill="${GOLD}"/>`)
  // carcass + cornice
  out.push(`<rect x="${wx}" y="110" width="${W}" height="550" rx="10" fill="${CREAM}" stroke="${EDGE}" stroke-width="3"/>`)
  out.push(`<path d="M${wx - 12} 118 L${wx - 12} 96 Q${wx + 60} 90 ${wx + 140} 80 Q${wx + 200} 38 ${wx + 260} 80 Q${wx + 340} 90 ${R + 12} 96 L${R + 12} 118Z" fill="${CREAM2}" stroke="${EDGE}" stroke-width="3" stroke-linejoin="round"/>`)
  out.push(`<circle cx="${wx + 200}" cy="78" r="17" fill="#f4a8bf" stroke="${EDGE}" stroke-width="2.4"/><circle cx="${wx + 200}" cy="78" r="8" fill="#fde3ea"/><path d="M${wx + 40} 104 Q${wx + 110} 96 ${wx + 170} 98 M${wx + 230} 98 Q${wx + 290} 96 ${wx + 360} 104" stroke="${EDGE}" stroke-width="2.4" fill="none"/>`)
  out.push(leaves(wx + 6, 100, 1), leaves(R - 6, 100, -1))
  // inside
  out.push(`<defs><linearGradient id="wi${side > 0 ? 'r' : 'l'}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c47f7c"/><stop offset="1" stop-color="#e4aaa4"/></linearGradient></defs>`)
  out.push(`<rect x="${wx + 20}" y="146" width="${W - 40}" height="384" rx="8" fill="url(#wi${side > 0 ? 'r' : 'l'})" stroke="${EDGE}" stroke-width="3"/>`)
  out.push(`<path d="M${wx + 20} 214 H${R - 20} v10 H${wx + 20}z" fill="${CREAM2}" stroke="${EDGE}" stroke-width="2"/>`)           // top shelf
  out.push(`<path d="M${wx + 20} 506 H${R - 20} v12 H${wx + 20}z" fill="${CREAM2}" stroke="${EDGE}" stroke-width="2"/>`)           // lower shelf
  out.push(`<path d="M${wx + 22} 244 H${R - 22}" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>`)                      // rail
  // top shelf: boxes + bag
  const topY = 212
  for (const s of shelf) {
    if (s.box) out.push(hatbox(wx + s.x, topY, s.w, s.c1, s.c2))
    else { const f = flat(s.slug, wx + s.x, topY - 60, 0.9); out.push(f.svg); boxes[s.slug] = f.box }
  }
  // rail: hanging pieces
  const slotW = (W - 44) / pieces.length
  pieces.forEach((slug, i) => { const h = hung(slug, wx + 22 + slotW * (i + 0.5), 244, slotW - 2); out.push(h.svg); boxes[slug] = h.box })
  // lower shelf contents
  for (const s of lower) {
    if (s.slug) { const f = flat(s.slug, wx + s.x, 504 - 60 * 0.95, 0.95); out.push(f.svg); boxes[s.slug] = f.box }
    else out.push(`<g>${[0, 1, 2].map((i) => `<rect x="${wx + s.x}" y="${500 - 12 * (i + 1)}" width="64" height="12" rx="5" fill="${['#fff3ee', '#f8d9df', '#e9efe2'][i]}" stroke="${EDGE}" stroke-width="1.4"/>`).join('')}</g>`)
  }
  // drawer + feet
  out.push(`<rect x="${wx + 20}" y="548" width="${W - 40}" height="84" rx="8" fill="${CREAM2}" stroke="${EDGE}" stroke-width="3"/>`)
  out.push(`<rect x="${wx + 36}" y="562" width="${W - 72}" height="56" rx="6" fill="none" stroke="${EDGE}" stroke-width="2" opacity=".7"/>`)
  out.push(`<circle cx="${wx + 150}" cy="590" r="7" fill="${GOLD}"/><circle cx="${wx + 250}" cy="590" r="7" fill="${GOLD}"/><path d="M${wx + 178} 592 q22 -14 44 0" stroke="${GOLD}" stroke-width="3" fill="none"/>`)
  out.push(`<path d="M${wx + 10} 660 l-4 20 q4 10 22 10 l16 -4 l-4 -26z M${R - 10} 660 l4 20 q-4 10 -22 10 l-16 -4 l4 -26z" fill="${CREAM2}" stroke="${EDGE}" stroke-width="3"/>`)
  return { svg: out.join(''), boxes }
}

export function buildScene() {
  const L = wardrobe(62, ['romper', 'camisole', 'tiered', 'denim'], [{ box: 1, x: 36, w: 74, c1: '#f9cdd8', c2: '#f4a8bf' }, { box: 1, x: 126, w: 60, c1: '#fff3ee', c2: '#f3d9c4' }, { slug: 'qbag', x: 230 }], [{ stack: 1, x: 36 }], -1)
  const Rr = wardrobe(876, ['halter', 'corset', 'sequin', 'maxiskirt'], [{ box: 1, x: 40, w: 66, c1: '#fff3ee', c2: '#f3d9c4' }, { box: 1, x: 130, w: 80, c1: '#f9cdd8', c2: '#f4a8bf' }, { box: 1, x: 250, w: 60, c1: '#e9efe2', c2: '#c9d9bb' }], [{ slug: 'cherubtop', x: 60 }, { stack: 1, x: 230 }], 1)
  const spots = { ...L.boxes, ...Rr.boxes }
  const svg = `<svg class="art" viewBox="0 0 1338 753" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Two open wardrobes full of nanzo pieces">
    <defs><radialGradient id="fl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f6b9c9"/><stop offset="1" stop-color="#f6b9c9" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="669" cy="702" rx="660" ry="44" fill="url(#fl)"/>
    ${L.svg}${Rr.svg}</svg>`
  return { svg, spots }
}
