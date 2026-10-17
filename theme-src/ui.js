import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { state, reduceMotion } from './state.js'
import { sfx } from './sound.js'

const HEARTS = ['♡', '✧', '❀', '✦', '♥']
const COLORS = ['#f4739a', '#fffaf0', '#483432']

function pointer() {
  const cur = document.querySelector('[data-cursor]')
  let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy
  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY
    state.pointer.x = tx / innerWidth - 0.5
    state.pointer.y = ty / innerHeight - 0.5
    cur?.classList.add('is-on')
  })
  document.addEventListener('pointerover', (e) => cur?.classList.toggle('is-big', !!e.target.closest?.('a, button, input, label, summary, .card')))
  if (cur && !matchMedia('(pointer: coarse)').matches) {
    gsap.ticker.add(() => {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22
      cur.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`
    })
  }
}

// little hearts + a pop wherever you click
function clickHearts() {
  addEventListener('click', (e) => {
    if (e.target.closest('[data-sound-toggle]')) return
    sfx.pop()
    if (reduceMotion) return
    for (let i = 0; i < 7; i++) {
      const el = document.createElement('span')
      el.className = 'pop'
      el.textContent = HEARTS[i % HEARTS.length]
      el.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;color:${COLORS[i % 3]}`
      document.body.appendChild(el)
      gsap.to(el, {
        x: (Math.random() - 0.5) * 170, y: -50 - Math.random() * 130, rotation: (Math.random() - 0.5) * 120, scale: 1.5, opacity: 0,
        duration: 1, ease: 'power2.out', onComplete: () => el.remove(),
      })
    }
  })
}

// 3D tilt on cards that follows the pointer
function tilt() {
  if (matchMedia('(pointer: coarse)').matches || reduceMotion) return
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.4, ease: 'power3' })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.4, ease: 'power3' })
    gsap.set(el, { transformPerspective: 900 })
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      ry(((e.clientX - r.left) / r.width - 0.5) * 14)
      rx(-((e.clientY - r.top) / r.height - 0.5) * 14)
    })
    el.addEventListener('pointerleave', () => { rx(0); ry(0) })
  })
}

// fade/slide content in as it scrolls into view
function reveal() {
  if (reduceMotion) { document.querySelectorAll('[data-reveal]').forEach((el) => (el.style.opacity = 1)); return }
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 92%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }),
  })
}

function countdown() {
  document.querySelectorAll('[data-countdown]').forEach((el) => {
    const raw = el.dataset.countdown || window.nz?.launch
    const end = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00` : raw).getTime()
    if (!end) { el.hidden = true; return }
    const p = (n) => String(n).padStart(2, '0')
    const paint = () => {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000))
      const v = { d: Math.floor(left / 86400), h: Math.floor((left % 86400) / 3600), m: Math.floor((left % 3600) / 60), s: left % 60 }
      for (const k in v) { const n = el.querySelector(`[data-cd="${k}"]`); if (n) n.textContent = p(v[k]) }
      if (!left) el.classList.add('is-done')
    }
    paint()
    setInterval(paint, 1000)
  })
}

function header() {
  const h = document.querySelector('[data-header]')
  if (!h) return
  ScrollTrigger.create({ start: 80, end: 'max', onUpdate: (s) => h.classList.toggle('is-scrolled', s.scroll() > 80) })
}

// hero: wordmark drifts with the pointer; scrolling pushes it back (Apple-style depth)
function hero() {
  const word = document.querySelector('[data-hero-word]')
  if (!word || reduceMotion) return
  // centring is done in CSS with the separate `translate` property, so GSAP's x/y never fight it
  const x = gsap.quickTo(word, 'x', { duration: 0.8, ease: 'power3' })
  const y = gsap.quickTo(word, 'y', { duration: 0.8, ease: 'power3' })
  addEventListener('pointermove', () => { x(-state.pointer.x * 36); y(-state.pointer.y * 24) })
  gsap.to('.hero__layer', {
    scale: 0.82, opacity: 0.0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  })
  gsap.to('.hero__ui', { y: -80, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '15% top', end: 'bottom top', scrub: true } })
}

export function initUI() {
  pointer()
  clickHearts()
  tilt()
  reveal()
  countdown()
  header()
  hero()
}
