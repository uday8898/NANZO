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
const COLOURS = ['Blush', 'White', 'Cocoa', 'Olive']
const SIZE_LIST = ['XS', 'S', 'M', 'L', 'XL']
const mkProduct = (i, title, price) => {
  const handle = title.toLowerCase().replace(/W+/g, '-')
  const variants = []
  COLOURS.forEach((c, ci) => SIZE_LIST.forEach((sz, si) => variants.push({
    id: 1000 * (i + 1) + ci * 10 + si, title: c + ' / ' + sz, price, compare_at_price: i % 2 === 0 ? price + 80000 : 0,
    available: sz !== 'XL', options: [c, sz], featured_media: null,
  })))
  return {
    id: 100 + i, handle, title, url: '/products/' + handle, price, compare_at_price: i % 2 === 0 ? price + 80000 : 0, available: true, vendor: 'nanzo',
    featured_image: null, images: [], media: [], has_only_default_variant: false,
    description: '<p>A sequin-scale disco dress for the nights you will want photos of. Plunge halter neck, open back with a tie-up and a soft satin lining.</p>',
    options: ['Colour', 'Size'],
    options_with_values: [{ name: 'Colour', selected_value: 'Blush', values: COLOURS }, { name: 'Size', selected_value: 'S', values: SIZE_LIST }],
    variants, selected_or_first_available_variant: variants[1],
    metafields: {
      custom: {
        badge: { value: 'Limited Edition Drop, made for birthdays' },
        tagline: { value: "for the nights you'll want photos of" },
        occasions: { value: [
          { label: 'Birthday', copy: 'Own the room, blow out the candles, let the sequins catch every flash.', match: 96 },
          { label: 'Bachelorette', copy: 'Add the heels, order the round of shots, let the sequins do the talking.', match: 100 },
          { label: 'Vacation', copy: 'Sunset dinners, beach clubs and the late-night walk back.', match: 82 },
          { label: 'Date night', copy: 'Quietly show-stopping from the first drink to the last dance.', match: 90 },
        ] },
        details: { value: { Colour: 'Blush', Material: 'Sequin-scale discs on soft mesh, satin lining', Fit: 'Body-skimming, true to size', Neckline: 'Plunge halter', Sleeves: 'Sleeveless, openback with tie-up', Length: 'Above the knee' } },
        styling: { value: 'Strappy heels, a mini bag and a slicked-back bun. Keep the jewellery simple and let the scales shine.' },
        care: { value: 'Hand wash cold, inside out. Do not wring. Dry flat in shade. Steam on low from the inside only.' },
        manufacturing: { value: 'Designed in India and made in small batches by our partner studio in Jaipur.' },
      },
      reviews: { rating: { value: { rating: 4.5, scale_max: 5 } }, rating_count: { value: 212 } },
    },
  }
}
export const PRODUCTS = [
  mkProduct(0, 'Disco Scale Dress', 249000), mkProduct(1, 'Seashell Cardigan', 349900),
  mkProduct(2, 'Cloud Pleated Skirt', 249900), mkProduct(3, 'Mermaid Mesh Top', 199900),
  mkProduct(4, 'Coquette Bow Hoodie', 399900), mkProduct(5, 'Sea Glass Cargo', 299900),
  mkProduct(6, 'Butter Knit Vest', 179900), mkProduct(7, 'Pink Tide Mini Dress', 329900),
]

let CART = []
const cartJson = () => {
  const items = CART.map((l, i) => ({
    key: String(l.id), id: l.id, quantity: l.qty, title: l.p.title, product_title: l.p.title, variant_title: 'S', url: l.p.url,
    price: l.p.price, line_price: l.p.price * l.qty, image: null, featured_image: null, final_line_price: l.p.price * l.qty, index: i,
  }))
  return { item_count: items.reduce((n, i) => n + i.quantity, 0), items, total_price: items.reduce((n, i) => n + i.line_price, 0), currency: 'INR' }
}

// Renders theme/ templates with mock data. `assetUrl` decides how {{ 'x' | asset_url }} resolves
// (dev server vs. static export).
export function createRenderer({ assetUrl, store = false }) {
    const engine = new Liquid({ root: [path.join(ROOT, 'snippets')], partials: [path.join(ROOT, 'snippets')], extname: '.liquid', jsTruthy: false, strictFilters: false, strictVariables: false })

    // ---- Shopify filters
    engine.registerFilter('asset_url', assetUrl)
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
        this.fid = (token.args.match(/\bid:\s*['"]([^'"]+)['"]/) || [])[1] || ''
        this.tpls = []
        const stream = this.liquid.parser.parseStream(remain)
        stream.on('tag:endform', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('form not closed') })
        stream.start()
      },
      *render(ctx, emitter) {
        const isProduct = this.type === 'product'
        emitter.write(`<form method="post" action="${isProduct ? '/cart/add' : '/preview/' + this.type}" class="${this.cls}" ${this.fid ? `id="${this.fid}"` : ''} ${isProduct ? 'data-add-to-cart="true"' : ''}>`)
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
        collections: (() => { const c = { title: 'All pieces', handle: 'all', url: '/collections/all', products: PRODUCTS, products_count: PRODUCTS.length, all_products_count: PRODUCTS.length, sort_by: 'manual' }; return { all: c, 'after-hours': process.env.NZ_EMPTY_DROP ? null : { ...c, title: 'After Hours', handle: 'after-hours' } } })(),
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
      // `?store=1` (or opts.store) renders the full-store templates (*.store.json) instead of coming-soon
      const useStore = store || /[?&]store(=|&|$)/.test(url)
      const tplFile = useStore && exists('templates', `${name}.store.json`) ? `${name}.store.json` : `${name}.json`
      const tpl = JSON.parse(read('templates', tplFile))
      const handle = pathname.split('/').pop()
      const product = PRODUCTS.find((p) => p.handle === handle) || PRODUCTS[0]
      const scope = {
        template: { name, suffix: '' }, product, collection: globals().collections.all,
        page: { title: handle, content: '<p>Hello from nanzo ♡</p>' }, page_title: name === 'index' ? 'nanzo' : `${name} – nanzo`,
      }
      const parts = []
      for (const id of tpl.order) parts.push(await renderSection(tpl.sections[id].type, id, tpl.sections[id], scope))
      const layout = tpl.layout || (name === 'password' ? 'password' : 'theme')
      return engine.parseAndRender(read('layout', `${layout}.liquid`), { ...globals(), ...scope, content_for_layout: parts.join('\n') })
    }

  return { renderPage }
}

const devAssetUrl = (v) => (v === 'theme.js' ? '/theme-src/main.js' : v === 'landing.js' ? '/theme-src/landing/landing.js' : v === 'theme.css' || v === 'landing.css' ? '/theme-src/empty.css' : `/theme/assets/${v}`)

export function liquidPreview() {
  return {
    name: 'nanzo-liquid-preview',
    async configureServer(server) {
      const { renderPage } = createRenderer({ assetUrl: devAssetUrl, store: process.env.NZ_STORE === '1' })

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
          // accepts the theme's form posts (id=...) and the landing page's JSON {items:[{id,quantity}]}
          let ids = []
          try { const j = JSON.parse(body); ids = (j.items || [j]).map((i) => +i.id) } catch {
            const m = body.match(/name="id"\r\n\r\n(\d+)/) || body.match(/id=(\d+)/)
            ids = [m ? +m[1] : 1000]
          }
          for (const id of ids) {
            const prod = PRODUCTS.find((x) => x.variants.some((v) => v.id === id)) || PRODUCTS[0]
            const line = CART.find((l) => l.id === id)
            if (line) line.qty++; else CART.push({ id, qty: 1, p: prod })
          }
          res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ items: ids.map((id) => ({ id })) }))
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
