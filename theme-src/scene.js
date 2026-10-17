import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { state, isMobile, reduceMotion } from './state.js'

gsap.registerPlugin(ScrollTrigger)

const TAU = Math.PI * 2
const PASTELS = [0xfffaf0, 0xffc2d4, 0xd9e8e0, 0xf6e7a1, 0xe4d4ff, 0xffffff]

/* ---------- procedural scallop shell (one valve) ----------
   A fan of ribs: radius r, angle th. Height = lens bulge + rib ridges, rim is scalloped.
   Vertex colours run hinge-pink -> rim-cream, with deeper valleys between ribs. */
function valveGeometry({ ribs = 9, spread = 1.0, R = 2.2, depth = 0.6, NU = 120, NV = 64 } = {}) {
  const pos = [], col = [], idx = []
  const hinge = new THREE.Color('#ff4f8b'), mid = new THREE.Color('#ff93b6'), rim = new THREE.Color('#ffd0de'), valley = new THREE.Color('#e8457f')
  const c = new THREE.Color()
  for (let i = 0; i <= NU; i++) {
    const s = (i / NU) * 2 - 1
    const th = s * spread
    const w = Math.cos(Math.PI * ribs * s) // -1..1 ridges
    for (let j = 0; j <= NV; j++) {
      const v = j / NV
      const edge = THREE.MathUtils.smoothstep(v, 0.78, 1)
      // |cos|^0.45 = round lobes with narrow notches between ribs (like the logo's shell)
      const lobe = Math.pow(Math.abs(Math.cos(Math.PI * ribs * s * 0.5)), 0.45)
      const r = v * (1 - 0.1 * (1 - lobe) * edge)
      const bulge = depth * Math.sin(Math.PI * Math.pow(v, 0.72)) * (1 - 0.5 * s * s)
      const ridge = 0.075 * w * Math.sin(Math.PI * Math.pow(v, 0.9)) * Math.min(1, v * 4)
      pos.push(Math.sin(th) * r * R, Math.cos(th) * r * R, bulge + ridge)
      c.copy(hinge).lerp(mid, Math.min(1, v * 1.6)).lerp(rim, Math.pow(v, 2.2))
      c.lerp(valley, (0.5 - 0.5 * w) * 0.28 * v)
      col.push(c.r, c.g, c.b)
    }
  }
  for (let i = 0; i < NU; i++) {
    for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j, b = a + NV + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

// cheap version for background decor (no clearcoat / sheen / iridescence)
function decorShellMaterial(tint) {
  return new THREE.MeshStandardMaterial({ color: tint, vertexColors: true, side: THREE.DoubleSide, roughness: 0.35, metalness: 0, envMapIntensity: 0.8 })
}

function shellMaterial(tint = 0xffffff) {
  return new THREE.MeshPhysicalMaterial({
    color: tint, vertexColors: true, side: THREE.DoubleSide, roughness: 0.26, metalness: 0,
    clearcoat: 0.55, clearcoatRoughness: 0.18, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(0xffb3cc),
    iridescence: 0.6, iridescenceIOR: 1.35, iridescenceThicknessRange: [120, 420], envMapIntensity: 0.7,
  })
}

// a full clam: two valves hinged on the x-axis. open() swings them apart.
function makeShell(geo, mat) {
  const group = new THREE.Group()
  const top = new THREE.Mesh(geo, mat)
  const bottom = new THREE.Mesh(geo, mat)
  bottom.scale.z = -1
  group.add(top, bottom)
  group.userData.open = (a) => { top.rotation.x = a; bottom.rotation.x = -a }
  return group
}

export function initScene() {
  const canvas = document.getElementById('gl')
  if (!canvas) return
  const hero = document.body.dataset.template === 'index'
  const mobile = isMobile()

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' })
  } catch { canvas.remove(); return }
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80)
  camera.position.set(0, 0, 13)

  const key = new THREE.DirectionalLight(0xffffff, 1.4)
  key.position.set(3, 6, 8)
  const pinkL = new THREE.PointLight(0xff8fb8, 28, 30, 1.6)
  pinkL.position.set(-6, -2, 5)
  const mintL = new THREE.PointLight(0xbdf5de, 22, 30, 1.6)
  mintL.position.set(6, 3, 4)
  scene.add(key, pinkL, mintL, new THREE.AmbientLight(0xffffff, 0.35))

  /* ----- hero shell + pearl ----- */
  const valve = valveGeometry()
  const heroMat = shellMaterial(0xffffff)
  const intro = new THREE.Group() // plays the entrance
  const rig = new THREE.Group() // driven by scroll
  const tilt = new THREE.Group() // driven by the pointer
  const shell = makeShell(valve, heroMat)
  shell.position.y = -1.1 // hinge sits at the bottom, centre the body on the origin
  const pearlMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.08, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05,
    iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [100, 800], sheen: 1, sheenColor: new THREE.Color(0xffd6e6), envMapIntensity: 1.4,
  })
  const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 48), pearlMat)
  pearl.position.set(0, 0.2, 0.05)
  pearl.scale.setScalar(0.0001)
  tilt.add(shell, pearl)
  rig.add(tilt)
  intro.add(rig)
  scene.add(intro)

  /* ----- floating decor: mini shells, pearls, bubbles ----- */
  const decor = []
  const add = (obj, spread = 1) => {
    const ang = Math.random() * TAU
    const rad = 4.2 + Math.random() * 6.5
    let x = Math.cos(ang) * rad * 1.15 * spread
    if (Math.abs(x) < 3.4) x = (x < 0 ? -1 : 1) * (3.4 + Math.random() * 2.5) // keep the centre column (text) clear
    obj.userData.base = new THREE.Vector3(x, (Math.random() - 0.5) * 8.5, -4 + Math.random() * 6)
    obj.userData.ph = Math.random() * TAU
    obj.userData.sp = 0.3 + Math.random() * 0.6
    obj.userData.spin = (Math.random() - 0.5) * 0.5
    obj.position.copy(obj.userData.base)
    scene.add(obj)
    decor.push(obj)
  }
  const nShell = mobile ? 4 : 7, nPearl = mobile ? 7 : 14, nBubble = mobile ? 0 : 4
  const lowValve = valveGeometry({ NU: 44, NV: 24 })
  const decorMats = PASTELS.map(decorShellMaterial)
  for (let i = 0; i < nShell; i++) {
    const s = makeShell(lowValve, decorMats[i % decorMats.length])
    s.scale.setScalar(0.12 + Math.random() * 0.2)
    s.userData.open(0.25 + Math.random() * 0.4)
    s.rotation.set(Math.random() * TAU, Math.random() * TAU, 0)
    add(s)
  }
  const pearlGeo = new THREE.SphereGeometry(0.5, 16, 16)
  const decorPearl = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.1, envMapIntensity: 1.2 })
  for (let i = 0; i < nPearl; i++) {
    const m = new THREE.Mesh(pearlGeo, decorPearl)
    m.scale.setScalar(0.08 + Math.random() * 0.26)
    add(m)
  }
  const bubbleGeo = new THREE.SphereGeometry(0.5, 20, 20)
  // fake glass: plain transparency is far cheaper than real transmission (which re-renders the scene)
  const bubbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.3, envMapIntensity: 1.6, depthWrite: false })
  for (let i = 0; i < nBubble; i++) {
    const m = new THREE.Mesh(bubbleGeo, bubbleMat)
    m.scale.setScalar(0.5 + Math.random() * 0.8)
    add(m)
  }

  /* ----- layout ----- */
  const resize = () => {
    const w = innerWidth, h = innerHeight
    renderer.setSize(w, h, false)
    canvas.style.width = '100%'; canvas.style.height = '100%'
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  addEventListener('resize', resize)
  resize()

  /* ----- scroll choreography (rebuilt when crossing the mobile breakpoint) ----- */
  gsap.matchMedia().add({ desktop: '(min-width: 801px)', phone: '(max-width: 800px)' }, (mq) => {
    const phone = mq.conditions.phone

    if (!hero) {
      // quiet pages: shell parks in a corner, decor floats behind the content
      rig.position.set(phone ? 0 : 4.6, phone ? 2.4 : -1.7, -3)
      rig.scale.setScalar(phone ? 0.38 : 0.5)
      gsap.to(rig.rotation, { y: TAU, duration: 24, ease: 'none', repeat: -1 })
      return
    }

    // 0) hero: big shell in front of the giant wordmark
    const heroScale = phone ? 0.8 : 1.0
    const heroY = phone ? 1.2 : 1.35
    gsap.set(rig.position, { x: 0, y: heroY, z: 0 })
    gsap.set(rig.scale, { x: heroScale, y: heroScale, z: heroScale })
    gsap.set(rig.rotation, { y: 0.0 })
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 } })
      .fromTo(rig.position, { y: heroY }, { y: phone ? -0.8 : -0.3, ease: 'none' }, 0)
      .fromTo(rig.scale, { x: heroScale, y: heroScale, z: heroScale }, { x: heroScale * 0.8, y: heroScale * 0.8, z: heroScale * 0.8, ease: 'none' }, 0)
      .fromTo(rig.rotation, { y: 0 }, { y: 0.5, ease: 'none' }, 0)

    // 1..n) story: one pose per step, aligned against that step's text side
    const steps = [...document.querySelectorAll('[data-step]')]
    if (!steps.length) return
    const tints = [new THREE.Color(0xffffff), new THREE.Color(0xd5fff0), new THREE.Color(0xfff2b0), new THREE.Color(0xe9dcff), new THREE.Color(0xffffff)]
    const opens = [0.1, 0.78, 0.3, 0.6, 0.1]
    const tl = gsap.timeline({
      defaults: { duration: 1, ease: 'power2.inOut' },
      scrollTrigger: { trigger: '[data-story]', start: 'top top', end: 'bottom bottom', scrub: 1 },
    })
    let spin = 0.5
    steps.forEach((el, i) => {
      const align = el.classList.contains('story__step--left') ? 1 : el.classList.contains('story__step--right') ? -1 : 0
      const x = phone ? 0 : align * 2.9
      const y = phone ? -1.7 : -0.15
      const sc = align === 0 ? (phone ? 1 : 1.45) : phone ? 0.78 : 1.0
      spin += 1.15
      tl.to(rig.position, { x, y, immediateRender: false }, i)
        .to(rig.scale, { x: sc, y: sc, z: sc, immediateRender: false }, i)
        .to(rig.rotation, { y: align === 0 ? spin + TAU * 0.5 : spin, immediateRender: false }, i)
        .to(heroMat.color, { r: tints[i % 5].r, g: tints[i % 5].g, b: tints[i % 5].b }, i)
      const o = { v: i === 0 ? 0 : opens[i - 1] }
      tl.to(o, { v: opens[i % opens.length], onUpdate: () => shell.userData.open(o.v) }, i)
      const pearlS = opens[i % opens.length] > 0.5 ? 1 : opens[i % opens.length] > 0.25 ? 0.55 : 0.0001
      tl.to(pearl.scale, { x: pearlS, y: pearlS, z: pearlS }, i)
      tl.to(pearl.position, { y: opens[i % opens.length] > 0.5 ? 0.55 : 0.2 }, i)
    })

    // stop rendering once the first solid section covers the canvas
    const cover = document.querySelector('.sheet')
    if (cover) ScrollTrigger.create({
      trigger: cover, start: 'top top',
      onEnter: () => (state.sceneActive = false), onLeaveBack: () => (state.sceneActive = true),
    })
  })

  /* ----- render loop (on GSAP's ticker, so it stays in lock-step with smooth scroll) ----- */
  const px = { x: 0, y: 0 }
  let frames = 0, acc = 0, last = 0, degraded = false
  const tick = (time) => {
    if (!state.sceneActive || document.hidden) { last = 0; return }
    // auto quality: if the device can't hold ~35fps, drop resolution and thin out the decor
    if (last && !degraded) {
      const dt = time - last
      if (dt < 0.5) { acc += dt; frames++ }
      if (frames === 30) {
        if (acc / frames > 0.029) {
          degraded = true
          renderer.setPixelRatio(1)
          renderer.setSize(innerWidth, innerHeight, false)
          decor.forEach((o, i) => { if (i % 2) o.visible = false })
        }
        frames = 0; acc = 0
      }
    }
    last = time
    px.x += (state.pointer.x - px.x) * 0.06
    px.y += (state.pointer.y - px.y) * 0.06

    tilt.rotation.x = px.y * 0.28
    tilt.rotation.y = px.x * 0.5
    shell.rotation.y = Math.sin(time * 0.5) * 0.12
    shell.position.y = -1.1 + Math.sin(time * 1.1) * 0.07
    if (pearl.scale.x > 0.01) pearl.rotation.y = time * 0.6

    decor.forEach((o) => {
      const u = o.userData
      const depth = 0.35 + (o.userData.base.z + 4) / 10 // nearer things drift more with the pointer
      o.position.set(
        u.base.x + Math.sin(time * 0.25 * u.sp + u.ph) * 0.5 - px.x * 1.8 * depth,
        u.base.y + Math.sin(time * u.sp + u.ph) * 0.45 + px.y * 1.1 * depth,
        u.base.z
      )
      o.rotation.y += u.spin * 0.01
      o.rotation.x += u.spin * 0.006
    })
    pinkL.position.x = -6 + Math.sin(time * 0.6) * 3
    mintL.position.y = 3 + Math.cos(time * 0.5) * 2

    camera.position.x += (px.x * 0.8 - camera.position.x) * 0.05
    camera.position.y += (-px.y * 0.5 - camera.position.y) * 0.05
    camera.lookAt(0, 0, 0)
    renderer.render(scene, camera)
  }

  // compile shaders off the main thread first so the page never freezes on first paint, then play the entrance
  const start = () => {
    gsap.ticker.add(tick)
    if (!reduceMotion) gsap.from(intro.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 1.8, ease: 'elastic.out(1, 0.55)' })
    gsap.from(intro.rotation, { y: -TAU * 0.6, duration: 2.2, ease: 'power3.out' })
  }
  intro.scale.setScalar(0.001) // hidden until the first frame is ready
  const ready = renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve()
  ready.catch(() => {}).then(() => { intro.scale.setScalar(1); start() })

  // expose for debugging in dev
  window.__nzScene = { scene, camera, renderer, rig, shell }
}
