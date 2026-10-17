import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { sfx } from './sound.js'
import { reduceMotion } from './state.js'

// Pinned scroll-story: text steps cross-fade while the 3D shell (scene.js) choreographs itself
// against the same section's scroll progress.
function story() {
  const root = document.querySelector('[data-story]')
  if (!root) return
  const steps = [...root.querySelectorAll('[data-step]')]
  const dots = [...root.querySelectorAll('[data-dot]')]
  const n = steps.length
  if (!n) return

  steps.forEach((s, i) => gsap.set(s, { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : 60 }))
  dots[0]?.classList.add('is-on')
  let current = 0

  ScrollTrigger.create({
    trigger: root, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => {
      const idx = Math.min(n - 1, Math.floor(self.progress * n * 0.999))
      if (idx === current) return
      const dir = idx > current ? 1 : -1
      gsap.to(steps[current], { autoAlpha: 0, y: -60 * dir, duration: 0.5, ease: 'power2.in', overwrite: true })
      gsap.fromTo(steps[idx], { autoAlpha: 0, y: 60 * dir }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.15, overwrite: true })
      dots.forEach((d, i) => d.classList.toggle('is-on', i === idx))
      current = idx
      sfx.twinkle()
    },
  })
}

// Lookbook: vertical scroll drives a pinned horizontal gallery (desktop only)
function gallery() {
  const root = document.querySelector('[data-gallery]')
  const track = root?.querySelector('[data-gallery-track]')
  if (!root || !track || reduceMotion) return
  gsap.matchMedia().add('(min-width: 900px)', () => {
    const dist = () => Math.max(0, track.scrollWidth - innerWidth + 120)
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true },
    })
    gsap.utils.toArray('.look').forEach((el, i) => {
      gsap.fromTo(el, { rotation: i % 2 ? 4 : -4, y: i % 2 ? 40 : -20 }, {
        rotation: i % 2 ? -2 : 2, y: 0, ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: () => `+=${dist()}`, scrub: 1 },
      })
    })
  })
}

export function initScroll() {
  story()
  gallery()
}
