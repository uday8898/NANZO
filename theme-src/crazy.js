import { reduceMotion } from './state.js'

/* The "crazy chic" layer for the store pages (collection + product): pointer-driven 3D tilt with glare,
   3D letter-flip titles, magnetic buttons, floating glossy pearls with scroll/pointer depth, a sparkle
   trail and 3D scroll entrances. Everything is progressive: no JS (or reduced motion) = a clean, flat page. */

const fine = matchMedia('(hover:hover) and (pointer:fine)').matches
const lerp = (a, b, t) => a + (b - a) * t

/* generic "tilt toward the pointer" with a moving glare. Sets CSS vars; the CSS owns the transform. */
export function tiltEl(el, { max = 12, scale = 1.025, glare = true, host = el } = {}) {
  let g
  if (glare) { g = document.createElement('i'); g.className = 'glare'; g.setAttribute('aria-hidden', 'true'); host.appendChild(g) }
  let tx = 0, ty = 0, cx = 0, cy = 0, on = false, raf = 0, gx = 50, gy = 50
  const paint = () => {
    cx = lerp(cx, tx, 0.14); cy = lerp(cy, ty, 0.14)
    el.style.setProperty('--tx', cx.toFixed(3)); el.style.setProperty('--ty', cy.toFixed(3))
    el.style.setProperty('--rx', (-cy * max).toFixed(2) + 'deg'); el.style.setProperty('--ry', (cx * max).toFixed(2) + 'deg')
    el.style.setProperty('--gx', gx.toFixed(1) + '%'); el.style.setProperty('--gy', gy.toFixed(1) + '%')
    if (on || Math.abs(cx - tx) > 0.002 || Math.abs(cy - ty) > 0.002) raf = requestAnimationFrame(paint)
    else raf = 0
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(paint) }
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
    tx = (px - 0.5) * 2; ty = (py - 0.5) * 2; gx = px * 100; gy = py * 100
    el.style.setProperty('--sc', scale); el.classList.add('is-tilting'); on = true; kick()
  })
  el.addEventListener('pointerleave', () => { tx = ty = 0; on = false; el.style.setProperty('--sc', 1); el.classList.remove('is-tilting'); kick() })
}

function tilts() {
  document.querySelectorAll('.card__media').forEach((m) => tiltEl(m, { max: 11, scale: 1.03 }))
  // product gallery: wrap the scroller so we can tilt it and lay a glare over it
  const stage = document.querySelector('.pdp__stage')
  if (stage && !stage.parentElement.classList.contains('pdp__tiltwrap')) {
    const wrap = document.createElement('div')
    wrap.className = 'pdp__tiltwrap'
    stage.parentNode.insertBefore(wrap, stage)
    wrap.appendChild(stage)
    tiltEl(wrap, { max: 9, scale: 1.02 })
  }
}

/* titles: every letter flips up in 3D, and lifts when you hover it */
export function splitTitles(sel = '.pdp__title, .coll__title, .pdp__tagline, .coll__tag', lazy = false) {
  const io = lazy ? new IntersectionObserver((l) => l.forEach((e) => { if (e.isIntersecting) { e.target.classList.replace('split-wait', 'is-split'); io.unobserve(e.target) } }), { threshold: 0.35 }) : null
  document.querySelectorAll(sel).forEach((el) => {
    if (el.dataset.split) return
    el.dataset.split = '1'
    const text = el.textContent.trim()
    el.setAttribute('aria-label', text)
    let i = 0
    el.innerHTML = text.split(/\s+/).map((w) => `<span class="nzw" aria-hidden="true">${[...w].map((c) => `<span class="nzc" style="--i:${i++}">${c}</span>`).join('')}</span>`).join(' ')
    if (io) { el.classList.add('split-wait'); io.observe(el) } else el.classList.add('is-split')
  })
}

/* buttons lean toward the pointer */
export function magnetic(sel = '.btn-brown, .btn-pink, .chip, .pager__a, .bagbtn') {
  document.querySelectorAll(sel).forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect()
      b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px')
      b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px')
    })
    b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px') })
  })
}

/* glossy pearls drifting at different depths behind the page */
export function pearls(front = false) {
  const layer = document.createElement('div')
  layer.className = front ? 'pearls pearls--front' : 'pearls'
  layer.setAttribute('aria-hidden', 'true')
  const defs = [ // x%, y%, size px, depth, tone
    [6, 14, 74, 0.9, 'pink'], [90, 10, 120, 0.5, 'mint'], [93, 52, 56, 1.1, 'gold'], [3, 58, 130, 0.45, 'pink'],
    [47, 6, 38, 1.3, 'gold'], [80, 82, 90, 0.7, 'pink'], [12, 88, 52, 1.2, 'mint'], [60, 94, 34, 1.4, 'pink'],
    [30, 40, 26, 1.5, 'gold'], [70, 30, 30, 1.45, 'mint'],
  ]
  const items = defs.map(([x, y, s, d, tone]) => {
    const o = document.createElement('i')
    o.className = `pearl pearl--${tone}`
    o.style.cssText = `left:${x}%;top:${y}%;width:${s}px;height:${s}px;--bob:${(5 + Math.random() * 5).toFixed(1)}s;--del:${(-Math.random() * 6).toFixed(1)}s`
    o.innerHTML = '<b></b>'
    layer.appendChild(o)
    return { o, d }
  })
  // a few sparkles too
  for (let k = 0; k < 7; k++) {
    const s = document.createElement('span')
    s.className = 'twink'
    s.textContent = k % 2 ? '✦' : '✧'
    s.style.cssText = `left:${8 + Math.random() * 84}%;top:${6 + Math.random() * 88}%;font-size:${14 + Math.random() * 22}px;--del:${(-Math.random() * 4).toFixed(1)}s`
    layer.appendChild(s)
  }
  document.body.prepend(layer)
  let px = 0, py = 0, tx = 0, ty = 0, sy = 0, csy = 0
  addEventListener('pointermove', (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5 }, { passive: true })
  addEventListener('scroll', () => { sy = scrollY }, { passive: true })
  const tick = () => {
    px = lerp(px, tx, 0.06); py = lerp(py, ty, 0.06); csy = lerp(csy, sy, 0.08)
    for (const { o, d } of items) o.style.transform = `translate3d(${(-px * 90 * d).toFixed(1)}px,${(-py * 70 * d + Math.sin(csy / 650 + d * 2.1) * 90 * d).toFixed(1)}px,0)`
    requestAnimationFrame(tick)
  }
  tick()
}

/* sparkle trail behind the pointer */
export function trail() {
  if (!fine) return
  let last = 0
  addEventListener('pointermove', (e) => {
    const now = performance.now()
    if (now - last < 55) return
    last = now
    const s = document.createElement('span')
    s.className = 'nzs'
    s.textContent = ['✦', '✧', '♡', '·'][(Math.random() * 4) | 0]
    s.style.cssText = `left:${e.clientX + (Math.random() - 0.5) * 14}px;top:${e.clientY + (Math.random() - 0.5) * 14}px;--dx:${((Math.random() - 0.5) * 40).toFixed(0)}px;--s:${(0.7 + Math.random() * 0.9).toFixed(2)}`
    document.body.appendChild(s)
    s.addEventListener('animationend', () => s.remove(), { once: true })
  }, { passive: true })
}

/* things swing up out of the page in 3D as you scroll to them */
function entrances() {
  const sel = '.pdp__info > *, .coll__bar, .coll__types, .pager, .ribbon'
  const els = [...document.querySelectorAll(sel)]
  if (!els.length) return
  els.forEach((el) => el.classList.add('r3d'))
  const io = new IntersectionObserver((list) => list.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('r3d-in'); io.unobserve(en.target) }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })
  els.forEach((el, i) => { el.style.setProperty('--d', Math.min(i, 6) * 0.06 + 's'); io.observe(el) })
}

/* the product gallery thumbnails & cards get a scroll-linked 3D "page turn" */
function cardsDepth() {
  const cards = [...document.querySelectorAll('.coll__grid .card')]
  if (!cards.length) return
  const io = new IntersectionObserver((list) => list.forEach((en) => en.target.classList.toggle('c3d-in', en.isIntersecting || en.boundingClientRect.top < 0)), { threshold: 0.12 })
  cards.forEach((c, i) => { c.classList.add('c3d'); c.style.setProperty('--ci', i % 4); io.observe(c) })
}

export function initCrazy() {
  const w404 = document.querySelector('[data-ow-404]')
  if (w404 && /\/pages\/our-world\/?$/.test(location.pathname)) {
    w404.hidden = false
    document.querySelector('.sheet.page-top')?.setAttribute('hidden', '')
    document.title = 'Our world'
  }
  if (!document.body.classList.contains('theme-store')) return
  if (reduceMotion) return
  splitTitles()
  entrances()
  cardsDepth()
  if (fine) { tilts(); magnetic(); trail() }
  pearls()
  ourWorld()
}

/* ---------- home page sections ---------- */
function onView(el, cb, threshold = 0.25) {
  if (!el) return
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { cb(); io.disconnect() } }, { threshold })
  io.observe(el)
}
function homeSections() {
  // 2. quote: words light up one by one, then the little deck of pieces fans out
  const q = document.getElementById('qtq'), qt = document.querySelector('.qt')
  if (q && qt) {
    const words = q.textContent.trim().split(/\s+/)
    q.setAttribute('aria-label', words.join(' '))
    q.innerHTML = words.map((w) => `<span class="qw" aria-hidden="true">${w}</span>`).join(' ')
    const spans = [...q.querySelectorAll('.qw')]
    onView(qt, () => {
      qt.classList.add('is-in')
      spans.forEach((sp, i) => setTimeout(() => sp.classList.add('on'), 220 + i * 160))
    }, 0.3)
    const imgs = (() => { try { return JSON.parse(document.getElementById('nzl-products')?.textContent || '[]').map((p) => p.image).filter(Boolean) } catch { return [] } })()
    qt.querySelectorAll('.qt__c').forEach((c, i) => { if (imgs[i]) c.style.background = `url(${imgs[i]}) center/cover` })
  }
  // 3. After Hours: every piece starts as a shell and turns into its block
  const pg = document.getElementById('pg')
  if (pg) {
    const cells = [...pg.querySelectorAll('.pz')]
    cells.forEach((c, i) => { c.classList.add('js-shell'); c.style.setProperty('--dl', (i * 0.1).toFixed(2) + 's'); const sh = document.createElement('i'); sh.className = 'shl'; sh.setAttribute('aria-hidden', 'true'); c.prepend(sh) })
    onView(pg, () => requestAnimationFrame(() => cells.forEach((c) => c.classList.add('is-block'))), 0.2)
  }
  // 8. USP: the three blocks build up
  const pl = document.querySelector('.pl')
  if (pl) { pl.classList.add('js-usp'); onView(pl, () => pl.classList.add('is-in'), 0.3) }
  // founder portrait + review cards tilt
  if (fine) {
    document.querySelectorAll('.ab .arch').forEach((a) => tiltEl(a, { max: 8, scale: 1.02, glare: false }))
    document.querySelectorAll('.say__c').forEach((c) => tiltEl(c, { max: 7, scale: 1.02, glare: false }))
  }
}

/* ---------- Our world page: fixed title, two columns drifting at different speeds ---------- */
function ourWorld() {
  const ow = document.querySelector('[data-ow]')
  if (!ow) return
  const cols = [...ow.querySelectorAll('.ow__col')], grid = ow.querySelector('.ow__grid')
  const tiles = [...ow.querySelectorAll('.ow__t, .ow__txt, .ow__end > *')]
  tiles.forEach((t) => t.classList.add('reveal-up'))
  const io = new IntersectionObserver((l) => l.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: 0.12 })
  tiles.forEach((t) => io.observe(t))
  if (fine) ow.querySelectorAll('.ow__t').forEach((t) => tiltEl(t, { max: 5, scale: 1.015, glare: false }))
  const k = [-140, 200]
  let cur = 0.5
  const tick = () => {
    const r = grid.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight - r.top) / (r.height + innerHeight)))
    cur = lerp(cur, p, 0.1)
    cols.forEach((c, i) => { c.style.transform = `translate3d(0,${((cur - 0.5) * (k[i] || 0)).toFixed(1)}px,0)` })
    requestAnimationFrame(tick)
  }
  tick()
}

/* the landing page gets the same layer (its own palette, its own sections) */
export function initLandingCrazy() {
  if (reduceMotion) return
  splitTitles('.dh2 h2, .ht h2, .pl > h2, .ch h2, .cu h2, .pk h2, .gr > h2', true)
  if (fine) {
    document.querySelectorAll('#pg .pz').forEach((c) => tiltEl(c, { max: 12, scale: 1.04, host: c.querySelector('.arch') }))
    magnetic('.hero-cta, .atc, .gb, .all-link, .bagl')
    trail()
  }
  pearls(true)
  homeSections()
  // hero cards + shell follow the pointer
  const hero = document.querySelector('.hero'), rig = document.querySelector('.h3d__rig')
  if (hero && rig && fine) hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect()
    rig.style.setProperty('--hx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    rig.style.setProperty('--hy', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  })
}
