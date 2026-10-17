import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { reduceMotion } from './state.js'

gsap.registerPlugin(ScrollTrigger)

// buttery Apple-style inertia scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync
export function initSmooth() {
  if (reduceMotion) return
  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  window.nzLenis = lenis

  // in-page anchors glide instead of jumping
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"], a[href^="/#"]')
    if (!a) return
    const id = a.getAttribute('href').replace(/^\//, '')
    if (id.length < 2) return
    const el = document.querySelector(id)
    if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -20, duration: 1.4 }) }
  })
}
