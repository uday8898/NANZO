import { sfx } from './sound.js'

const money = (c) => '₹' + Math.floor(c / 100).toLocaleString('en-IN', { useGrouping: false })

// Product page behaviour: gallery, variants (colour + shell-shaped sizes), occasion matcher,
// pincode check, sticky buy bar, size-chart modal.
export function initProduct() {
  const root = document.querySelector('[data-product]')
  const json = root?.querySelector('[data-product-json]')
  if (!root || !json) return
  const product = JSON.parse(json.textContent)
  const variants = product.variants.map((v) => ({ ...v, opts: v.options?.length ? v.options : [v.option1, v.option2, v.option3].filter(Boolean) }))

  const form = root.querySelector('#pdp-form')
  const idInput = root.querySelector('[data-variant-id]')
  const atcButtons = root.querySelectorAll('[data-atc]')
  const buyNow = root.querySelector('[data-buy-now]')
  const errBox = root.querySelector('[data-atc-error]')

  /* ---------- gallery ---------- */
  const stage = root.querySelector('[data-stage]')
  const thumbs = [...root.querySelectorAll('[data-thumb]')]
  const slides = [...root.querySelectorAll('[data-slide]')]
  const mark = (i) => thumbs.forEach((t, k) => t.classList.toggle('is-active', k === i))
  const goTo = (i) => stage && stage.scrollTo({ left: i * stage.clientWidth, behavior: 'smooth' })
  thumbs.forEach((t, i) => t.addEventListener('click', () => goTo(i)))
  let raf
  stage?.addEventListener('scroll', () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => mark(Math.round(stage.scrollLeft / stage.clientWidth)))
  }, { passive: true })
  const showMedia = (id) => {
    const i = slides.findIndex((s) => s.dataset.slide === String(id))
    if (i > -1) { goTo(i); mark(i) }
  }

  /* ---------- variants ---------- */
  const radios = [...root.querySelectorAll('input[data-option-index]')]
  const chosen = () => {
    const out = []
    radios.filter((r) => r.checked).forEach((r) => (out[+r.dataset.optionIndex] = r.value))
    return out
  }
  const match = (sel) => variants.find((v) => sel.every((val, i) => val === undefined || v.opts[i] === val))

  // grey out sizes that don't exist (or are sold out) in the chosen colour
  const refreshAvailability = () => {
    const sel = chosen()
    radios.forEach((r) => {
      const idx = +r.dataset.optionIndex
      if (r.dataset.kind !== 'size') return
      const test = sel.slice(); test[idx] = r.value
      const v = match(test)
      const out = !v || !v.available
      r.closest('.size')?.classList.toggle('is-out', out)
      r.disabled = out && !r.checked
    })
    // if the checked size just became unavailable, move to the first one that works
    const checkedSize = radios.find((r) => r.dataset.kind === 'size' && r.checked)
    if (checkedSize && checkedSize.closest('.size')?.classList.contains('is-out')) {
      const alt = radios.find((r) => r.dataset.kind === 'size' && !r.disabled && !r.closest('.size').classList.contains('is-out'))
      if (alt) { alt.checked = true; return refreshAvailability() }
    }
  }

  const bar = {
    price: root.querySelector('[data-bar-price]'),
    was: root.querySelector('[data-bar-was]'),
    off: root.querySelector('[data-bar-off]'),
  }
  const apply = () => {
    const v = match(chosen())
    if (!v) { atcButtons.forEach((b) => { b.disabled = true; b.textContent = 'Unavailable' }); if (buyNow) buyNow.disabled = true; return }
    idInput.value = v.id
    atcButtons.forEach((b) => { b.disabled = !v.available; b.textContent = v.available ? 'Add to cart' : 'Sold out' })
    if (buyNow) buyNow.disabled = !v.available
    if (bar.price) bar.price.textContent = money(v.price)
    const on = v.compare_at_price > v.price
    if (bar.was) { bar.was.hidden = !on; bar.was.textContent = on ? money(v.compare_at_price) : '' }
    if (bar.off) { bar.off.hidden = !on; bar.off.textContent = on ? `${Math.floor(((v.compare_at_price - v.price) * 100) / v.compare_at_price)}% off` : '' }
    try {
      const u = new URL(location.href)
      u.searchParams.set('variant', v.id)
      history.replaceState(null, '', u)
    } catch { /* sandboxed */ }
    return v
  }
  root.addEventListener('change', (e) => {
    if (!e.target.matches('input[data-option-index]')) return
    refreshAvailability()
    const v = apply()
    if (e.target.dataset.kind === 'colour' && v?.featured_media?.id) showMedia(v.featured_media.id)
    sfx.hover()
  })
  refreshAvailability()
  apply()

  /* ---------- occasion matcher ---------- */
  const occ = root.querySelector('[data-occ]')
  if (occ) {
    const copy = occ.querySelector('[data-occ-copy]')
    const matchEl = occ.querySelector('[data-occ-match]')
    const fill = occ.querySelector('[data-occ-fill]')
    occ.querySelectorAll('.occ__pill').forEach((p) => p.addEventListener('click', () => {
      occ.querySelectorAll('.occ__pill').forEach((x) => { x.classList.toggle('is-active', x === p); x.setAttribute('aria-pressed', String(x === p)) })
      copy.textContent = p.dataset.copy
      matchEl.textContent = `${p.dataset.match}%`
      fill.style.width = `${p.dataset.match}%`
    }))
  }

  /* ---------- pincode check ---------- */
  const pin = root.querySelector('[data-pin-form]')
  if (pin) {
    const input = pin.querySelector('input')
    const msg = pin.querySelector('[data-pin-msg]')
    const say = (text, kind) => { msg.textContent = text; msg.className = `pin__msg ${kind || ''}` }
    pin.addEventListener('submit', async (e) => {
      e.preventDefault()
      const code = input.value.trim()
      if (!/^[1-9]\d{5}$/.test(code)) return say('Please enter a valid 6-digit pincode.', 'is-err')
      say('Checking…')
      try {
        const api = window.nz?.pincodeApi
        if (api) {
          const r = await fetch(`${api}${api.includes('?') ? '&' : '?'}pin=${code}`)
          const d = await r.json()
          return say(d.message || (d.ok ? 'We deliver here ♡' : "Sorry, we don't deliver here yet."), d.ok ? 'is-ok' : 'is-err')
        }
        say(window.nz?.deliveryText || 'We deliver here ♡', 'is-ok')
      } catch {
        say("Couldn't check right now, please try again.", 'is-err')
      }
    })
  }

  /* ---------- buy now: add, then straight to checkout ---------- */
  buyNow?.addEventListener('click', async () => {
    buyNow.disabled = true
    errBox && (errBox.textContent = '')
    try {
      const res = await fetch('/cart/add.js', { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error((await res.json()).description || 'Could not add that one')
      sfx.cart()
      window.location.href = '/checkout'
    } catch (err) {
      errBox && (errBox.textContent = err.message)
      buyNow.disabled = false
    }
  })

  /* ---------- size chart modal ---------- */
  const modal = root.querySelector('[data-size-modal]')
  root.querySelector('[data-size-chart]')?.addEventListener('click', () => modal?.showModal())
  modal?.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-modal-close]')) modal.close() })
}
