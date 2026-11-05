import { reduceMotion } from './state.js'

/* The "crazy chic" layer for the store pages (collection + product): pointer-driven 3D tilt with glare,
   3D letter-flip titles, magnetic buttons, floating glossy pearls with scroll/pointer depth, a sparkle
   trail and 3D scroll entrances. Everything is progressive: no JS (or reduced motion) = a clean, flat page. */

const fine = matchMedia('(hover:hover) and (pointer:fine)').matches
const lerp = (a, b, t) => a + (b - a) * t

/* generic "tilt toward the pointer" with a moving glare. Sets CSS vars; the CSS owns the transform. */
function tiltEl(el, { max = 12, scale = 1.025, glare = true, host = el } = {}) {
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
function splitTitles() {
  document.querySelectorAll('.pdp__title, .coll__title, .pdp__tagline, .coll__tag').forEach((el) => {
    if (el.dataset.split) return
    el.dataset.split = '1'
    const text = el.textContent.trim()
    el.setAttribute('aria-label', text)
    let i = 0
    el.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true">${[...w].map((c) => `<span class="ch" style="--i:${i++}">${c}</span>`).join('')}</span>`).join(' ')
    el.classList.add('is-split')
  })
}

/* buttons lean toward the pointer */
function magnetic() {
  document.querySelectorAll('.btn-brown, .btn-pink, .chip, .pager__a, .bagbtn').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect()
      b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px')
      b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px')
    })
    b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px') })
  })
}

/* glossy pearls drifting at different depths behind the page */
function pearls() {
  const layer = document.createElement('div')
  layer.className = 'pearls'
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
    for (const { o, d } of items) o.style.transform = `translate3d(${(-px * 90 * d).toFixed(1)}px,${(-py * 70 * d - csy * 0.12 * d).toFixed(1)}px,0)`
    requestAnimationFrame(tick)
  }
  tick()
}

/* sparkle trail behind the pointer */
function trail() {
  if (!fine) return
  let last = 0
  addEventListener('pointermove', (e) => {
    const now = performance.now()
    if (now - last < 55) return
    last = now
    const s = document.createElement('span')
    s.className = 'spark'
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
  if (!document.body.classList.contains('theme-store')) return
  if (reduceMotion) return
  splitTitles()
  entrances()
  cardsDepth()
  if (fine) { tilts(); magnetic(); trail() }
  pearls()
}
