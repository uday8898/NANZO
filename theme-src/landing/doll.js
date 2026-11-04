/* The fitting-mirror doll and every garment, drawn as vector art on one 270x580 canvas so the clothes
   always fit the body and stay crisp at any size. */

const SKIN = '#f7cdb0', SKIN2 = '#eaa985', HAIR = '#6a3826', HAIR2 = '#4a2417', INK = '#3b2420'

// scalloped bottom edge, running right to left, starting at (x2, y)
const hem = (x1, x2, y, n, d) => {
  const w = (x2 - x1) / n
  let s = ''
  for (let i = 0; i < n; i++) s += ` Q${(x2 - w * i - w / 2).toFixed(1)} ${y + d} ${(x2 - w * (i + 1)).toFixed(1)} ${y}`
  return s
}
const mirror = (inner) => `<g transform="translate(270 0) scale(-1 1)">${inner}</g>`

/* ---------------- the girl ---------------- */
const DEFS = `<defs>
  <radialGradient id="fg" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#fee3cf"/><stop offset=".65" stop-color="#f7c9a8"/><stop offset="1" stop-color="#e6a681"/></radialGradient>
  <linearGradient id="sb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9ac88"/><stop offset=".35" stop-color="#fbd6bb"/><stop offset=".7" stop-color="#f6c7a5"/><stop offset="1" stop-color="#e3a47e"/></linearGradient>
  <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e6a37f"/><stop offset=".3" stop-color="#fcdcc3"/><stop offset=".62" stop-color="#f4c19d"/><stop offset="1" stop-color="#df9d77"/></linearGradient>
  <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5234"/><stop offset=".5" stop-color="#5e301d"/><stop offset="1" stop-color="#3b1b10"/></linearGradient>
  <radialGradient id="iris" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#c98a4c"/><stop offset=".55" stop-color="#7a4421"/><stop offset="1" stop-color="#2c160a"/></radialGradient>
  <linearGradient id="lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4506c"/><stop offset="1" stop-color="#a81a3c"/></linearGradient>
  <radialGradient id="shdw" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#c98a8a" stop-opacity=".75"/><stop offset="1" stop-color="#c98a8a" stop-opacity="0"/></radialGradient>
  <radialGradient id="blush" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f58a94" stop-opacity=".6"/><stop offset="1" stop-color="#f58a94" stop-opacity="0"/></radialGradient>
  <linearGradient id="shoe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbd0dc"/><stop offset="1" stop-color="#e58fa9"/></linearGradient>
  <linearGradient id="bra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6f3"/><stop offset="1" stop-color="#f3d3d6"/></linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <clipPath id="eyeL"><path d="M104 92 Q112 83 123 84 Q132 86 134 93 Q119 98 104 92Z"/></clipPath>
</defs>`

const heel = `
  <ellipse cx="123" cy="533" rx="9" ry="6" fill="#f2c4a4"/>
  <path d="M108 528 Q122 520 137 528 L136 537 Q122 532 109 537Z" fill="url(#shoe)"/>
  <path d="M110 529 Q122 523 135 529" stroke="#fff" stroke-opacity=".75" stroke-width="1.6" fill="none"/>
  <path d="M109 537 Q122 535 136 537 L134 543 Q122 541 111 543Z" fill="#d97a98"/>
  <path d="M117 543 L123 543 L121 575 L119 575Z" fill="#d97a98"/><path d="M118 545 L119 573" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>`

const EYE = 'M104 92 Q112 83 123 84 Q132 86 134 93 Q119 98 104 92Z'
const eye = `<g transform="translate(-4 0)">
  <ellipse cx="118" cy="84" rx="16" ry="7" fill="url(#shdw)"/>
  <path d="${EYE}" fill="#f6ecea"/>
  <g clip-path="url(#eyeL)"><circle cx="121" cy="90" r="8.4" fill="url(#iris)"/><circle cx="121" cy="90" r="3.6" fill="#140803"/><circle cx="124" cy="87.4" r="2.3" fill="#fff"/><circle cx="117.5" cy="93" r="1.1" fill="#fff" opacity=".7"/><path d="${EYE}" fill="none"/><path d="M104 92 Q112 83 123 84 Q132 86 134 93 L134 70 L104 70Z" fill="#000" opacity=".18"/></g>
  <path d="M103 92 Q112 82 123 83 Q133 85 135 93" stroke="#1d0f0a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M103 92 L96 88" stroke="#1d0f0a" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M105 88 L100 83 M110 85 L107 79 M116 83 L115 77" stroke="#1d0f0a" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M100 74 Q112 66 130 72" stroke="#4a2417" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/></g>`

export const DOLL_BACK = `
  <g transform="translate(135 152) scale(1) translate(-135 -152)">
  <path d="M76 92 C64 38 102 16 135 16 C168 16 206 38 194 92 C204 150 210 210 200 262 C190 280 166 274 156 262 L114 262 C104 274 80 280 70 262 C60 210 66 150 76 92Z" fill="url(#hg)"/>
  <path d="M84 60 C70 120 74 190 70 258 M186 60 C200 120 196 190 200 258" stroke="#b9774a" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/></g>`

export const DOLL_BODY = `
  <ellipse cx="135" cy="574" rx="46" ry="6" fill="#7a2c48" opacity=".18"/>
  <path d="M97 308 C88 352 106 394 110 430 C105 464 110 496 116 526 L129 526 C133 496 129 464 129 432 C138 394 139 350 139 308Z" fill="url(#lg)"/>
  ${mirror('<path d="M97 308 C88 352 106 394 110 430 C105 464 110 496 116 526 L129 526 C133 496 129 464 129 432 C138 394 139 350 139 308Z" fill="url(#lg)"/>')}
  <path d="M118 340 C122 390 120 450 119 520" stroke="#fff" stroke-width="5" fill="none" opacity=".25" stroke-linecap="round" filter="url(#soft)"/>
  ${mirror('<path d="M118 340 C122 390 120 450 119 520" stroke="#fff" stroke-width="5" fill="none" opacity=".25" stroke-linecap="round" filter="url(#soft)"/>')}
  <path d="M127 128 L143 128 L143 168 Q135 175 127 168Z" fill="url(#sb)"/><ellipse cx="135" cy="152" rx="11" ry="5" fill="#d99a76" opacity=".55" filter="url(#soft)"/>
  <path d="M123 160 L147 160 Q166 163 169 180 C173 198 166 214 155 232 C151 240 150 246 150 252 C152 272 179 292 179 314 L91 314 C91 292 118 272 120 252 C120 246 119 240 115 232 C104 214 97 198 101 180 Q104 163 123 160Z" fill="url(#sb)"/>
  <path d="M110 176 Q122 168 134 176 M136 176 Q148 168 160 176" stroke="#d99a76" stroke-width="2" fill="none" opacity=".6"/>
  <ellipse cx="119" cy="213" rx="15" ry="6" fill="#c98560" opacity=".35" filter="url(#soft)"/><ellipse cx="151" cy="213" rx="15" ry="6" fill="#c98560" opacity=".35" filter="url(#soft)"/>
  <ellipse cx="126" cy="198" rx="7" ry="9" fill="#fff" opacity=".22" filter="url(#soft)"/><ellipse cx="144" cy="198" rx="7" ry="9" fill="#fff" opacity=".22" filter="url(#soft)"/>
  <path d="M103 174 L63 296" stroke="url(#sb)" stroke-width="16" stroke-linecap="round"/>
  <path d="M167 174 L207 296" stroke="url(#sb)" stroke-width="16" stroke-linecap="round"/>
  <ellipse cx="59" cy="308" rx="9" ry="11" fill="url(#lg)"/><ellipse cx="211" cy="308" rx="9" ry="11" fill="url(#lg)"/>
  <g fill="#e04a6a"><rect x="53" y="315" width="3" height="4" rx="1.5"/><rect x="57" y="316" width="3" height="4" rx="1.5"/><rect x="61" y="315" width="3" height="4" rx="1.5"/><rect x="206" y="315" width="3" height="4" rx="1.5"/><rect x="210" y="316" width="3" height="4" rx="1.5"/><rect x="214" y="315" width="3" height="4" rx="1.5"/></g>
  ${heel}${mirror(heel)}
  <g id="lb"><path d="M104 186 Q119 178 133 196 L137 196 Q151 178 166 186 C170 204 156 214 144 211 Q138 208 135 200 Q132 208 126 211 C114 214 100 204 104 186Z" fill="url(#bra)"/><path d="M104 186 Q119 178 133 196 M166 186 Q151 178 137 196" stroke="#efc4c9" stroke-width="2" fill="none"/></g>
  <g id="ls"><path d="M94 302 L176 302 L182 346 L137 346 L135 330 L133 346 L88 346Z" fill="url(#bra)"/><rect x="94" y="302" width="82" height="7" fill="#f3d3d6"/></g>
  <g transform="translate(135 152) scale(1) translate(-135 -152)">
  <path d="M91 88 C91 55 112 40 135 40 C158 40 179 55 179 88 C179 106 170 124 156 136 Q135 150 114 136 C100 124 91 106 91 88Z" fill="url(#fg)"/>
  <path d="M96 98 C100 118 110 132 124 140 M174 98 C170 118 160 132 146 140" stroke="#d99a76" stroke-width="2.6" fill="none" opacity=".45" stroke-linecap="round"/>
  <ellipse cx="108" cy="112" rx="12" ry="8" fill="url(#blush)"/><ellipse cx="162" cy="112" rx="12" ry="8" fill="url(#blush)"/>
  <ellipse cx="91" cy="96" rx="5" ry="9" fill="url(#fg)"/><ellipse cx="179" cy="96" rx="5" ry="9" fill="url(#fg)"/>
  ${eye}${mirror(eye)}
  <path d="M135 90 Q133 102 130 108 Q135 112 140 108" stroke="#c98560" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M133 90 L133 104" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/>
  <path d="M123 120 Q130 112 135 115 Q140 112 147 120 Q135 124 123 120Z" fill="url(#lip)"/>
  <path d="M123 120 Q135 136 147 120 Q135 125 123 120Z" fill="#d8355a"/>
  <path d="M123 120 Q135 123 147 120" stroke="#7d1230" stroke-width="1.1" fill="none"/>
  <ellipse cx="135" cy="128" rx="6.5" ry="2.2" fill="#fff" opacity=".55"/><ellipse cx="131" cy="116" rx="2.6" ry="1" fill="#fff" opacity=".5"/>
  </g>`

const lockL = `<g transform="translate(-10 6)"><path d="M96 70 C78 112 86 156 76 200 C70 232 82 254 76 276 C90 284 106 274 108 262 C116 232 100 206 106 172 C110 140 102 104 112 72Z" fill="url(#hg)"/><path d="M94 110 C88 150 96 190 86 238 M104 118 C100 160 106 200 98 250" stroke="#c0825a" stroke-width="2.4" fill="none" opacity=".45" stroke-linecap="round"/></g>`
export const DOLL_HAIR = `
  <g transform="translate(135 152) scale(1) translate(-135 -152)">
  ${lockL}${mirror(lockL)}
  <path d="M88 82 C84 36 110 26 135 26 C160 26 186 36 182 82 L182 62 Q160 56 135 60 Q110 56 88 62Z" fill="url(#hg)"/>
  <path d="M104 40 Q116 32 132 32" stroke="#d09062" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>
    <g transform="translate(176 76)"><path d="M0 -8 L6 0 L0 8 L-6 0Z" fill="#f9a9c6"/><path d="M0 -8 L0 8 M-6 0 L6 0" stroke="#fff" stroke-width="1" opacity=".8"/></g></g>`

/* ---------------- the garments ----------------
   The exact original designs, as smoothed sprites placed on the doll (native sprite size x scale, in doll units). */
export const GEAR = {}
const SPR = { // native w,h of each sprite, where it sits (centre x, top y), scale, stacking order, what it covers
  tiered: { w: 129, h: 232, ax: 140, ay: 160, s: 0.88, z: 2, covers: ['top', 'bottom'] },
  romper: { w: 132, h: 177, ax: 140, ay: 160, s: 0.9, z: 2, covers: ['top', 'bottom'] },
  corset: { w: 116, h: 192, ax: 140, ay: 168, s: 0.95, z: 2, covers: ['top', 'bottom'] },
  camisole: { w: 81, h: 116, ax: 140, ay: 170, s: 1, z: 2, covers: ['top'] },
  halter: { w: 87, h: 182, ax: 140, ay: 166, s: 0.8, z: 2, covers: ['top'] },
  cherubtop: { w: 66, h: 71, ax: 140, ay: 176, s: 1, z: 2, covers: ['top'] },
  sequin: { w: 161, h: 209, ax: 140, ay: 164, s: 0.8, z: 2, covers: ['top'] },
  maxiskirt: { w: 99, h: 274, ax: 138, ay: 226, s: 1.1, z: 1, covers: ['bottom'] },
  denim: { w: 61, h: 201, ay: 160, s: 1, z: 3, covers: [], at: [[112, 0], [170, 1]] },
  qbag: { w: 86, h: 49, ax: 230, ay: 318, s: 0.9, z: 6, covers: [] },
}
const build = (slug) => {
  const f = SPR[slug], w = f.w * f.s, h = f.h * f.s
  const at = f.at || [[f.ax, 0]]
  const xs = at.map(([x]) => x)
  return {
    z: f.z, covers: f.covers,
    box: [Math.min(...xs) - w / 2, f.ay, Math.max(...xs) - Math.min(...xs) + w, h],
    get svg() { return at.map(([x, flip]) => `<image href="${GEAR[slug] || ''}" x="${x - w / 2}" y="${f.ay}" width="${w}" height="${h}" preserveAspectRatio="none"${flip ? ` transform="translate(${2 * x} 0) scale(-1 1)"` : ''}/>`).join('') },
  }
}
export const GARMENTS = Object.fromEntries(Object.keys(SPR).map((k) => [k, build(k)]))
export const SLUG = { 'Sage ruffle romper': 'romper', 'Lace camisole': 'camisole', 'Rose tiered dress': 'tiered', 'Denim jacket': 'denim', 'Quilted rose bag': 'qbag', 'Ivory halter': 'halter', 'Crimson corset dress': 'corset', 'Cherub top': 'cherubtop', 'Cherub maxi skirt': 'maxiskirt', 'Sequin wrap': 'sequin' }

export const dollSVG = () => `<svg class="dsvg" viewBox="0 0 270 580" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A girl with curly hair, ready to be dressed">
  ${DEFS}<g>${DOLL_BACK}</g><g>${DOLL_BODY}</g><g id="gear"></g><g>${DOLL_HAIR}</g></svg>`

export const thumbURL = (slug) => GEAR[slug] || ''
