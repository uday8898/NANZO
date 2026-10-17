// Dev-only: renders theme/ Liquid templates with mock store data so the theme can be
// previewed with plain `npm run dev` (no Shopify store needed). Never shipped to Shopify.
import fs from 'node:fs'
import path from 'node:path'
import { Liquid } from 'liquidjs'

const ROOT = path.resolve('theme')
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8')
const exists = (...p) => fs.existsSync(path.join(ROOT, ...p))
const SCHEMA_RE = /\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/

const schemaOf = (src) => {
  const m = src.match(SCHEMA_RE)
  try { return m ? JSON.parse(m[1]) : {} } catch (e) { console.warn('[preview] bad schema JSON', e.message); return {} }
}
const defaults = (list = []) =>
  Object.fromEntries(list.filter((s) => s.id).map((s) => [s.id, s.default ?? (s.type === 'checkbox' ? false : '')]))

const money = (c) => '₹' + (Number(c || 0) / 100).toLocaleString('en-IN')
const mkProduct = (i, title, price, opts) => ({
  id: 100 + i, handle: title.toLowerCase().replace(/\W+/g, '-'), title, url: `/products/${title.toLowerCase().replace(/\W+/g, '-')}`,
  price, compare_at_price: i % 3 === 0 ? price + 50000 : 0, available: i !== 4, vendor: 'nanzo', featured_image: null, images: [], media: [],
  description: '<p>Soft, dreamy and made to be loved. Relaxed fit, pearl-finish details and a sea-glass shimmer.</p><ul><li>100% organic cotton</li><li>Relaxed, cropped fit</li><li>Wash cold, hang dry</li></ul>',
  options_with_values: opts, variants: [{ id: 1000 + i, title: 'S', price, available: true, options: ['S'] }, { id: 2000 + i, title: 'M', price, available: true, options: ['M'] }],
  selected_or_first_available_variant: { id: 1000 + i, price, available: true, compare_at_price: 0 },
})
const SIZES = [{ name: 'Size', selected_value: 'S', values: ['S', 'M', 'L'] }]
const PRODUCTS = [
  mkProduct(0, 'Pearl Baby Tee', 149900, SIZES), mkProduct(1, 'Seashell Cardigan', 349900, SIZES),
  mkProduct(2, 'Cloud Pleated Skirt', 249900, SIZES), mkProduct(3, 'Mermaid Mesh Top', 199900, SIZES),
  mkProduct(4, 'Coquette Bow Hoodie', 399900, SIZES), mkProduct(5, 'Sea Glass Cargo', 299900, SIZES),
  mkProduct(6, 'Butter Knit Vest', 179900, SIZES), mkProduct(7, 'Pink Tide Mini Dress', 329900, SIZES),
]
PRODUCTS.forEach((p) => { p.variants.forEach((v) => (v.options = [v.title])) })

let CART = []
const cartJson = () => {
  const items = CART.map((l, i) => ({
    key: String(l.id), id: l.id, quantity: l.qty, title: l.p.title, product_title: l.p.title, variant_title: 'S', url: l.p.url,
    price: l.p.price, line_price: l.p.price * l.qty, image: null, featured_image: null, final_line_price: l.p.price * l.qty, index: i,
  }))
  return { item_count: items.reduce((n, i) => n + i.quantity, 0), items, total_price: items.reduce((n, i) => n + i.line_price, 0), currency: 'INR' }
}

export function liquidPreview() {
  return {
    name: 'nanzo-liquid-preview',
    async configureServer(server) {
      const engine = new Liquid({ root: [path.join(ROOT, 'snippets')], partials: [path.join(ROOT, 'snippets')], extname: '.liquid', jsTruthy: false, strictFilters: false, strictVariables: false })

      // ---- Shopify filters
      engine.registerFilter('asset_url', (v) => (v === 'theme.js' ? '/theme-src/main.js' : v === 'theme.css' ? '/theme-src/empty.css' : `/theme/assets/${v}`))
      engine.registerFilter('image_url', (i) => (i && i.src) || '')
      engine.registerFilter('img_url', (i) => (i && i.src) || '')
      engine.registerFilter('money', money)
      engine.registerFilter('money_with_currency', (c) => money(c) + ' INR')
      engine.registerFilter('money_without_currency', (c) => (Number(c || 0) / 100).toFixed(2))
      engine.registerFilter('t', (v) => v)
      engine.registerFilter('handleize', (v) => String(v).toLowerCase().replace(/\W+/g, '-'))
      engine.registerFilter('stylesheet_tag', (u) => `<link rel="stylesheet" href="${u}">`)
      engine.registerFilter('media_tag', () => '')
      engine.registerFilter('model_viewer_tag', () => '')
      engine.registerFilter('default_pagination', () => '')
      engine.registerFilter('default_errors', () => '')
      engine.registerFilter('placeholder_svg_tag', () => '')
      engine.registerFilter('structured_data', () => '{}')

      // ---- raw/no-op block tags
      const rawBlock = (name, emit) => engine.registerTag(name, {
        parse(token, remain) {
          this.tokens = []
          const stream = this.liquid.parser.parseStream(remain)
          stream.on('token', (t) => { if (t.name === 'end' + name) stream.stop(); else this.tokens.push(t) })
            .on('end', () => { throw new Error(`tag ${name} not closed`) })
          stream.start()
        },
        render(ctx, emitter) { if (emit) emitter.write(this.tokens.map((t) => t.raw || t.input.slice(t.begin, t.end)).join('')) },
      })
      rawBlock('schema', false)
      rawBlock('javascript', false)
      rawBlock('stylesheet', false)
      rawBlock('style', true)

      // ---- {% form 'x' %}...{% endform %}
      engine.registerTag('form', {
        parse(token, remain) {
          this.type = (token.args.match(/['"]([^'"]+)['"]/) || [])[1] || 'x'
          this.cls = (token.args.match(/class:\s*['"]([^'"]+)['"]/) || [])[1] || ''
          this.tpls = []
          const stream = this.liquid.parser.parseStream(remain)
          stream.on('tag:endform', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('form not closed') })
          stream.start()
        },
        *render(ctx, emitter) {
          const isProduct = this.type === 'product'
          emitter.write(`<form method="post" action="${isProduct ? '/cart/add' : '/preview/' + this.type}" class="${this.cls}" ${isProduct ? 'data-add-to-cart="true"' : ''}>`)
          ctx.push({ form: { errors: null, posted_successfully: false } })
          yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter)
          ctx.pop()
          emitter.write('</form>')
        },
      })

      // ---- {% paginate x by n %}...{% endpaginate %}
      engine.registerTag('paginate', {
        parse(token, remain) {
          this.tpls = []
          const stream = this.liquid.parser.parseStream(remain)
          stream.on('tag:endpaginate', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('paginate not closed') })
          stream.start()
        },
        *render(ctx, emitter) {
          ctx.push({ paginate: { pages: 1, current_page: 1, parts: [], previous: null, next: null, items: 8 } })
          yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter)
          ctx.pop()
        },
      })

      // ---- section rendering (static {% section 'x' %} + JSON template sections)
      const globals = () => {
        const settings = defaults(JSON.parse(read('config', 'settings_schema.json')).flatMap((g) => g.settings || []))
        const linklist = (links) => ({ links: links.map(([title, url]) => ({ title, url, links: [] })) })
        return {
          shop: { name: 'nanzo', url: 'http://localhost:5173', money_format: '₹{{amount}}', password_message: 'Something dreamy is washing ashore.', currency: 'INR' },
          settings,
          request: { locale: { iso_code: 'en' }, design_mode: false, page_type: 'index' },
          routes: { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', all_products_collection_url: '/collections/all', search_url: '/search' },
          linklists: {
            'main-menu': linklist([['Shop', '/collections/all'], ['Lookbook', '/#lookbook'], ['About', '/pages/about']]),
            footer: linklist([['Shipping', '/pages/shipping'], ['Returns', '/pages/returns'], ['Contact', '/pages/contact']]),
          },
          collections: { all: { title: 'All pieces', handle: 'all', url: '/collections/all', products: PRODUCTS, products_count: PRODUCTS.length, all_products_count: PRODUCTS.length, sort_by: 'manual' } },
          cart: cartJson(), customer: null, content_for_header: '', canonical_url: 'http://localhost:5173/', page_description: '',
        }
      }
      const renderSection = async (type, id, over = {}, scope = {}) => {
        const src = read('sections', `${type}.liquid`)
        const schema = schemaOf(src)
        const blockDefs = Object.fromEntries((schema.blocks || []).map((b) => [b.type, defaults(b.settings)]))
        const blocks = (over.block_order || Object.keys(over.blocks || {})).map((bid) => {
          const b = over.blocks[bid]
          return { id: bid, type: b.type, settings: { ...blockDefs[b.type], ...b.settings }, shopify_attributes: '' }
        })
        const section = { id, settings: { ...defaults(schema.settings), ...(over.settings || {}) }, blocks, block_order: over.block_order || [] }
        const html = await engine.parseAndRender(src, { ...globals(), ...scope, section })
        return `<div id="shopify-section-${id}" class="shopify-section">${html}</div>`
      }
      engine.registerTag('section', {
        parse(token) { this.name = (token.args.match(/['"]([^'"]+)['"]/) || [])[1] },
        *render(ctx, emitter) {
          const scope = ctx.getAll ? ctx.getAll() : {}
          emitter.write(yield renderSection(this.name, this.name, {}, { product: scope.product, collection: scope.collection, template: scope.template }))
        },
      })

      const PAGES = [
        [/^\/$/, 'index'],
        [/^\/collections\/[^/]+$/, 'collection'],
        [/^\/products\/[^/]+$/, 'product'],
        [/^\/cart$/, 'cart'],
        [/^\/password$/, 'password'],
        [/^\/pages\/[^/]+$/, 'page'],
      ]
      const renderPage = async (url) => {
        const pathname = url.split('?')[0]
        const hit = PAGES.find(([re]) => re.test(pathname))
        const name = hit ? hit[1] : '404'
        const tpl = JSON.parse(read('templates', `${name}.json`))
        const handle = pathname.split('/').pop()
        const product = PRODUCTS.find((p) => p.handle === handle) || PRODUCTS[0]
        const scope = {
          template: { name, suffix: '' }, product, collection: globals().collections.all,
          page: { title: handle, content: '<p>Hello from nanzo ♡</p>' }, page_title: name === 'index' ? 'nanzo' : `${name} – nanzo`,
        }
        const parts = []
        for (const id of tpl.order) parts.push(await renderSection(tpl.sections[id].type, id, tpl.sections[id], scope))
        const layout = name === 'password' ? 'password' : 'theme'
        return engine.parseAndRender(read('layout', `${layout}.liquid`), { ...globals(), ...scope, content_for_layout: parts.join('\n') })
      }

      server.watcher.add(path.join(ROOT, '**/*.liquid'))
      server.watcher.on('change', (f) => { if (f.endsWith('.liquid') || f.endsWith('.json')) server.ws.send({ type: 'full-reload' }) })

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '/'
        const p = url.split('?')[0]
        // mock cart endpoints
        if (p === '/cart.js') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(cartJson())) }
        if (p === '/cart/add.js' && req.method === 'POST') {
          const chunks = []; for await (const c of req) chunks.push(c)
          const body = Buffer.concat(chunks).toString()
          const m = body.match(/name="id"\r\n\r\n(\d+)/) || body.match(/id=(\d+)/)
          const id = m ? +m[1] : 1000
          const prod = PRODUCTS.find((x) => x.variants.some((v) => v.id === id)) || PRODUCTS[0]
          const line = CART.find((l) => l.id === id)
          if (line) line.qty++; else CART.push({ id, qty: 1, p: prod })
          res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ id }))
        }
        if (p === '/cart/change.js' && req.method === 'POST') {
          const chunks = []; for await (const c of req) chunks.push(c)
          const { line, quantity } = JSON.parse(Buffer.concat(chunks).toString() || '{}')
          if (CART[line - 1]) { if (quantity <= 0) CART.splice(line - 1, 1); else CART[line - 1].qty = quantity }
          res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(cartJson()))
        }
        if (/^\/preview\//.test(p)) { res.statusCode = 302; res.setHeader('location', '/'); return res.end() }
        if (p === '/theme-src/empty.css') return next()
        if (/\.[a-z0-9]+$/i.test(p) || /^\/(theme|theme-src|@|node_modules)/.test(p)) return next()
        try {
          let html = await renderPage(url)
          html = await server.transformIndexHtml(url, html)
          res.setHeader('content-type', 'text/html'); res.end(html)
        } catch (e) { console.error(e); res.statusCode = 500; res.end(`<pre>${String(e.stack || e).replace(/</g, '&lt;')}</pre>`) }
      })
    },
  }
}
