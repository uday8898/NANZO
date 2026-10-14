import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Soft pastel WebGL layer: floating shells, pearls and a glossy blob.
// `pointer` is a ref holding {x,y} in -0.5..0.5.
export default function Scene({ pointer }) {
  const ref = useRef(null)

  useEffect(() => {
    const R = new THREE.WebGLRenderer({ canvas: ref.current, antialias: true, alpha: true })
    R.setPixelRatio(Math.min(devicePixelRatio, 2))
    const S = new THREE.Scene()
    const C = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    C.position.z = 10
    const resize = () => {
      R.setSize(innerWidth, innerHeight)
      C.aspect = innerWidth / innerHeight
      C.updateProjectionMatrix()
    }
    addEventListener('resize', resize)
    resize()

    S.add(new THREE.AmbientLight(0xffffff, 0.9))
    const key = new THREE.DirectionalLight(0xffffff, 1.2)
    key.position.set(4, 6, 8)
    S.add(key)
    const rim = new THREE.PointLight(0xffb3d1, 1.5, 40)
    rim.position.set(-6, -3, 5)
    S.add(rim)

    // glossy pearl-pink blob behind the logo
    const geo = new THREE.IcosahedronGeometry(2.6, 5)
    const base = geo.attributes.position.array.slice()
    const blob = new THREE.Mesh(
      geo,
      new THREE.MeshPhysicalMaterial({
        color: 0xffe0ea, roughness: 0.18, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.1,
        iridescence: 1, iridescenceIOR: 1.4, sheen: 1, sheenColor: new THREE.Color(0xffffff),
        transparent: true, opacity: 0.85,
      })
    )
    blob.position.z = -5
    S.add(blob)

    // shells (textured planes) + pearls + bubbles
    const tex = new THREE.TextureLoader().load('/logos/shell.png')
    tex.colorSpace = THREE.SRGBColorSpace
    const tints = [0xfffaf0, 0xf4739a, 0xd9e8e0, 0xf6e7a1, 0xe4d4ff, 0x483432]
    const items = []
    const add = (mesh, extra = {}) => {
      mesh.userData = {
        a: Math.random() * 6.28, r: 5 + Math.random() * 6, y: (Math.random() - 0.5) * 9,
        sp: 0.15 + Math.random() * 0.3, spin: (Math.random() - 0.5) * 0.04, z: -Math.random() * 5, ...extra,
      }
      S.add(mesh)
      items.push(mesh)
    }
    const shellGeo = new THREE.PlaneGeometry(1.5, 1.2)
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(
        shellGeo,
        new THREE.MeshBasicMaterial({ map: tex, color: tints[i % tints.length], transparent: true, side: THREE.DoubleSide })
      )
      m.scale.setScalar(0.6 + Math.random() * 0.9)
      add(m)
    }
    const pearlGeo = new THREE.SphereGeometry(0.35, 32, 32)
    const pearlMat = new THREE.MeshPhysicalMaterial({
      color: 0xfff5f7, roughness: 0.05, metalness: 0.2, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6,
    })
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(pearlGeo, pearlMat)
      m.scale.setScalar(0.5 + Math.random() * 1.1)
      add(m, { spin: 0 })
    }
    const heartShape = new THREE.Shape()
    heartShape.moveTo(0, -0.5)
    heartShape.bezierCurveTo(-1, 0.1, -0.6, 0.9, 0, 0.5)
    heartShape.bezierCurveTo(0.6, 0.9, 1, 0.1, 0, -0.5)
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, { depth: 0.25, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.1, bevelSegments: 4 })
    heartGeo.center()
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(
        heartGeo,
        new THREE.MeshPhysicalMaterial({ color: i % 2 ? 0xf4739a : 0xfffaf0, roughness: 0.25, clearcoat: 1 })
      )
      m.scale.setScalar(0.5 + Math.random() * 0.5)
      add(m)
    }

    // sparkle dust
    const N = 500
    const pa = new Float32Array(N * 3)
    for (let i = 0; i < N * 3; i++) pa[i] = (Math.random() - 0.5) * 36
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.BufferAttribute(pa, 3))
    const dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.9 }))
    S.add(dust)

    let scroll = 0
    const onWheel = (e) => (scroll += e.deltaY * 0.0008)
    addEventListener('wheel', onWheel)

    let T = 0, raf
    const loop = () => {
      raf = requestAnimationFrame(loop)
      T += 0.01
      const { x: nx, y: ny } = pointer.current
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2]
        const k = 1 + 0.12 * Math.sin(x * 1.1 + T * 2) * Math.cos(y * 1.2 + T * 1.6) + 0.07 * Math.sin(z * 1.8 + T * 2.5)
        pos.setXYZ(i, x * k, y * k, z * k)
      }
      pos.needsUpdate = true
      geo.computeVertexNormals()
      blob.rotation.y = T * 0.3 + nx
      blob.rotation.x = T * 0.15 + ny

      items.forEach((m) => {
        const u = m.userData
        u.a += u.sp * 0.008
        m.position.set(
          Math.cos(u.a) * u.r + nx * 2.5,
          u.y + Math.sin(T * 2 + u.a * 3) * 0.5 + scroll,
          Math.sin(u.a) * u.r * 0.35 + u.z
        )
        m.rotation.y += u.spin * 2
        m.rotation.z += u.spin
      })
      dust.rotation.y = T * 0.03
      C.position.x += (nx * 2.5 - C.position.x) * 0.05
      C.position.y += (-ny * 1.6 - C.position.y) * 0.05
      C.lookAt(0, 0, 0)
      R.render(S, C)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
      removeEventListener('wheel', onWheel)
      R.dispose()
    }
  }, [pointer])

  return <canvas id="gl" ref={ref} />
}
