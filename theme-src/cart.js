import { sfx } from './sound.js'

const FREE_SHIP = 199900 // paise: free-shipping threshold shown in the drawer progress bar

let drawer
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

const fmt = (cents, currency) =>
  new Intl.NumberFormat(window.nz?.locale === 'en' ? 'en-IN' : window.nz?.locale || 'en-IN', { style: 'currency', currency: currency || window.nz?.currency || 'INR', maximumFractionDigits: 0 }).format(cents / 100)

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

async function getCart() {
  const r = await fetch('/cart.js', { headers: { Accept: 'application/json' } })
  return r.json()
}

function render(cart) {
  $$('[data-cart-count]').forEach((n) => (n.textContent = cart.item_count))
  $$('[data-cart-total]').forEach((n) => (n.textContent = fmt(cart.total_price, cart.currency)))

  const left = Math.max(0, FREE_SHIP - cart.total_price)
  const bar = $('[data-ship-bar]')
  if (bar) bar.style.width = `${Math.min(100, (cart.total_price / FREE_SHIP) * 100)}%`
  const txt = $('[data-ship-text]')
  if (txt) txt.textContent = cart.item_count === 0 ? '' : left ? `you're ${fmt(left, cart.currency)} away from free shipping ♡` : 'free shipping unlocked ♡'

  const list = $('[data-cart-items]')
  if (!list) return
  if (!cart.items.length) {
    list.innerHTML = `<div class="empty empty--sm"><i class="lg" style="--src:url(${window.nz?.shell})"></i><p>your bag is feeling empty ♡</p></div>`
    return
  }
  list.innerHTML = cart.items.map((it, i) => `
    <div class="dline">
      <a class="dline__img" href="${esc(it.url)}">${it.image ? `<img src="${esc(it.image)}" alt="" width="80" height="100" loading="lazy">` : `<span class="lg" style="--src:url(${window.nz?.shell})"></span>`}</a>
      <div class="dline__info">
        <a href="${esc(it.url)}"><b>${esc(it.product_title)}</b></a>
        ${it.variant_title ? `<span class="muted">${esc(it.variant_title)}</span>` : ''}
        <div class="qty">
          <button type="button" data-line="${i + 1}" data-qty="${it.quantity - 1}" aria-label="Decrease">−</button>
          <span>${it.quantity}</span>
          <button type="button" data-line="${i + 1}" data-qty="${it.quantity + 1}" aria-label="Increase">+</button>
        </div>
      </div>
      <b>${fmt(it.final_line_price ?? it.line_price, cart.currency)}</b>
    </div>`).join('')
}

function open() { drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); document.documentElement.classList.add('no-scroll'); window.nzLenis?.stop() }
function close() { drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); document.documentElement.classList.remove('no-scroll'); window.nzLenis?.start() }

export function initCart() {
  drawer = $('[data-cart-drawer]')
  if (!drawer) return

  document.addEventListener('click', async (e) => {
    if (e.target.closest('[data-cart-open]')) { e.preventDefault(); render(await getCart()); open(); return }
    if (e.target.closest('[data-cart-close]')) { close(); return }
    const q = e.target.closest('[data-qty]')
    if (q) {
      const r = await fetch('/cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ line: +q.dataset.line, quantity: +q.dataset.qty }) })
      render(await r.json())
    }
  })
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })

  // every add-to-bag form (cards, product page) goes through here, no page reload
  document.addEventListener('submit', async (e) => {
    const f = e.target.closest?.('form[data-add-to-cart]')
    if (!f) return
    e.preventDefault()
    const btn = f.querySelector('button[type="submit"]')
    const errBox = f.querySelector('[data-atc-error]')
    const label = btn?.textContent
    if (btn) { btn.disabled = true; btn.textContent = 'adding…' }
    if (errBox) errBox.textContent = ''
    try {
      const res = await fetch('/cart/add.js', { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error((await res.json()).description || 'Could not add that one')
      sfx.cart()
      render(await getCart())
      open()
    } catch (err) {
      if (errBox) errBox.textContent = err.message
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = label }
    }
  })
}
