/* KEPT, NOT ACTIVE: the dress-up version of the 'Get ready with nanzo' game (vector doll + fitting mirror).
   It is not imported. To re-enable: paste this block into landing.js in place of the original game block,
   restore the commented dress-up markup in theme/sections/landing.liquid, and use 4 tray columns in landing.css. */

/* ---------- get ready: the styling game ----------
   Pick an occasion, then pick pieces from the two wardrobes. Each one flies into your look; the match bar
   scores the look for the occasion; finish an outfit + bag to complete it. Then add the look to the bag. */
import { dollSVG, GARMENTS, GEAR, SLUG, thumbURL } from './doll.js'
import { buildScene } from './scene.js'
const scene = $('#sc')
try { Object.assign(GEAR, JSON.parse($('#nzl-gear').textContent)) } catch { /* sprites missing */ }
const art = buildScene()
scene.insertAdjacentHTML('afterbegin', art.svg)
const OCC = ['Birthday', 'Bachelorette', 'Vacation', 'Date night']
// [name, slot, match with each occasion (0..1)]; the click box comes from where the piece hangs in the drawn wardrobe
const HOT = [
  ['Sage ruffle romper', 'dress', [0.6, 0.4, 1, 0.5]],
  ['Lace camisole', 'top', [0.5, 0.5, 0.7, 0.7]],
  ['Rose tiered dress', 'dress', [1, 0.6, 0.7, 0.8]],
  ['Denim jacket', 'outer', [0.4, 0.4, 0.8, 0.5]],
  ['Quilted rose bag', 'bag', [0.8, 0.6, 0.7, 0.8]],
  ['Ivory halter', 'top', [0.7, 0.8, 0.8, 0.8]],
  ['Crimson corset dress', 'dress', [0.8, 1, 0.3, 1]],
  ['Cherub top', 'top', [0.7, 0.7, 0.6, 0.7]],
  ['Cherub maxi skirt', 'bottom', [0.8, 0.6, 0.9, 0.8]],
  ['Sequin wrap', 'top', [0.9, 1, 0.4, 0.8]],
].map(([name, slot, s]) => ({ name, slot, s }))
HOT.forEach((it) => { const [x1, y1, x2, y2] = art.spots[SLUG[it.name]] || [0, 0, 0, 0]; Object.assign(it, { x1, y1, x2, y2 }) })
const CELLS = [['top', 'Top / dress'], ['bottom', 'Bottom'], ['outer', 'Jacket'], ['bag', 'Bag']]
const DEMO_PRICE = 4200

let occ = 1
let look = {} // slot -> piece ("dress" fills top + bottom)
let styled = parseInt(store.get('nzl_styled') || '0', 10) || 0
let wasComplete = false
const hotBtns = new Map()

const thumb = (it) => thumbURL(SLUG[it.name])

/* ---- UI scaffolding ---- */
const gocc = $('#gocc'), tray = $('#tray')
OCC.forEach((name, i) => {
  const b = document.createElement('button')
  b.type = 'button'; b.className = 'gm-chip'; b.textContent = name
  b.addEventListener('click', () => { occ = i; render() })
  gocc.appendChild(b)
})
const cells = CELLS.map(([slot, label]) => {
  const el = document.createElement('div')
  el.className = 'gm-cell'; el.dataset.slot = slot
  tray.appendChild(el)
  return { slot, label, el }
})
const slotItem = (slot) => (slot === 'top' ? look.dress || look.top : slot === 'bottom' ? (look.dress ? null : look.bottom) : look[slot])
const worn = () => [...new Set(Object.values(look).filter(Boolean))]

function score() {
  const items = worn()
  const outfit = !!look.dress || !!(look.top && look.bottom)
  const missing = []
  if (!outfit) missing.push(look.top ? 'a bottom' : look.bottom ? 'a top' : 'an outfit')
  if (!look.bag) missing.push('a bag')
  const pct = items.length ? Math.round((items.reduce((n, i) => n + i.s[occ], 0) / items.length) * 100) : 0
  return { items, pct, missing, complete: outfit && !!look.bag }
}

let placed = null
function render() {
  $$('.gm-chip', gocc).forEach((b, i) => { b.classList.toggle('on', i === occ); b.setAttribute('aria-pressed', String(i === occ)) })
  cells.forEach(({ slot, label, el }) => {
    const it = slotItem(slot)
    const dressBottom = slot === 'bottom' && look.dress
    el.classList.toggle('on', !!it)
    el.classList.toggle('off', !!dressBottom)
    el.innerHTML = `${it ? `<img alt="${esc(it.name)}" src="${thumb(it)}"${placed === it ? ' class="pop"' : ''}>` : ''}<small>${dressBottom ? 'Dress' : label}</small>`
  })
  hotBtns.forEach((b, it) => b.classList.toggle('worn', worn().includes(it)))
  pickBtns.forEach((b, it) => { const on = worn().includes(it); b.classList.toggle('worn', on); b.setAttribute('aria-pressed', String(on)) })
  dress()

  const s = score()
  $('#gbar').style.width = `${s.pct}%`
  $('#gpct').textContent = s.items.length ? `${s.pct}%` : ''
  let msg
  if (!s.items.length) msg = 'Pick pieces from the wardrobes.'
  else if (!s.complete) msg = `Still missing: ${s.missing.join(', ')}.`
  else if (s.pct >= 90) msg = 'Main character. Screenshot this look.'
  else if (s.pct >= 75) msg = 'So cute. Swap one piece to hit 100%.'
  else msg = `Hmm, not very ${OCC[occ].toLowerCase()}. Try a swap?`
  $('#gmsg').textContent = msg
  $('#gstars').textContent = s.complete ? (s.pct >= 90 ? '★★★' : s.pct >= 75 ? '★★☆' : '★☆☆') : ''
  $('#gcount').textContent = `Looks styled: ${styled}`
  $('#atc').disabled = !s.items.length

  if (s.complete && !wasComplete) celebrate(s)
  wasComplete = s.complete
  placed = null
}

function say(text) {
  const bub = $('#bub')
  bub.textContent = text
  bub.classList.add('on')
  clearTimeout(bub.t); bub.t = setTimeout(() => bub.classList.remove('on'), 2600)
}
function sparkle(n, x = 50, y = 42) {
  if (reduce) return
  for (let i = 0; i < n; i++) {
    const sp = document.createElement('span')
    sp.className = 'sp'; sp.textContent = '✦'
    const a = Math.random() * 6.28, d = 50 + Math.random() * 90
    sp.style.cssText = `left:${x}%;top:${y}%;--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;margin-left:${Math.random() * 40 - 20}px`
    scene.appendChild(sp)
    setTimeout(() => sp.remove(), 1200)
  }
  scene.classList.remove('bump'); void scene.offsetWidth; scene.classList.add('bump')
}
function celebrate(s) {
  styled++
  store.set('nzl_styled', String(styled))
  say(s.pct >= 90 ? 'OBSESSED. Look complete!' : 'Look complete!')
  sparkle(18)
}

/* ---- the fitting mirror: she wears whatever is in the look ---- */
const doll = $('#doll'), mirror = $('#mirror')
doll.innerHTML = dollSVG()
const gear = $('#gear', doll), lb = $('#lb', doll), ls = $('#ls', doll)
const dollLayers = new Map()
function dress() {
  const on = new Set(worn())
  dollLayers.forEach((el, it) => { if (!on.has(it)) { el.classList.add('out'); setTimeout(() => el.remove(), 260); dollLayers.delete(it) } })
  on.forEach((it) => {
    if (dollLayers.has(it)) return
    const g = GARMENTS[SLUG[it.name]]
    if (!g) return
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    el.setAttribute('class', 'dgear'); el.dataset.z = g.z; el.innerHTML = g.svg
    gear.appendChild(el); dollLayers.set(it, el)
    requestAnimationFrame(() => el.classList.add('in'))
  })
  ;[...gear.children].sort((a, b) => a.dataset.z - b.dataset.z).forEach((el) => gear.appendChild(el))
  const covers = new Set([...on].flatMap((it) => GARMENTS[SLUG[it.name]]?.covers || []))
  lb.style.display = covers.has('top') ? 'none' : ''
  ls.style.display = covers.has('bottom') ? 'none' : ''
  mirror.dataset.occ = occ
  if (on.size) { doll.classList.remove('hop'); void doll.offsetWidth; doll.classList.add('hop') }
}

/* ---- the wardrobe picker: clean pieces you can tap on any screen ---- */
const gpick = $('#gpick')
const pickBtns = new Map()
HOT.forEach((it) => {
  const b = document.createElement('button')
  b.type = 'button'; b.className = 'pc'
  b.innerHTML = `<img alt="" src="${thumb(it)}" loading="lazy"><small>${esc(it.name)}</small>`
  b.setAttribute('aria-label', `${it.name}, ${it.slot === 'dress' ? 'dress' : it.slot}`)
  b.addEventListener('click', () => pick(it, b))
  pickBtns.set(it, b)
  gpick.appendChild(b)
})

/* ---- picking ---- */
function toggle(it) {
  const had = worn().includes(it)
  if (had) Object.keys(look).forEach((k) => { if (look[k] === it) delete look[k] })
  else if (it.slot === 'dress') { delete look.top; delete look.bottom; look.dress = it }
  else { if (it.slot === 'top' || it.slot === 'bottom') delete look.dress; look[it.slot] = it }
  return !had
}
const cellFor = (it) => cells.find((c) => c.slot === (it.slot === 'dress' ? 'top' : it.slot))?.el

function pick(it, btn, delay = 0) {
  const added = toggle(it)
  if (!added) { render(); return say(`${it.name} goes back in the wardrobe.`) }
  placed = it
  const target = cellFor(it)
  const done = flyToBag({ fromRect: btn.getBoundingClientRect(), to: doll, image: thumb(it), radius: '10px', size: 58, delay })
  // show the piece in its slot as it lands
  done.then(render)
  say(`Ooh. The ${it.name.toLowerCase()}.`)
  sparkle(6, (((it.x1 + it.x2) / 2) / 1338) * 100, (((it.y1 + it.y2) / 2) / 753) * 100)
}

HOT.forEach((it) => {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'hs'
  b.style.cssText = `left:${it.x1 / 13.38}%;top:${it.y1 / 7.53}%;width:${(it.x2 - it.x1) / 13.38}%;height:${(it.y2 - it.y1) / 7.53}%`
  b.setAttribute('aria-label', `${it.name}, ${it.slot === 'dress' ? 'dress' : it.slot}`)
  b.innerHTML = `<span class="p">${it.name}</span>`
  b.addEventListener('click', () => pick(it, b))
  hotBtns.set(it, b)
  scene.appendChild(b)
})

/* ---- actions ---- */
const rnd = (a) => a[(Math.random() * a.length) | 0]
const bySlot = (s) => HOT.filter((h) => h.slot === s)
$('#gshuf').addEventListener('click', () => {
  look = {}; wasComplete = false
  const next = []
  if (Math.random() < 0.5) next.push(rnd(bySlot('dress')))
  else next.push(rnd(bySlot('top')), rnd(bySlot('bottom')))
  if (Math.random() < 0.5) next.push(rnd(bySlot('outer')))
  next.push(rnd(bySlot('bag')))
  next.forEach((it, i) => {
    if (it.slot === 'dress') { delete look.top; delete look.bottom; look.dress = it }
    else { if (it.slot === 'top' || it.slot === 'bottom') delete look.dress; look[it.slot] = it }
    flyToBag({ fromRect: hotBtns.get(it).getBoundingClientRect(), to: doll, image: thumb(it), radius: '10px', size: 50, delay: i * 140 }).then(() => { if (i === next.length - 1) render() })
  })
  say('Surprise! Does she like it?')
  render()
})
$('#grst').addEventListener('click', () => { look = {}; wasComplete = false; render(); say('Fresh start. What are we wearing?') })

$('#atc').addEventListener('click', () => {
  const items = worn()
  if (!items.length) return toast('Pick a piece from the wardrobes first')
  const lines = [], missing = []
  items.forEach((it) => {
    const cell = cellFor(it)
    const rect = cell.getBoundingClientRect()
    // match each piece to a real product by name (e.g. a product titled "Rose tiered dress")
    const hit = pieces.find((p) => p.variants && (p.title.toLowerCase().includes(it.name.toLowerCase()) || it.name.toLowerCase().includes(p.title.toLowerCase())))
    if (hit) {
      const l = lineFor(hit, hit.sizes.includes('M') ? 'M' : hit.sizes[0], rect, 58)
      if (l) { l.fly.image = thumb(it) || l.fly.image; return lines.push(l) }
    }
    if (!live) {
      lines.push({ id: undefined, quantity: 1, meta: { key: it.name, title: it.name, size: '', price: DEMO_PRICE, image: thumb(it), url: '' }, fly: { fromRect: rect, image: thumb(it), radius: '10px', size: 58 } })
    } else missing.push(it.name)
  })
  if (lines.length) addToBag(lines, lines.length > 1 ? `Your look (${lines.length} pieces)` : lines[0].meta.title)
  if (missing.length) toast(`Not in the shop yet: ${missing.join(', ')}`)
})
render()

