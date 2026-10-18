# nanzo: Shopify theme

A custom Online Store 2.0 theme (Liquid) with a WebGL 3D hero, scroll storytelling, synthesized
sound and a background video. Vite is used **only as a build tool**: it bundles `theme-src/`
into `theme/assets/theme.js` and `theme.css`, which Shopify serves.

```
theme/          <- the Shopify theme (this folder is what you upload)
  assets/       built JS/CSS + logos + hero video   (theme.js / theme.css are generated)
  config/ layout/ locales/ sections/ snippets/ templates/
theme-src/      <- source for the JS/CSS (three.js, GSAP, Lenis, sound, cart)
scripts/        <- dev-only Liquid preview server (never shipped)
```

## Preview locally (no Shopify store needed)

```bash
npm install
npm run dev        # http://localhost:5173  (mock products + cart)
```
Routes: `/`, `/collections/all`, `/products/pearl-baby-tee`, `/cart`, `/password`, `/pages/about`.

## Build + deploy to Shopify

```bash
npm run build                                  # writes theme/assets/theme.js + theme.css
shopify theme push --path theme --unpublished  # needs Shopify CLI + `shopify auth login`
```
or zip the **contents** of `theme/` and upload in Admin → Online Store → Themes → Add theme.
Always run `npm run build` first, because the built files in `theme/assets/` are what Shopify loads.

## Coming-soon mode (until launch)
Admin → Online Store → Preferences → enable password protection. The theme's `password` page is the
coming-soon page (countdown + waitlist). Waitlist signups become Shopify customers tagged `waitlist`.

## Things to set in the theme editor
- **Theme settings → Brand & launch**: launch date (drives every countdown), sounds, 3D on/off.
- **Hero → Background video**: upload an MP4 (< 10 MB). Empty = the built-in dreamy loop.
- **Story / Lookbook / Featured collection**: edit text, images and collection per section.
- Menus: `main-menu` (header) and `footer` (footer).

## Shiprocket
Install the Shiprocket app from the Shopify App Store (or Shiprocket → Channels → Add Channel → Shopify).
Orders then sync automatically; no theme code is needed.

## Coming-soon-only mode (current)
Every public template (`index`, `collection`, `product`, `cart`, `page`, `404`) renders only the **Coming soon**
section. The full store versions are kept as alternate templates: `index.store.json`, `collection.store.json`,
`product.store.json`, `cart.store.json`, `page.store.json`, `404.store.json`.
**To launch the full store:** in `theme/templates/`, overwrite each `X.json` with its `X.store.json`
(and remove the `"layout": "password"` line), then push.

Email signups use Shopify's customer form: each address becomes a customer (email marketing: subscribed)
tagged `waitlist`. View them in Shopify Admin → Customers (filter by tag `waitlist`).
