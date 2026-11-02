import './styles/theme.css'
import './styles/store.css'
import { initSmooth } from './smooth.js'
import { initSound } from './sound.js'
import { initUI } from './ui.js'
import { initScroll } from './scroll.js'
import { initCart } from './cart.js'
import { initProduct } from './product.js'
import { initRibbon } from './ribbon.js'

function boot() {
  initSmooth()
  initSound()
  initUI()
  initScroll()
  initCart()
  initProduct()
  initRibbon()
  // three.js is lazy-loaded (separate chunk) so the page paints before the heavy WebGL code arrives
  if (document.getElementById('gl')) import('./scene.js').then((m) => m.initScene()).catch((e) => console.warn('3D scene unavailable', e))
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
else boot()
