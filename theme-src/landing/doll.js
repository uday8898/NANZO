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
const heel = `
  <ellipse cx="123" cy="533" rx="9" ry="6" fill="${SKIN}"/>
  <path d="M108 528 Q122 520 137 528 L136 537 Q122 532 109 537Z" fill="#f4b8c8"/>
  <path d="M110 529 Q122 523 135 529" stroke="#fff" stroke-opacity=".6" stroke-width="1.5" fill="none"/>
  <path d="M109 537 Q122 535 136 537 L134 543 Q122 541 111 543Z" fill="#e7a3b6"/>
  <path d="M117 543 L123 543 L121 575 L119 575Z" fill="#e7a3b6"/>`

export const DOLL_BACK = `
  <g transform="translate(135 152) scale(.9) translate(-135 -152)"><ellipse cx="135" cy="92" rx="72" ry="64" fill="${HAIR}"/>
  ${[[64, 118, 24], [58, 150, 26], [62, 184, 25], [70, 216, 22], [72, 246, 18], [206, 118, 24], [212, 150, 26], [208, 184, 25], [200, 216, 22], [198, 246, 18]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${HAIR}"/><circle cx="${x + (x < 135 ? 4 : -4)}" cy="${y + 4}" r="${r * 0.55}" fill="${HAIR2}" opacity=".35"/>`).join('')}</g>`

export const DOLL_BODY = `
  <ellipse cx="135" cy="574" rx="46" ry="6" fill="#7a2c48" opacity=".16"/>
  <path d="M97 308 C88 352 106 394 110 430 C105 464 110 496 116 526 L129 526 C133 496 129 464 129 432 C138 394 139 350 139 308Z" fill="${SKIN}"/>
  ${mirror('<path d="M97 308 C88 352 106 394 110 430 C105 464 110 496 116 526 L129 526 C133 496 129 464 129 432 C138 394 139 350 139 308Z" fill="' + SKIN + '"/>')}
  <path d="M124 350 C128 400 126 460 126 526" stroke="${SKIN2}" stroke-width="2" fill="none" opacity=".45"/>
  ${mirror(`<path d="M124 350 C128 400 126 460 126 526" stroke="${SKIN2}" stroke-width="2" fill="none" opacity=".45"/>`)}
  <path d="M125 128 L145 128 L146 168 Q135 175 124 168Z" fill="${SKIN}"/><ellipse cx="135" cy="150" rx="11" ry="5" fill="${SKIN2}" opacity=".55"/>
  <path d="M123 160 L147 160 Q166 163 169 180 C173 198 166 214 155 232 C151 240 150 246 150 252 C152 272 179 292 179 314 L91 314 C91 292 118 272 120 252 C120 246 119 240 115 232 C104 214 97 198 101 180 Q104 163 123 160Z" fill="${SKIN}"/>
  <path d="M106 206 Q120 218 134 208 M136 208 Q150 218 164 206" stroke="${SKIN2}" stroke-width="2" fill="none" opacity=".5"/>
  <path d="M120 252 C122 272 106 290 100 312 M150 252 C148 272 164 290 170 312" stroke="${SKIN2}" stroke-width="1.6" fill="none" opacity=".35"/>
  <path d="M103 174 L63 296" stroke="${SKIN}" stroke-width="16" stroke-linecap="round"/>
  <path d="M167 174 L207 296" stroke="${SKIN}" stroke-width="16" stroke-linecap="round"/>
  <ellipse cx="59" cy="308" rx="9" ry="11" fill="${SKIN}"/><ellipse cx="211" cy="308" rx="9" ry="11" fill="${SKIN}"/>
  <path d="M54 311 Q59 318 64 311" stroke="${SKIN2}" stroke-width="1.4" fill="none"/><path d="M206 311 Q211 318 216 311" stroke="${SKIN2}" stroke-width="1.4" fill="none"/>
  ${heel}${mirror(heel)}
  <g id="lb"><path d="M104 186 Q119 178 133 196 L137 196 Q151 178 166 186 C170 204 156 214 144 211 Q138 208 135 200 Q132 208 126 211 C114 214 100 204 104 186Z" fill="#fff0ee"/><path d="M104 186 Q119 178 133 196 M166 186 Q151 178 137 196" stroke="#f1c9cd" stroke-width="2" fill="none"/></g>
  <g id="ls"><path d="M94 302 L176 302 L182 346 L137 346 L135 330 L133 346 L88 346Z" fill="#fff0ee"/><rect x="94" y="302" width="82" height="7" fill="#f6d5d8"/></g>
  <g transform="translate(135 152) scale(.9) translate(-135 -152)">
  <path d="M91 88 C91 55 112 40 135 40 C158 40 179 55 179 88 C179 106 170 124 156 136 Q135 150 114 136 C100 124 91 106 91 88Z" fill="${SKIN}"/>
  <path d="M96 98 C100 118 110 132 124 140 M174 98 C170 118 160 132 146 140" stroke="${SKIN2}" stroke-width="2.4" fill="none" opacity=".5" stroke-linecap="round"/>
  <path d="M104 104 Q114 116 124 118 M166 104 Q156 116 146 118" stroke="#f4a09f" stroke-width="7" fill="none" opacity=".35" stroke-linecap="round"/>
  <ellipse cx="91" cy="96" rx="5" ry="9" fill="${SKIN}"/><ellipse cx="179" cy="96" rx="5" ry="9" fill="${SKIN}"/>
  <path d="M103 90 Q116 76 131 92 Q117 100 103 90Z" fill="#fff"/>
  <path d="M137 92 Q152 76 167 90 Q153 100 137 92Z" fill="#fff"/>
  <ellipse cx="119" cy="90" rx="6.2" ry="7" fill="#4a2417"/><ellipse cx="151" cy="90" rx="6.2" ry="7" fill="#4a2417"/>
  <circle cx="121" cy="88" r="2.2" fill="#fff"/><circle cx="153" cy="88" r="2.2" fill="#fff"/>
  <path d="M102 91 Q116 75 132 92 M168 91 Q152 75 138 92" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M102 91 L95 86 M168 91 L175 86" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M105 82 Q112 73 122 74 M148 74 Q158 73 165 82" stroke="#d99a8c" stroke-width="5" fill="none" opacity=".4" stroke-linecap="round"/>
  <path d="M101 74 L117 67 Q125 67 132 72 M138 72 Q145 67 153 67 L169 74" stroke="${HAIR2}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M135 96 Q132 106 130 110 Q135 112 140 110" stroke="${SKIN2}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M123 120 Q130 113 135 116 Q140 113 147 120 Q135 130 123 120Z" fill="#cf2f52"/><path d="M125 120 Q135 123 145 120" stroke="#8f1632" stroke-width="1.1" fill="none"/><ellipse cx="131" cy="121" rx="3.6" ry="1.3" fill="#fff" opacity=".55"/>
  <circle cx="150" cy="112" r="1.2" fill="${INK}"/></g>`

const lock = `<path d="M96 108 C72 136 102 154 84 184 C70 210 98 226 90 258 L108 258 C118 222 92 206 106 176 C120 146 100 130 108 106Z" fill="${HAIR}"/><path d="M98 130 C90 150 104 164 94 190" stroke="#8a5238" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`
export const DOLL_HAIR = `
  <g transform="translate(135 152) scale(.9) translate(-135 -152)">
  <path d="M88 92 Q84 36 135 32 Q186 36 182 92 Q178 66 160 58 Q146 80 104 62 Q92 70 88 92Z" fill="${HAIR}"/>
  <path d="M104 62 Q130 70 150 58" stroke="#8a5238" stroke-width="2.4" fill="none" opacity=".6"/>
  ${lock}${mirror(lock)}
  ${[[76, 46], [196, 50], [102, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#f48fb1"/><circle cx="${x}" cy="${y}" r="3.6" fill="#fff"/>`).join('')}</g>`

/* ---------------- the garments ---------------- */
const cloud = (id) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9bb9da"/><stop offset=".55" stop-color="#cfdcec"/><stop offset="1" stop-color="#f7e8d8"/></linearGradient>`
const clouds = (cx, cy, k = 1) => `<g fill="#fff6ec" opacity=".85"><ellipse cx="${cx}" cy="${cy}" rx="${16 * k}" ry="${7 * k}"/><ellipse cx="${cx + 11 * k}" cy="${cy - 4 * k}" rx="${10 * k}" ry="${7 * k}"/><ellipse cx="${cx - 10 * k}" cy="${cy - 3 * k}" rx="${9 * k}" ry="${6 * k}"/></g>`
const cherub = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="-7" cy="-2" rx="6" ry="3.4" fill="#fff" opacity=".9" transform="rotate(-25 -7 -2)"/><ellipse cx="7" cy="-2" rx="6" ry="3.4" fill="#fff" opacity=".9" transform="rotate(25 7 -2)"/><circle cx="0" cy="-5" r="3.6" fill="#f2b99a"/><ellipse cx="0" cy="2" rx="3.6" ry="4.4" fill="#f2b99a"/></g>`

export const GARMENTS = {
  tiered: { z: 2, box: [78, 148, 124, 212], covers: ['top', 'bottom'], svg: `
    <path d="M110 176 Q122 166 135 180 Q148 166 160 176 L156 228 L114 228Z" fill="#f7b9c9"/>
    <path d="M118 176 L116 156 M152 176 L154 156" stroke="#ef93ab" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M110 176 Q122 166 135 180 Q148 166 160 176" stroke="#fde3ea" stroke-width="3" fill="none"/>
    <path d="M114 226 L156 226 L168 270 L102 270Z" fill="#f9c6d3"/>
    <path d="M102 264 L168 264 L178 312${hem(92, 178, 312, 6, 7)}Z" fill="#f6b3c5"/>
    <path d="M92 306 L178 306 L192 358${hem(78, 192, 358, 8, 8)}Z" fill="#f3a5ba"/>
    <rect x="110" y="222" width="50" height="8" rx="3" fill="#ef93ab"/>
    <path d="M135 227 q-12 -9 -16 0 q4 9 16 0 q12 9 16 0 q-4 -9 -16 0z" fill="#e57c99"/>
    <g stroke="#fde3ea" stroke-width="1.6" fill="none" opacity=".85"><path d="M104 270 L170 270"/><path d="M96 312 L174 312" stroke-dasharray="3 4"/></g>
    <g fill="#fff" opacity=".7">${[[118, 245], [150, 252], [128, 290], [146, 296], [112, 330], [136, 338], [158, 332], [100, 346]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2"/>`).join('')}</g>` },

  romper: { z: 2, box: [58, 148, 154, 206], covers: ['top', 'bottom'], svg: `
    <path d="M110 172 Q135 186 160 172 C166 196 156 216 158 234 L112 234 C114 216 104 196 110 172Z" fill="#a9c29b"/>
    <path d="M112 232 L158 232 C158 262 176 280 176 302 L178 342 L137 342 L135 314 L133 342 L92 342 L94 302 C94 280 112 262 112 232Z" fill="#9db98f"/>
    <path d="M110 172 Q135 186 160 172" stroke="#e9f2dd" stroke-width="3" fill="none"/>
    <circle cx="98" cy="182" r="17" fill="#b5cca8"/><circle cx="172" cy="182" r="17" fill="#b5cca8"/>
    <path d="M82 190 Q98 200 114 190 M156 190 Q172 200 188 190" stroke="#e9f2dd" stroke-width="3" fill="none"/>
    <rect x="108" y="228" width="54" height="9" rx="4" fill="#7fa070"/>
    <path d="M135 206 L135 232" stroke="#7fa070" stroke-width="2.4"/><path d="M125 200 q10 8 20 0" stroke="#e9f2dd" stroke-width="2" fill="none"/>
    <g fill="#e9f2dd" opacity=".8">${[[118, 258], [150, 264], [124, 296], [148, 302]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2"/>`).join('')}</g>` },

  camisole: { z: 2, box: [92, 148, 86, 122], covers: ['top'], svg: `
    <path d="M108 176 Q121 168 135 182 Q149 168 162 176 C164 200 158 222 156 244 C156 254 164 262 168 270 Q135 282 102 270 C106 262 114 254 114 244 C112 222 106 200 108 176Z" fill="#fbf3e6"/>
    <path d="M116 176 L113 154 M154 176 L157 154" stroke="#ecd9bd" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M108 176 Q121 168 135 182 Q149 168 162 176" stroke="#e7cfae" stroke-width="3" fill="none"/>
    <path d="M102 270 Q135 282 168 270" stroke="#e7cfae" stroke-width="3" fill="none"/>
    <path d="M135 184 L135 268" stroke="#ecd9bd" stroke-width="1.6"/>
    ${[196, 210, 224, 238, 252].map((y) => `<circle cx="135" cy="${y}" r="2.2" fill="#d9b88f"/>`).join('')}
    <path d="M110 214 Q120 218 128 210 M142 210 Q150 218 160 214" stroke="#ecd9bd" stroke-width="1.6" fill="none"/>` },

  halter: { z: 2, box: [96, 146, 78, 122], covers: ['top'], svg: `
    <path d="M122 148 L106 200 Q108 218 126 214 L135 196Z" fill="#faf4ea"/>
    <path d="M148 148 L164 200 Q162 218 144 214 L135 196Z" fill="#f4ebdc"/>
    <path d="M104 204 Q135 190 166 204 C164 222 156 236 156 246 C156 256 162 262 164 270 Q135 280 106 270 C108 262 114 256 114 246 C114 236 106 222 104 204Z" fill="#f7efe1"/>
    <path d="M110 214 Q135 232 160 216 M112 236 Q135 252 158 238" stroke="#e6d6bd" stroke-width="2.2" fill="none"/>
    <path d="M128 148 Q135 140 142 148" stroke="#e6d6bd" stroke-width="3" fill="none"/>` },

  cherubtop: { z: 2, box: [94, 166, 82, 66], covers: ['top'], svg: `
    <defs>${cloud('ct')}</defs>
    <path d="M104 180 Q119 172 135 184 Q151 172 166 180 L168 224 Q135 234 102 224Z" fill="url(#ct)"/>
    ${clouds(120, 214, 0.8)}${clouds(152, 200, 0.7)}${cherub(124, 200, 0.9)}${cherub(150, 214, 0.8)}
    <path d="M104 180 Q119 172 135 184 Q151 172 166 180" stroke="#fff6ec" stroke-width="2.4" fill="none"/>` },

  maxiskirt: { z: 1, box: [78, 232, 114, 296], covers: ['bottom'], svg: `
    <defs>${cloud('mk')}<clipPath id="mkc"><path d="M114 246 L156 246 C160 266 180 282 184 304 L194 520 L76 520 L86 304 C90 282 110 266 114 246Z"/></clipPath></defs>
    <path d="M114 246 L156 246 C160 266 180 282 184 304 L194 520 L76 520 L86 304 C90 282 110 266 114 246Z" fill="url(#mk)"/>
    <g clip-path="url(#mkc)">${clouds(112, 300, 1.3)}${clouds(150, 360, 1.5)}${clouds(104, 430, 1.4)}${clouds(160, 480, 1.4)}${cherub(124, 330, 1.5)}${cherub(152, 400, 1.6)}${cherub(112, 470, 1.5)}${cherub(164, 306, 1.2)}</g>
    <rect x="110" y="242" width="50" height="10" rx="4" fill="#8aa9cd"/>
    <path d="M150 400 L146 520" stroke="#fff6ec" stroke-width="1.5" opacity=".6"/>` },

  corset: { z: 2, box: [84, 150, 102, 206], covers: ['top', 'bottom'], svg: `
    <path d="M106 176 Q120 168 135 182 Q150 168 164 176 C168 200 158 226 156 252 L114 252 C112 226 102 200 106 176Z" fill="#a31f3d"/>
    <path d="M114 252 L156 252 C158 280 182 300 184 346 Q135 360 86 346 C88 300 112 280 114 252Z" fill="#8c1a35"/>
    <path d="M118 262 Q135 300 124 344 M152 262 Q140 300 152 344 M135 258 Q130 300 136 350" stroke="#c63a58" stroke-width="3" fill="none" opacity=".8"/>
    <path d="M106 176 Q120 168 135 182 Q150 168 164 176" stroke="#d9526d" stroke-width="2.4" fill="none"/>
    <path d="M135 186 L135 250" stroke="#5c0f22" stroke-width="1.5"/>
    ${[196, 212, 228, 244].map((y) => `<path d="M128 ${y} L142 ${y + 8} M142 ${y} L128 ${y + 8}" stroke="#f0b8c4" stroke-width="1.6"/>`).join('')}
    <path d="M118 184 L118 250 M152 184 L152 250" stroke="#7a1229" stroke-width="1.4" opacity=".7"/>
    <g fill="#ffd6de" opacity=".7">${[[114, 200], [156, 210], [122, 230], [150, 238], [114, 222]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join('')}</g>` },

  sequin: { z: 2, box: [58, 148, 154, 124], covers: ['top'], svg: `
    <defs><pattern id="sqp" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#f09ab3"/><circle cx="3" cy="3" r="2.2" fill="#ffd3de"/></pattern></defs>
    <path d="M98 176 Q135 166 172 176 C174 204 158 228 156 250 C156 258 162 264 166 270 Q135 280 104 270 C108 264 114 258 114 250 C112 228 96 204 98 176Z" fill="url(#sqp)"/>
    <path d="M92 178 L56 262 Q72 276 90 262 L110 200Z" fill="url(#sqp)"/>
    <path d="M178 178 L214 262 Q198 276 180 262 L160 200Z" fill="url(#sqp)"/>
    <path d="M106 200 Q135 230 164 200" stroke="#e57a98" stroke-width="3" fill="none"/>
    <path d="M92 178 Q135 166 178 178" stroke="#ffe0e8" stroke-width="2.4" fill="none"/>` },

  denim: { z: 3, box: [52, 150, 166, 140], covers: [], svg: `
    <path d="M100 178 L62 290" stroke="#9fbbd9" stroke-width="25" stroke-linecap="round"/>
    <path d="M170 178 L208 290" stroke="#9fbbd9" stroke-width="25" stroke-linecap="round"/>
    <path d="M65 286 L59 304" stroke="#7fa0c4" stroke-width="27" stroke-linecap="round"/><path d="M205 286 L211 304" stroke="#7fa0c4" stroke-width="27" stroke-linecap="round"/>
    <path d="M100 166 L124 160 L130 204 L126 276 L96 276 Q90 220 100 166Z" fill="#a9c3df"/>
    <path d="M170 166 L146 160 L140 204 L144 276 L174 276 Q180 220 170 166Z" fill="#a9c3df"/>
    <path d="M124 160 L132 182 L116 188Z M146 160 L138 182 L154 188Z" fill="#c4d8ec"/>
    <path d="M96 268 L126 268 M144 268 L174 268" stroke="#7fa0c4" stroke-width="5"/>
    <rect x="102" y="222" width="18" height="16" rx="2" fill="none" stroke="#7fa0c4" stroke-width="1.6"/><rect x="150" y="222" width="18" height="16" rx="2" fill="none" stroke="#7fa0c4" stroke-width="1.6"/>
    <g stroke="#7fa0c4" stroke-width="1.4" opacity=".7"><path d="M112 176 L108 262"/><path d="M158 176 L162 262"/></g>` },

  qbag: { z: 6, box: [188, 292, 60, 66], covers: [], svg: `
    <path d="M204 330 Q213 296 232 330" stroke="#d9a65a" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <rect x="196" y="326" width="44" height="30" rx="7" fill="#f6b3c4"/>
    <path d="M196 340 L240 340 M210 326 L210 356 M224 326 L224 356" stroke="#e98fa8" stroke-width="1.6" opacity=".8"/>
    <path d="M196 340 L240 340" stroke="#fde3ea" stroke-width="0" />
    <rect x="212" y="330" width="14" height="10" rx="3" fill="#e6b45f"/><circle cx="219" cy="335" r="2" fill="#fff3d4"/>` },
}
export const SLUG = { 'Sage ruffle romper': 'romper', 'Lace camisole': 'camisole', 'Rose tiered dress': 'tiered', 'Denim jacket': 'denim', 'Quilted rose bag': 'qbag', 'Ivory halter': 'halter', 'Crimson corset dress': 'corset', 'Cherub top': 'cherubtop', 'Cherub maxi skirt': 'maxiskirt', 'Sequin wrap': 'sequin' }

export const dollSVG = () => `<svg class="dsvg" viewBox="0 0 270 580" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A girl with curly hair, ready to be dressed">
  <g>${DOLL_BACK}</g><g>${DOLL_BODY}</g><g id="gear"></g><g>${DOLL_HAIR}</g></svg>`

const thumbs = {}
export const thumbURL = (slug) => {
  if (thumbs[slug]) return thumbs[slug]
  const g = GARMENTS[slug]
  if (!g) return ''
  const [x, y, w, h] = g.box
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}">${g.svg}</svg>`
  return (thumbs[slug] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg))
}
