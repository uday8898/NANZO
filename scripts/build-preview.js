// Static demo export for Vercel: renders the theme's pages with mock data into dist/.
// This is ONLY a design preview. The real store runs on Shopify, which renders the Liquid itself.
import fs from 'node:fs'
import path from 'node:path'
import { createRenderer, PRODUCTS } from './liquid-preview.js'

const OUT = path.resolve('dist')
const ASSETS = path.resolve('theme/assets')

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true })
for (const f of fs.readdirSync(ASSETS)) fs.copyFileSync(path.join(ASSETS, f), path.join(OUT, 'assets', f))

// the preview has no Shopify cart API, so a tiny shim fakes it with localStorage
const variants = Object.fromEntries(PRODUCTS.flatMap((p) => p.variants.map((v) => [v.id, { title: p.title, url: p.url, price: p.price, variant: v.title }])))
fs.writeFileSync(path.join(OUT, 'assets', 'preview-shim.js'), `(() => {
  const V = ${JSON.stringify(variants)}
  const KEY = 'nz_demo_cart'
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }
  const save = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)) } catch {} }
  const cart = () => {
    const items = load().map((l) => { const v = V[l.id]; return { key: String(l.id), id: l.id, quantity: l.qty, product_title: v.title, title: v.title, variant_title: v.variant, url: v.url, price: v.price, line_price: v.price * l.qty, final_line_price: v.price * l.qty, image: null } })
    return { items, item_count: items.reduce((n, i) => n + i.quantity, 0), total_price: items.reduce((n, i) => n + i.line_price, 0), currency: 'INR' }
  }
  const json = (o) => Promise.resolve(new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  const realFetch = window.fetch.bind(window)
  window.fetch = (url, opts = {}) => {
    const u = String(url)
    if (u === '/cart.js') return json(cart())
    if (u === '/cart/add.js') {
      const id = +(opts.body && opts.body.get && opts.body.get('id'))
      const c = load(); const l = c.find((x) => x.id === id)
      if (l) l.qty++; else c.push({ id, qty: 1 })
      save(c); return json({ id })
    }
    if (u === '/cart/change.js') {
      const { line, quantity } = JSON.parse(opts.body); const c = load()
      if (c[line - 1]) { if (quantity <= 0) c.splice(line - 1, 1); else c[line - 1].qty = quantity }
      save(c); return json(cart())
    }
    return realFetch(url, opts)
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-checkout], a[href="/checkout"], button[name="checkout"]')) {
      e.preventDefault(); alert('Design preview: on the real store this goes to Shopify checkout ♡')
    }
  }, true)
  addEventListener('DOMContentLoaded', () => {
    const n = cart().item_count; document.querySelectorAll('[data-cart-count]').forEach((el) => (el.textContent = n))
    const b = document.createElement('div')
    b.textContent = 'design preview · mock data'
    b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:200;font:600 12px Fredoka,sans-serif;background:#483432;color:#fffaf0;padding:6px 12px;border-radius:99px;opacity:.85;pointer-events:none'
    document.body.appendChild(b)
  })
})()
`)

const { renderPage } = createRenderer({ assetUrl: (v) => `/assets/${v}` })

// only the coming-soon page is public for now (store templates live in *.store.json)
const pages = [
  ['/', 'index.html'],
  ['/password', 'password/index.html'],
  ['/404', '404.html'],
]

for (const [url, file] of pages) {
  let html = await renderPage(url)
  html = html.replace('</head>', '<script src="/assets/preview-shim.js"></script></head>')
  const dest = path.join(OUT, file)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, html)
}
console.log(`static preview: ${pages.length} pages -> ${path.relative(process.cwd(), OUT)}/`)
