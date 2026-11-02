// "Fly to bag": a small copy of the product travels in an arc from the add-to-cart button to the bag
// button, which then bounces. Shared by the landing page and the normal theme pages.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

export function pulse(el) {
  el?.animate?.(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.32) rotate(-7deg)' }, { transform: 'scale(.92)' }, { transform: 'scale(1)' }],
    { duration: 560, easing: 'cubic-bezier(.3,1.5,.5,1)' }
  )
}

/**
 * @param {object} o
 * @param {Element}  [o.from]      element the flight starts from (its centre)
 * @param {DOMRect}  [o.fromRect]  or a rect snapshot (use when the element is about to disappear)
 * @param {Element}   o.to         element it lands on
 * @param {string}   [o.image]     image url for the flying thumbnail
 * @param {string}   [o.background] css background used when there is no image
 * @param {string}   [o.radius]    css border-radius of the thumbnail
 * @param {number}   [o.size]      thumbnail width in px
 * @param {number}   [o.delay]     ms before it takes off (for staggering several)
 * @returns {Promise<void>} resolves when it has landed
 */
export function flyToBag({ from, fromRect, to, image, background, radius = '16px', size = 76, delay = 0 }) {
  const a = fromRect || from?.getBoundingClientRect()
  const b = to?.getBoundingClientRect()
  if (!a || !b || !b.width) return Promise.resolve()
  if (reduce) { pulse(to); return Promise.resolve() }

  const w = size, h = size * 1.22
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  el.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;z-index:2147483000;pointer-events:none;border-radius:${radius};overflow:hidden;` +
    `box-shadow:0 16px 34px rgba(36,22,12,.38),0 0 0 3px rgba(255,250,240,.9);will-change:transform,opacity;` +
    `background:${image ? `url("${image}") center/cover no-repeat` : background || '#FCB1C5'}`
  document.body.appendChild(el)

  const sx = a.left + a.width / 2 - w / 2, sy = a.top + a.height / 2 - h / 2
  // if the bag is scrolled out of view, land on the top edge of the screen instead of flying off it
const ex = b.left + b.width / 2 - w / 2, ey = Math.max(b.top + b.height / 2, 28) - h / 2
  const mx = sx + (ex - sx) * 0.5
  const my = Math.min(sy, ey) - Math.max(110, Math.abs(ex - sx) * 0.2) // the arc's peak
  const anim = el.animate([
    { transform: `translate(${sx}px,${sy}px) scale(.5) rotate(0deg)`, opacity: 0, offset: 0 },
    { transform: `translate(${sx}px,${sy}px) scale(1.05) rotate(-5deg)`, opacity: 1, offset: 0.14 },
    { transform: `translate(${mx}px,${my}px) scale(.82) rotate(150deg)`, opacity: 1, offset: 0.58 },
    { transform: `translate(${ex}px,${ey}px) scale(.16) rotate(330deg)`, opacity: 0.9, offset: 1 },
  ], { duration: 950, delay, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'both' })

  return anim.finished.then(() => { el.remove(); pulse(to) }).catch(() => el.remove())
}
