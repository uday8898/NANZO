import './landing.css'
import { flyToBag } from '../fly.js'

/* ------------------------------------------------------------------------------------------------
   nanzo "After Hours" landing page.
   Ported from the standalone nanzo.html. What changed on purpose:
   • one requestAnimationFrame-throttled scroll loop (reads first, then writes) instead of 4 handlers
   • the footer shell physics pauses when off-screen, is DPR-aware and uses a spatial grid
   • the currency wallet no longer shares a variable with the canvas width (that bug zeroed it)
   • bag, sizes and add-to-cart talk to the real Shopify cart
   • audio timers are cleared when sound is off / the tab is hidden
------------------------------------------------------------------------------------------------ */

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const fine = matchMedia('(pointer: fine)').matches
const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
const clamp01 = (n) => Math.min(1, Math.max(0, n))
const store = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch { /* private mode */ } },
  sget: (k) => { try { return sessionStorage.getItem(k) } catch { return null } },
  sset: (k, v) => { try { sessionStorage.setItem(k, v) } catch { /* private mode */ } },
}

/* ---------- toast ---------- */
let toastTimer
function toast(msg) {
  const t = $('#toast')
  t.textContent = msg
  t.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400)
}

/* ---------- one scroll/resize scheduler: every job reads first, returns a writer ---------- */
const jobs = []
let queued = false
const requestFrame = () => { if (!queued) { queued = true; requestAnimationFrame(runJobs) } }
function runJobs() {
  queued = false
  const writers = jobs.map((j) => j()).filter(Boolean)
  writers.forEach((w) => w())
}
addEventListener('scroll', requestFrame, { passive: true })
addEventListener('resize', requestFrame)

let docH = 1
const measureDoc = () => { docH = document.documentElement.scrollHeight }

/* ---------- sound: soft after-hours pad, generated live ---------- */
const audio = (() => {
  let AC, master, lp, running = false, step = 0, padTimer, noteTimer
  const CH = [[57, 64, 67, 71, 74], [53, 60, 64, 69, 72], [50, 57, 60, 64, 69], [52, 59, 62, 68, 71]]
  const fq = (n) => 440 * Math.pow(2, (n - 69) / 12)

  function pad() {
    const t = AC.currentTime
    CH[step++ % 4].forEach((n, i) => {
      const o = AC.createOscillator(), g = AC.createGain()
      o.type = i % 2 ? 'triangle' : 'sine'
      o.frequency.value = fq(n)
      o.detune.value = (Math.random() - 0.5) * 14
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.05, t + 2)
      g.gain.linearRampToValueAtTime(0, t + 7)
      o.connect(g); g.connect(lp)
      o.start(t); o.stop(t + 7.2)
    })
  }
  function note(n) {
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain()
    o.frequency.value = fq(n)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
    o.connect(g); g.connect(lp)
    o.start(t); o.stop(t + 2.3)
  }
  function run() {
    pad()
    padTimer = setInterval(pad, 6000)
    noteTimer = setInterval(() => { if (Math.random() < 0.7) note([76, 79, 81, 83, 86][(Math.random() * 5) | 0]) }, 1500)
  }
  function halt() { clearInterval(padTimer); clearInterval(noteTimer) }

  const api = {
    get on() { return running },
    start() {
      if (!AC) {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (!Ctx) return false
        AC = new Ctx()
        master = AC.createGain(); master.gain.value = 0
        lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100
        const delay = AC.createDelay(1); delay.delayTime.value = 0.46
        const fb = AC.createGain(); fb.gain.value = 0.42
        lp.connect(master); lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(master)
        master.connect(AC.destination)
      }
      AC.resume?.()
      master.gain.setTargetAtTime(0.55, AC.currentTime, 1.5)
      if (!running) { running = true; run() }
      return true
    },
    stop() {
      if (!AC) return
      running = false
      halt()
      master.gain.setTargetAtTime(0, AC.currentTime, 0.4)
    },
  }
  // don't burn CPU or play to nobody in a background tab
  document.addEventListener('visibilitychange', () => {
    if (!AC) return
    if (document.hidden) { halt(); AC.suspend?.() } else if (running) { AC.resume?.(); halt(); run() }
  })
  return api
})()

/* ---------- gate ---------- */
const sndBtn = $('#snd')
const paintSound = () => { sndBtn.textContent = audio.on ? 'Sound on' : 'Sound off'; sndBtn.setAttribute('aria-pressed', String(audio.on)) }
function enter(withSound, instant) {
  if (withSound) audio.start()
  const gate = $('#gate')
  if (instant) gate.style.transition = 'none'
  gate.classList.add('out')
  document.body.classList.add('go')
  store.sset('nzl_in', '1')
  sndBtn.hidden = false
  paintSound()
}
$('#e1').addEventListener('click', () => enter(true))
$('#e0').addEventListener('click', () => enter(false))
sndBtn.addEventListener('click', () => { audio.on ? audio.stop() : audio.start(); paintSound() })
// reduced motion, a deep link, or already inside this session: no curtain
if (reduce || location.hash === '#after-hours' || store.sget('nzl_in') === '1') enter(false, true)

/* ---------- products (from Shopify, or the design's placeholders) ---------- */
const PLACEHOLDERS = [
  ['Midnight corset', 5400, 'linear-gradient(#4E331B,#8E8A43)', ['XS', 'S', 'M', 'L']],
  ['Cherub maxi skirt', 6200, 'linear-gradient(#D9E8E1,#FFFAF0)', ['XS', 'S', 'M', 'L']],
  ['Cherub top', 3800, 'linear-gradient(#D9E8E1,#FFE9EF)', ['XS', 'S', 'M', 'L']],
  ['Ivory halter', 4200, 'linear-gradient(#D8CC7A,#FFFAF0)', ['XS', 'S', 'M', 'L']],
  ['Sequin wrap', 5800, 'linear-gradient(#FCB1C5,#FFE9EF)', ['One size']],
  ['Velvet mini', 4600, 'linear-gradient(#8E8A43,#D8CC7A)', ['XS', 'S', 'M', 'L']],
  ['Evening heels', 6800, 'linear-gradient(#292725,#4E331B)', ['36', '37', '38', '39', '40']],
  ['Pearl bag', 3200, 'linear-gradient(#FCB1C5,#FFFAF0)', ['One size']],
]
const GRADS = ['linear-gradient(#4E331B,#8E8A43)', 'linear-gradient(#D9E8E1,#FFFAF0)', 'linear-gradient(#D8CC7A,#FFFAF0)', 'linear-gradient(#FCB1C5,#FFE9EF)']

function loadProducts() {
  let raw = []
  try { raw = JSON.parse($('#nzl-products')?.textContent || '[]') } catch { /* fall back to placeholders */ }
  if (!raw.length) {
    return PLACEHOLDERS.map(([title, price, grad, sizes]) => ({ title, price, grad, sizes, variants: null, image: '' }))
  }
  return raw.map((p, i) => {
    const sizeIdx = Math.max(0, (p.options || []).findIndex((o) => /size/i.test(o)))
    const single = p.variants.length === 1 || (p.options?.length === 1 && /title/i.test(p.options[0]))
    const sizes = single ? [] : [...new Set(p.variants.map((v) => v.options[sizeIdx]))]
    return { title: p.title, price: p.price / 100, image: p.image || '', grad: GRADS[i % GRADS.length], sizes, sizeIdx, variants: p.variants, url: p.url }
  })
}
const pieces = loadProducts()
const live = !!pieces[0]?.variants

// pick the variant for a size (first available if several options remain)
function variantFor(p, size) {
  if (!p.variants) return null
  const list = p.variants.filter((v) => !size || v.options[p.sizeIdx] === size)
  return list.find((v) => v.available) || null
}

/* ---------- bag: the real Shopify cart, or a demo bag until products exist ---------- */
const demo = []
const demoCart = () => {
  const items = demo.map((d) => ({ ...d, final_line_price: d.price * d.quantity }))
  return { items, item_count: items.reduce((n, i) => n + i.quantity, 0), total_price: items.reduce((n, i) => n + i.final_line_price, 0), currency: 'INR' }
}
const jsonPost = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
const cart = {
  async get() {
    if (!live) return demoCart()
    const r = await fetch('/cart.js', { headers: { Accept: 'application/json' } })
    return r.json()
  },
  // lines: [{ id, quantity, meta:{ key,title,size,price,image,url } }]
  async add(lines) {
    if (!live) {
      lines.forEach(({ quantity = 1, meta }) => {
        const hit = demo.find((d) => d.key === meta.key)
        if (hit) hit.quantity += quantity
        else demo.push({ key: meta.key, product_title: meta.title, variant_title: meta.size || '', price: Math.round(meta.price * 100), quantity, image: meta.image || '', url: meta.url || '' })
      })
      return {}
    }
    const r = await jsonPost('/cart/add.js', { items: lines.map(({ id, quantity = 1 }) => ({ id, quantity })) })
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).description || 'Could not add that to your bag')
    return r.json()
  },
  async change(line, quantity) {
    if (!live) {
      const d = demo[line - 1]
      if (d) { if (quantity <= 0) demo.splice(line - 1, 1); else d.quantity = quantity }
      return demoCart()
    }
    return (await jsonPost('/cart/change.js', { line, quantity })).json()
  },
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const drawer = $('#cd')
function paintCart(c) {
  $('#bagn').textContent = c.item_count
  $('#cdt').textContent = inr(c.total_price / 100)
  const list = $('#cdi')
  const cta = $('#cdc')
  cta.style.display = c.items.length ? '' : 'none'
  cta.href = live ? '/checkout' : '#'
  if (!c.items.length) { list.innerHTML = '<p class="em p">Your bag is empty.</p>'; return }
  list.innerHTML = c.items.map((it, i) => {
    const title = it.url ? `<a href="${esc(it.url)}">${esc(it.product_title)}</a>` : esc(it.product_title)
    return `
    <div class="ln">
      <div class="th" style="${it.image ? `background-image:url(${esc(it.image)})` : ''}"></div>
      <div><b>${title}</b>${it.variant_title && it.variant_title !== 'Default Title' ? `<small>${esc(it.variant_title)}</small>` : ''}
        <div class="qt"><button type="button" data-q="${i + 1}:${it.quantity - 1}" aria-label="Fewer">−</button><span>${it.quantity}</span><button type="button" data-q="${i + 1}:${it.quantity + 1}" aria-label="More">+</button></div></div>
      <b>${inr((it.final_line_price ?? it.line_price) / 100)}</b>
    </div>`
  }).join('')
}
const refreshCart = async () => { try { paintCart(await cart.get()) } catch { /* offline */ } }
function openDrawer(o) {
  drawer.classList.toggle('on', o)
  drawer.setAttribute('aria-hidden', String(!o))
  if (o) refreshCart()
}
$('#bag').addEventListener('click', () => openDrawer(true))
$('#cdc').addEventListener('click', (e) => { if (!live) { e.preventDefault(); toast('Preview bag: checkout switches on once your products are in Shopify') } })
drawer.addEventListener('click', async (e) => {
  if (e.target.closest('[data-close]')) return openDrawer(false)
  const q = e.target.closest('[data-q]')
  if (q) { const [line, qty] = q.dataset.q.split(':').map(Number); paintCart(await cart.change(line, qty)) }
})
refreshCart()

/* ---------- Nanzo currency (UI only: no loyalty backend yet) ---------- */
let wallet = Math.min(7, parseInt(store.get('nzl_wallet') || '0', 10) || 0)
const coins = $$('#sl i')
function paintWallet() {
  coins.forEach((x, i) => x.classList.toggle('on', i < wallet))
  $('#cm').textContent = wallet < 5
    ? `Collect ${5 - wallet} more for 50% off your next piece, or ${7 - wallet} for a free one.`
    : wallet < 7
      ? `50% off your next piece is yours. Redeem it now, or keep going: ${7 - wallet} more for a free piece.`
      : 'A free piece is yours. Choose anything from After Hours.'
  $('#r5').hidden = wallet < 5
  $('#r7').hidden = wallet < 7
  store.set('nzl_wallet', String(wallet))
}
const earn = () => { if (wallet < 7) { wallet++; paintWallet() } }
$('#o').addEventListener('click', async () => {
  const c = await cart.get().catch(() => null)
  if (c?.item_count) openDrawer(true)
  else { toast('Your bag is empty. Pick a piece first.'); $('#drop').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }) }
})
$('#r5').addEventListener('click', () => { wallet -= 5; paintWallet(); toast('50% off noted for your next piece') })
$('#r7').addEventListener('click', () => { wallet -= 7; paintWallet(); toast('One free piece, coming up') })
paintWallet()

// lines: [{ id, quantity, meta, fly:{ rect|from, image, background, radius } }]. The product flies to the bag, then the count updates.
let demoToldOnce = false
async function addToBag(lines, label) {
  if (!lines.length) return toast('Nothing to add yet')
  try {
    await cart.add(lines)
  } catch (err) {
    return toast(err.message)
  }
  earn()
  if (!live && !demoToldOnce) { demoToldOnce = true; toast(`${label} added to a preview bag. Add products to the "After Hours" collection for real orders`) }
  else toast(`${label} added. +1 Nanzo currency`)
  const bagBtn = $('#bag')
  Promise.all(lines.map((l, i) => flyToBag({ ...l.fly, to: bagBtn, delay: i * 120, size: l.fly?.size || 72 }))).then(refreshCart)
}

/* ---------- the drop grid + quick view ---------- */
const pg = $('#pg')
const cards = pieces.map((p) => {
  const d = document.createElement('button')
  d.type = 'button'
  d.className = 'pz'
  d.innerHTML = `<span class="q" aria-hidden="true">+</span><span class="arch" data-t="${p.image ? '' : 'photo'}" style="--g:${p.grad};${p.image ? `background:url(${esc(p.image)}) center/cover` : ''}"></span><span class="t p">${esc(p.title)}</span><small>${inr(p.price)}</small>`
  d.addEventListener('click', () => quickView(p, d))
  pg.appendChild(d)
  return d
})

const qvEl = document.createElement('div')
qvEl.id = 'qv'
qvEl.setAttribute('role', 'dialog'); qvEl.setAttribute('aria-modal', 'true'); qvEl.setAttribute('aria-label', 'Quick view')
document.body.appendChild(qvEl)
let qvFrom = null
function closeQuickView() { qvEl.classList.remove('on'); qvFrom?.focus(); qvFrom = null }
const ARCH = '999px 999px 10px 10px'
// one bag line for a piece in a size, with its flight description
function lineFor(p, size, fromRect, size2) {
  const v = p.variants ? variantFor(p, size) : null
  if (live && !v) return null
  return {
    id: v?.id,
    quantity: 1,
    meta: { key: `${p.title}|${size || ''}`, title: p.title, size, price: p.price, image: p.image, url: p.url },
    fly: { fromRect, image: p.image, background: p.grad, radius: ARCH, size: size2 },
  }
}
function quickView(p, from) {
  let pick = p.sizes.length === 1 ? p.sizes[0] : ''
  qvFrom = from
  qvEl.innerHTML = `<div class="qp"><button class="qx" type="button" aria-label="Close">×</button>
    <div class="arch" data-t="${p.image ? '' : 'photo'}" style="--g:${p.grad};${p.image ? `background:url(${esc(p.image)}) center/cover` : ''}"></div>
    <div><h3 class="p">${esc(p.title)}</h3><div class="pr">${inr(p.price)}</div>
    <p>From After Hours, drop 01. Arrives in its own packaging with a collectible to keep.</p>
    ${p.sizes.length ? `<div class="sz" role="group" aria-label="Size">${p.sizes.map((s) => {
      const out = p.variants && !variantFor(p, s)
      return `<button type="button" ${out ? 'disabled aria-label="' + esc(s) + ' sold out"' : ''} class="${s === pick ? 'on' : ''}">${esc(s)}</button>`
    }).join('')}</div>` : '<div class="sz"></div>'}
    <button class="atc" type="button">Add to cart</button>
    ${p.url ? `<a class="vd" href="${esc(p.url)}">View full details &rarr;</a>` : ''}</div></div>`
  qvEl.classList.add('on')
  const btns = $$('.sz button', qvEl)
  btns.forEach((b) => b.addEventListener('click', () => { pick = b.textContent; btns.forEach((x) => x.classList.toggle('on', x === b)) }))
  $('.qx', qvEl).addEventListener('click', closeQuickView)
  $('.qx', qvEl).focus()
  $('.atc', qvEl).addEventListener('click', (e) => {
    if (p.sizes.length && !pick) return toast('Choose a size first')
    const line = lineFor(p, pick, e.currentTarget.getBoundingClientRect(), 84)
    if (!line) return toast('That size is sold out')
    addToBag([line], `${p.title}${pick ? ` (${pick})` : ''}`)
    closeQuickView()
  })
}
qvEl.addEventListener('click', (e) => { if (e.target === qvEl) closeQuickView() })

$('#all').addEventListener('click', (e) => {
  // sizes aren't asked for here, so each piece goes in as M, or its single/first available option
  const rect = e.currentTarget.getBoundingClientRect()
  const lines = pieces.map((p) => {
    const size = p.sizes.includes('M') ? 'M' : p.sizes[0]
    return lineFor(p, size, rect, 60) || (live ? lineFor(p, p.variants.find((x) => x.available)?.options[p.sizeIdx], rect, 60) : null)
  }).filter(Boolean)
  addToBag(lines, 'The whole drop')
})

/* ---------- statement, marquee, world rows ---------- */
$('#mq').innerHTML = Array.from({ length: 8 }, () => 'After Hours<span>✦</span>Collect 5 Nanzo currency, get 50% off<span>✦</span>Collect 7, get a piece free<span>✦</span>').join('')
const stm = $('#stm')
stm.innerHTML = stm.textContent.split(' ').map((w) => `<b>${w}</b>`).join(' ')
const words = $$('b', stm)
;[1, 2].forEach((r) => { $('#r' + r).innerHTML = Array.from({ length: 24 }, (_, k) => `<div class="arch i${(k * (r + 1) + r) % 6}"></div>`).join('') })

/* ---------- scroll jobs ---------- */
const bar = $('#pr'), nav = $('nav'), heroEl = $('.hero')
let navSolid = null
jobs.push(() => {
  const y = scrollY
  const solid = y > heroEl.offsetHeight - 90
  return () => {
    if (solid !== navSolid) { navSolid = solid; nav.classList.toggle('solid', solid) }
    bar.style.transform = `scaleX(${clamp01(y / Math.max(1, docH - innerHeight))})`
  }
})

const stSection = $('.st')
let lastOn = -1
jobs.push(() => {
  const r = stSection.getBoundingClientRect()
  const p = clamp01((-r.top + innerHeight * 0.1) / (r.height - innerHeight * 1.1))
  const upto = Math.ceil(p / 0.9 * words.length)
  return () => {
    if (upto !== lastOn) { words.forEach((b, i) => b.classList.toggle('on', i < upto)); lastOn = upto }
  }
})

// the drop unfolds from a fanned stack as you scroll (desktop only)
const dropEl = $('#drop'), fb2 = $('#fb2')
let base = []
function layDrop() {
  cards.forEach((c) => (c.style.transform = ''))
  const g = pg.getBoundingClientRect()
  base = cards.map((c) => { const r = c.getBoundingClientRect(); return [g.left + g.width / 2 - (r.left + r.width / 2), g.top + g.height / 2 - (r.top + r.height / 2)] })
}
const flat = () => innerWidth < 760 || reduce
jobs.push(() => {
  if (flat()) return () => { cards.forEach((c) => { c.style.transform = ''; c.style.opacity = 1 }); fb2.classList.add('on') }
  const r = dropEl.getBoundingClientRect()
  const p = clamp01(-r.top / (r.height - innerHeight))
  return () => {
    cards.forEach((c, i) => {
      const t = clamp01((p - 0.08 - i * 0.03) / 0.4), e = 1 - Math.pow(1 - t, 3), b = base[i] || [0, 0]
      c.style.transform = `translate(${b[0] * (1 - e)}px,${b[1] * (1 - e)}px) rotate(${(i - 3.5) * 7 * (1 - e)}deg) scale(${0.82 + 0.18 * e})`
      c.style.zIndex = i
      c.style.opacity = Math.min(1, 0.4 + e)
    })
    fb2.classList.toggle('on', p > 0.72)
  }
})
addEventListener('resize', () => { layDrop(); measureDoc() })
addEventListener('load', () => { layDrop(); measureDoc(); requestFrame() })
layDrop(); measureDoc(); requestFrame()
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(measureDoc).observe(document.body)

/* ---------- get ready: the styling game ----------
   Pick an occasion, then pick pieces from the two wardrobes. Each one flies into your look; the match bar
   scores the look for the occasion; finish an outfit + bag to complete it. Then add the look to the bag. */
import { dollSVG, GARMENTS, SLUG, thumbURL } from './doll.js'
const scene = $('#sc'), wardrobe = $('img', scene)
const OCC = ['Birthday', 'Bachelorette', 'Vacation', 'Date night']
// [name, x1, y1, x2, y2 (px on the 1338x753 artwork), slot, match with each occasion (0..1)]
const HOT = [
  ['Sage ruffle romper', 72, 262, 215, 448, 'dress', [0.6, 0.4, 1, 0.5]],
  ['Lace camisole', 200, 262, 292, 402, 'top', [0.5, 0.5, 0.7, 0.7]],
  ['Rose tiered dress', 265, 262, 398, 497, 'dress', [1, 0.6, 0.7, 0.8]],
  ['Denim jacket', 376, 247, 455, 470, 'outer', [0.4, 0.4, 0.8, 0.5]],
  ['Quilted rose bag', 340, 500, 438, 555, 'bag', [0.8, 0.6, 0.7, 0.8]],
  ['Ivory halter', 872, 245, 968, 430, 'top', [0.7, 0.8, 0.8, 0.8]],
  ['Crimson corset dress', 950, 292, 1065, 484, 'dress', [0.8, 1, 0.3, 1]],
  ['Cherub top', 1060, 255, 1135, 350, 'top', [0.7, 0.7, 0.6, 0.7]],
  ['Cherub maxi skirt', 1037, 358, 1150, 636, 'bottom', [0.8, 0.6, 0.9, 0.8]],
  ['Sequin wrap', 1110, 262, 1275, 472, 'top', [0.9, 1, 0.4, 0.8]],
].map(([name, x1, y1, x2, y2, slot, s]) => ({ name, x1, y1, x2, y2, slot, s }))
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

/* ---------- footer: shells that react to the cursor, hiding a ticket ---------- */
{
  const ft = $('#ft'), cv = $('#fc'), cx = cv.getContext('2d'), tk = $('#tk')
  let W = 0, H = 0, dpr = 1, shells = [], mx = -999, my = -999, raf = 0, visible = false
  const TINTS = ['#f4a8bf', '#ffd9e2', '#e9c9b8', '#fff1ea']
  const sprite = (col) => {
    const o = document.createElement('canvas'); o.width = o.height = 128
    const c = o.getContext('2d'); c.scale(2, 2)
    const g = c.createRadialGradient(32, 44, 4, 32, 32, 34)
    g.addColorStop(0, '#fff'); g.addColorStop(1, col)
    c.fillStyle = g; c.strokeStyle = 'rgba(120,40,70,.45)'; c.lineWidth = 1.5
    c.beginPath(); c.moveTo(32, 56)
    for (let i = 0; i <= 7; i++) { const a = Math.PI + (i * Math.PI) / 7, b = a + Math.PI / 14; c.quadraticCurveTo(32 + Math.cos(a) * 34, 56 + Math.sin(a) * 58, 32 + Math.cos(b + Math.PI / 14) * 26, 56 + Math.sin(b + Math.PI / 14) * 44) }
    c.closePath(); c.fill(); c.stroke()
    for (let i = 1; i < 7; i++) { const a = Math.PI + (i * Math.PI) / 7; c.beginPath(); c.moveTo(32, 56); c.lineTo(32 + Math.cos(a) * 28, 56 + Math.sin(a) * 44); c.stroke() }
    c.fillStyle = 'rgba(120,40,70,.5)'; c.fillRect(27, 54, 10, 6)
    return o
  }
  const sprites = TINTS.map(sprite)

  function size() {
    W = ft.clientWidth; H = ft.clientHeight
    dpr = Math.min(2, devicePixelRatio || 1)
    cv.width = W * dpr; cv.height = H * dpr
    cx.setTransform(dpr, 0, 0, dpr, 0, 0)
    tk.style.setProperty('--tx', `${15 + Math.random() * 50}%`)
  }
  function spawn() {
    const n = Math.min(110, Math.round(W / 12))
    shells = Array.from({ length: n }, (_, i) => ({ x: Math.random() * W, y: -Math.random() * H * 1.2, vx: 0, vy: 0, r: 22 + Math.random() * 13, a: Math.random() * 6.28, va: 0, i: i % 4 }))
  }
  function step() {
    cx.clearRect(0, 0, W, H)
    for (const s of shells) {
      s.vy += 0.55
      const dx = s.x - mx, dy = s.y - my, d = Math.hypot(dx, dy)
      if (d < 130) { const f = ((130 - d) / 130) * 3.2; s.vx += (dx / (d || 1)) * f; s.vy += (dy / (d || 1)) * f - 0.4; s.va += (dx / (d || 1)) * 0.02 }
      s.vx *= 0.985; s.vy *= 0.985; s.va *= 0.95
      s.x += s.vx; s.y += s.vy; s.a += s.va
      if (s.x < s.r) { s.x = s.r; s.vx *= -0.4 }
      if (s.x > W - s.r) { s.x = W - s.r; s.vx *= -0.4 }
      if (s.y > H - s.r + 4) { s.y = H - s.r + 4; s.vy *= -0.25; s.vx *= 0.9 }
    }
    // shell-vs-shell collisions through a spatial grid (n log-ish instead of n²)
    const CELL = 64
    for (let pass = 0; pass < 2; pass++) {
      const grid = new Map()
      for (let i = 0; i < shells.length; i++) {
        const s = shells[i], key = ((s.x / CELL) | 0) + ((s.y / CELL) | 0) * 1000
        ;(grid.get(key) || grid.set(key, []).get(key)).push(i)
      }
      for (let i = 0; i < shells.length; i++) {
        const a = shells[i], cxk = (a.x / CELL) | 0, cyk = (a.y / CELL) | 0
        for (let gx = cxk - 1; gx <= cxk + 1; gx++) for (let gy = cyk - 1; gy <= cyk + 1; gy++) {
          const cell = grid.get(gx + gy * 1000)
          if (!cell) continue
          for (const j of cell) {
            if (j <= i) continue
            const b = shells[j], dx = b.x - a.x, dy = b.y - a.y, m = (a.r + b.r) * 0.82, d2 = dx * dx + dy * dy
            if (d2 < m * m && d2 > 0.01) { const d = Math.sqrt(d2), o = (m - d) / 2, nx = dx / d, ny = dy / d; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o }
          }
        }
      }
    }
    for (const s of shells) { cx.save(); cx.translate(s.x, s.y); cx.rotate(s.a); cx.drawImage(sprites[s.i], -s.r, -s.r * 1.1, s.r * 2, s.r * 2.2); cx.restore() }
    raf = visible && !document.hidden ? requestAnimationFrame(step) : 0
  }
  const wake = () => { if (visible && !document.hidden && !raf) raf = requestAnimationFrame(step) }
  let started = false
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    if (visible && !started) { started = true; size(); spawn() }
    wake()
  }, { threshold: 0.15 }).observe(ft)
  document.addEventListener('visibilitychange', wake)
  ft.addEventListener('pointermove', (e) => { const r = ft.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top })
  ft.addEventListener('pointerleave', () => { mx = my = -999 })
  addEventListener('resize', () => { if (started) { size(); spawn() } })
  tk.style.zIndex = 0; cv.style.zIndex = 1; cv.style.pointerEvents = 'none'; ft.firstElementChild.style.zIndex = 2
  tk.addEventListener('click', () => {
    const code = tk.dataset.code || ''
    try { navigator.clipboard.writeText(code) } catch { /* clipboard unavailable */ }
    toast(`${code} copied`)
  })
}

/* ---------- packaging box ---------- */
const bx = $('#bx')
bx.addEventListener('click', () => { bx.classList.toggle('open'); bx.setAttribute('aria-pressed', String(bx.classList.contains('open'))) })

/* ---------- world overlay ---------- */
const wp = $('#wp')
function openWorld(o, fromHash) {
  wp.hidden = !o
  document.body.style.overflow = o ? 'hidden' : ''
  if (o) { wp.scrollTop = 0; $('#wx').focus() }
  if (!fromHash) {
    try { history[o ? 'pushState' : 'replaceState'](null, '', o ? '#after-hours' : location.pathname + location.search) } catch { /* sandboxed */ }
  }
}
$$('[data-open]').forEach((b) => b.addEventListener('click', () => openWorld(true)))
$('#wx').addEventListener('click', () => openWorld(false))
$('#wd2').addEventListener('click', () => { openWorld(false); setTimeout(() => $('#drop').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 50) })
addEventListener('hashchange', () => openWorld(location.hash === '#after-hours', true))
if (location.hash === '#after-hours') openWorld(true, true)

/* ---------- one Escape key for every overlay ---------- */
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return
  if (qvEl.classList.contains('on')) closeQuickView()
  else if (drawer.classList.contains('on')) openDrawer(false)
  else if (!wp.hidden) openWorld(false)
})

/* ---------- marquee hint + shell-trail cursor ---------- */
if (fine && !reduce) {
  document.body.classList.add('cc')
  const cu = $('#cur'), label = cu.firstChild
  let px = innerWidth / 2, py = innerHeight / 2, tx = px, ty = py, running = false
  const trail = Array.from({ length: 7 }, (_, i) => {
    const e = document.createElement('i')
    e.className = 'tr'
    e.style.opacity = 0.85 - i * 0.11
    e.style.width = e.style.height = `${24 - i * 2.5}px`
    document.body.appendChild(e)
    return { e, x: px, y: py }
  })
  function move() {
    px += (tx - px) * 0.3; py += (ty - py) * 0.3
    cu.style.transform = `translate(${px}px,${py}px)`
    let lx = px, ly = py, settled = Math.abs(tx - px) < 0.1 && Math.abs(ty - py) < 0.1
    for (const o of trail) {
      o.x += (lx - o.x) * 0.33; o.y += (ly - o.y) * 0.33
      o.e.style.transform = `translate(${o.x}px,${o.y}px) translate(-50%,-50%) rotate(${(o.x - lx) * 4}deg)`
      if (Math.abs(lx - o.x) > 0.1 || Math.abs(ly - o.y) > 0.1) settled = false
      lx = o.x; ly = o.y
    }
    running = !settled && !document.hidden
    if (running) requestAnimationFrame(move)
  }
  addEventListener('pointermove', (ev) => {
    tx = ev.clientX; ty = ev.clientY
    const t = ev.target.closest?.('[data-cur],a,button,.hs,.pz,.sl')
    cu.className = t ? 'big' : ''
    label.textContent = (t && t.dataset.cur) || ''
    if (!running) { running = true; requestAnimationFrame(move) }
  })
}
