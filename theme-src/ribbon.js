// Text riding along a wavy ribbon: every letter (and shell icon) is its own element positioned
// along the same SVG path with CSS offset-path, and slid along it each frame.
export async function initRibbon() {
  const root = document.querySelector('[data-ribbon]')
  if (!root) return
  const stage = root.querySelector('[data-ribbon-stage]')
  const pathEl = root.querySelector('[data-ribbon-path]')
  const d = pathEl.getAttribute('d')
  const len = pathEl.getTotalLength()

  try { await document.fonts.load('500 38px Jost') } catch { /* fall back to system font */ }

  const ctx = document.createElement('canvas').getContext('2d')
  ctx.font = '500 38px Jost, Fredoka, sans-serif'
  const SHELL_W = 44, GAP = 34
  const words = [root.dataset.text, root.dataset.brand].filter(Boolean)
  const unit = []
  words.forEach((w) => {
    ;[...w].forEach((ch) => unit.push({ ch, w: ctx.measureText(ch).width + 0.5 }))
    unit.push({ shell: true, w: SHELL_W })
  })
  // lay the letters + shells out in a row, with a little air around each shell
  let x = 0
  const unitItems = unit.map((it) => {
    if (it.shell) x += GAP
    const o = { ...it, x }
    x += it.w + (it.shell ? GAP : 0)
    return o
  })
  const unitW = x
  const copies = Math.ceil((len + 300) / unitW) + 1
  const total = unitW * copies

  const nodes = []
  for (let c = 0; c < copies; c++) {
    unitItems.forEach((it) => {
      const el = document.createElement(it.shell ? 'i' : 'span')
      el.className = 'ribbon__item' + (it.shell ? ' ribbon__shell' : '')
      el.style.offsetPath = `path('${d}')`
      if (it.shell) el.style.setProperty('--src', `url(${root.dataset.shell})`)
      else el.textContent = it.ch
      stage.appendChild(el)
      nodes.push({ el, off: c * unitW + it.x, w: it.w })
    })
  }

  const fit = () => {
    const s = root.clientWidth / 1920
    root.style.setProperty('--s', s)
  }
  fit()
  addEventListener('resize', fit)

  let t = 0, last = performance.now(), visible = true, raf
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { last = performance.now(); loop() } }).observe(root)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const place = () => {
    nodes.forEach((n) => {
      const dist = (((n.off - t) % total) + total) % total - 200
      const on = dist > -60 && dist < len + 20
      n.el.style.visibility = on ? 'visible' : 'hidden'
      if (on) n.el.style.offsetDistance = `${dist}px`
    })
  }
  function loop() {
    cancelAnimationFrame(raf)
    if (!visible) return
    const now = performance.now()
    t += ((now - last) / 1000) * (reduce ? 0 : 70)
    last = now
    place()
    raf = requestAnimationFrame(loop)
  }
  place()
  loop()
}
