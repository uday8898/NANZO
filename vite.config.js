import { defineConfig } from 'vite'
import { liquidPreview } from './scripts/liquid-preview.js'

// `vite`        -> local preview: renders the Liquid theme with mock data + HMR for theme-src/
// `vite build`  -> bundles theme-src/ into theme/assets/theme.js + theme.css (what Shopify serves)
export default defineConfig(({ command }) => ({
  publicDir: false,
  plugins: command === 'serve' ? [liquidPreview()] : [],
  server: { port: 5173 },
  build: {
    outDir: 'theme/assets',
    emptyOutDir: false,
    cssCodeSplit: false,
    modulePreload: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: 'theme-src/main.js',
      output: {
        // Shopify serves theme.js as `theme.js?v=<hash>`, but a lazy chunk importing it as plain `theme.js`
        // makes the browser run the entry TWICE (double click handlers, double sounds). So anything shared
        // between the entry and the lazy 3D chunk lives in its own file, and nothing imports the entry.
        manualChunks(id) {
          if (id.includes('node_modules/gsap')) return 'gsap'
          if (id.includes('theme-src/state.js')) return 'state'
        },
        // fixed names: Liquid references theme.js / theme.css via asset_url
        entryFileNames: 'theme.js',
        chunkFileNames: 'theme-[name].[hash].js',
        assetFileNames: (a) => ((a.name || '').endsWith('.css') ? 'theme.css' : '[name][extname]'),
      },
    },
  },
}))
