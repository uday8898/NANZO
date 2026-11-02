import './landing.css'

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

/* ---------- cart (real Shopify cart) ---------- */
const cart = {
  async get() { const r = await fetch('/cart.js', { headers: { Accept: 'application/json' } }); return r.json() },
  async add(items) {
    const r = await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items }) })
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).description || 'Could not add that to your bag')
    return r.json()
  },
  async change(line, quantity) {
    const r = await fetch('/cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ line, quantity }) })
    return r.json()
  },
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const drawer = $('#cd')
function paintCart(c) {
  $('#bagn').textContent = c.item_count
  $('#cdt').textContent = inr(c.total_price / 100)
  const list = $('#cdi')
  $('#cdc').style.display = c.items.length ? '' : 'none'
  if (!c.items.length) { list.innerHTML = '<p class="em p">Your bag is empty.</p>'; return }
  list.innerHTML = c.items.map((it, i) => `
    <div class="ln">
      <div class="th" style="${it.image ? `background-image:url(${esc(it.image)})` : ''}"></div>
      <div><b>${esc(it.product_title)}</b>${it.variant_title && it.variant_title !== 'Default Title' ? `<small>${esc(it.variant_title)}</small>` : ''}
        <div class="qt"><button type="button" data-q="${i + 1}:${it.quantity - 1}" aria-label="Fewer">−</button><span>${it.quantity}</span><button type="button" data-q="${i + 1}:${it.quantity + 1}" aria-label="More">+</button></div></div>
      <b>${inr((it.final_line_price ?? it.line_price) / 100)}</b>
    </div>`).join('')
}
const refreshCart = async () => { try { paintCart(await cart.get()) } catch { /* offline / preview */ } }
function openDrawer(o) {
  drawer.classList.toggle('on', o)
  drawer.setAttribute('aria-hidden', String(!o))
  if (o) refreshCart()
}
$('#bag').addEventListener('click', () => openDrawer(true))
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

async function addToBag(items, label) {
  if (!live) return toast('Preview: add products to the "After Hours" collection to switch ordering on')
  try {
    await cart.add(items)
    earn()
    refreshCart()
    toast(`${label} added. +1 Nanzo currency`)
  } catch (err) {
    toast(err.message)
  }
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
    <button class="atc" type="button">Add to cart</button></div></div>`
  qvEl.classList.add('on')
  const btns = $$('.sz button', qvEl)
  btns.forEach((b) => b.addEventListener('click', () => { pick = b.textContent; btns.forEach((x) => x.classList.toggle('on', x === b)) }))
  $('.qx', qvEl).addEventListener('click', closeQuickView)
  $('.qx', qvEl).focus()
  $('.atc', qvEl).addEventListener('click', () => {
    if (p.sizes.length && !pick) return toast('Choose a size first')
    const v = variantFor(p, pick)
    if (live && !v) return toast('That size is sold out')
    addToBag(live ? [{ id: v.id, quantity: 1 }] : [], `${p.title}${pick ? ` (${pick})` : ''}`)
    closeQuickView()
  })
}
qvEl.addEventListener('click', (e) => { if (e.target === qvEl) closeQuickView() })

$('#all').addEventListener('click', () => {
  // sizes aren't asked for here, so each piece goes in as M, or its single/first available option
  const items = pieces.map((p) => {
    const v = variantFor(p, p.sizes.includes('M') ? 'M' : p.sizes[0]) || p.variants?.find((x) => x.available)
    return v ? { id: v.id, quantity: 1 } : null
  }).filter(Boolean)
  addToBag(items, 'The whole drop')
})

/* ---------- statement, marquee, world rows ---------- */
$('#mq').innerHTML = Array.from({ length: 8 }, () => 'After Hours<span>✦</span>Collect 5 Nanzo currency, get 50% off<span>✦</span>Collect 7, get a piece free<span>✦</span>').join('')
const stm = $('#stm')
stm.innerHTML = stm.textContent.split(' ').map((w) => `<b>${w}</b>`).join(' ')
const words = $$('b', stm)
;[1, 2].forEach((r) => { $('#r' + r).innerHTML = Array.from({ length: 24 }, (_, k) => `<div class="arch i${(k * (r + 1) + r) % 6}"></div>`).join('') })

/* ---------- scroll jobs ---------- */
const bar = $('#pr')
jobs.push(() => {
  const y = scrollY
  return () => { bar.style.transform = `scaleX(${clamp01(y / Math.max(1, docH - innerHeight))})` }
})

const stSection = $('.st'), arch1 = $('.a1'), arch2 = $('.a2')
let lastOn = -1
jobs.push(() => {
  const r = stSection.getBoundingClientRect()
  const p = clamp01((-r.top + innerHeight * 0.1) / (r.height - innerHeight * 1.1))
  const y = scrollY * 0.12
  const upto = Math.ceil(p / 0.9 * words.length)
  return () => {
    if (upto !== lastOn) { words.forEach((b, i) => b.classList.toggle('on', i < upto)); lastOn = upto }
    arch1.style.transform = `translateY(${-y}px)`
    arch2.style.transform = `translateY(${-y * 1.6}px)`
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

/* ---------- get ready: the playful wardrobe ---------- */
const scene = $('#sc'), wardrobe = $('img', scene)
const HOT = [['Sage ruffle romper', 72, 262, 215, 448], ['Lace camisole', 200, 262, 292, 402], ['Rose tiered dress', 265, 262, 398, 497], ['Denim jacket', 376, 247, 455, 470], ['Ivory mary janes', 95, 483, 172, 556], ['Sage block heels', 176, 488, 268, 553], ['Quilted rose bag', 340, 500, 438, 555], ['Ivory halter', 872, 245, 968, 430], ['Crimson corset dress', 950, 292, 1065, 484], ['Cherub top', 1060, 255, 1135, 350], ['Cherub maxi skirt', 1037, 358, 1150, 636], ['Sequin wrap', 1110, 262, 1275, 472], ['Crimson heels', 1150, 520, 1250, 583]]
let chosen = null
const lookCtx = $('#lc').getContext('2d')
HOT.forEach(([name, x1, y1, x2, y2]) => {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'hs'
  b.style.cssText = `left:${x1 / 13.38}%;top:${y1 / 7.53}%;width:${(x2 - x1) / 13.38}%;height:${(y2 - y1) / 7.53}%`
  b.setAttribute('aria-label', name)
  b.innerHTML = `<span class="p">${name}</span>`
  b.addEventListener('click', () => {
    $$('.hs.on').forEach((x) => x.classList.remove('on'))
    b.classList.add('on')
    chosen = name
    const w = x2 - x1, h = y2 - y1, s = Math.min(84 / w, 84 / h)
    lookCtx.fillStyle = '#fff'; lookCtx.fillRect(0, 0, 96, 96)
    lookCtx.imageSmoothingEnabled = false
    try { lookCtx.drawImage(wardrobe, x1, y1, w, h, 48 - (w * s) / 2, 48 - (h * s) / 2, w * s, h * s) } catch { /* image not ready yet */ }
    $('#ln2').textContent = name
    const bub = $('#bub')
    bub.textContent = `Ooh. The ${name.toLowerCase()}.`
    bub.classList.add('on')
    clearTimeout(bub.t); bub.t = setTimeout(() => bub.classList.remove('on'), 2400)
    if (!reduce) for (let i = 0; i < 8; i++) {
      const sp = document.createElement('span')
      sp.className = 'sp'; sp.textContent = '✦'
      const a = Math.random() * 6.28, d = 40 + Math.random() * 60
      sp.style.cssText = `--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;margin-left:${Math.random() * 40 - 20}px`
      scene.appendChild(sp)
      setTimeout(() => sp.remove(), 1200)
    }
  })
  scene.appendChild(b)
})
$('#atc').addEventListener('click', () => {
  if (!chosen) return toast('Pick a piece from the wardrobes first')
  // match the clicked outfit to a real product by name when possible
  const hit = pieces.find((p) => p.variants && chosen.toLowerCase().includes(p.title.toLowerCase()))
  if (hit) { const v = variantFor(hit, hit.sizes.includes('M') ? 'M' : hit.sizes[0]); if (v) return addToBag([{ id: v.id, quantity: 1 }], hit.title) }
  toast(`${chosen} is in the drop. Pick it from After Hours above.`)
  dropEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
})

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
