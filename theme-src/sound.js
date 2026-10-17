// All audio is synthesized with WebAudio: no files to host. Browsers only allow sound after the
// first user gesture, so ambient music starts on the first click/tap/key.
let ctx, master, reverb, ambientTimer, noteTimer, running = false

const KEY = 'nz_sound'
const stored = () => { try { return localStorage.getItem(KEY) } catch { return null } }
const store = (v) => { try { localStorage.setItem(KEY, v) } catch { /* private mode */ } }
const allowed = () => window.nz?.sound !== false && stored() !== 'off'

const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1568]
const CHORDS = [
  [261.63, 329.63, 392, 493.88], // Cmaj7
  [220, 261.63, 329.63, 392], //    Am7
  [174.61, 220, 261.63, 329.63], // Fmaj7
  [196, 246.94, 293.66, 392], //    G6
]

function ensure() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(ctx.destination)
  // cheap synthetic reverb: decaying noise impulse
  const len = ctx.sampleRate * 2.2
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  }
  reverb = ctx.createConvolver()
  reverb.buffer = buf
  const wet = ctx.createGain()
  wet.gain.value = 0.35
  reverb.connect(wet).connect(master)
  return ctx
}

function tone({ f, t = 0, dur = 0.5, vol = 0.1, type = 'sine', attack = 0.01, glideFrom, wet = true }) {
  const c = ensure()
  if (!c) return
  const s = c.currentTime + t
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  if (glideFrom) { o.frequency.setValueAtTime(glideFrom, s); o.frequency.exponentialRampToValueAtTime(f, s + 0.08) }
  else o.frequency.value = f
  g.gain.setValueAtTime(0.0001, s)
  g.gain.exponentialRampToValueAtTime(vol, s + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, s + dur)
  o.connect(g)
  g.connect(master)
  if (wet) g.connect(reverb)
  o.start(s)
  o.stop(s + dur + 0.1)
}
const bell = (f, t, vol, dur = 1.1) => {
  tone({ f, t, vol, dur })
  tone({ f: f * 2.76, t, vol: vol * 0.28, dur: dur * 0.5 })
}

export const sfx = {
  pop() {
    if (!allowed() || !ensure()) return
    ctx.resume?.()
    tone({ f: 1500, glideFrom: 380, dur: 0.12, vol: 0.2, attack: 0.012, wet: false })
    const i = Math.floor(Math.random() * (PENTA.length - 3)) + 2
    bell(PENTA[i], 0.07, 0.1, 0.6)
    bell(PENTA[i + 1], 0.16, 0.08, 0.6)
  },
  hover() {
    if (!allowed() || !ctx || ctx.state !== 'running') return
    tone({ f: 1760 + Math.random() * 400, dur: 0.08, vol: 0.025, wet: false })
  },
  twinkle() {
    if (!allowed() || !ctx || ctx.state !== 'running') return
    ;[0, 2, 4, 5].forEach((n, i) => bell(PENTA[n + 2] || PENTA[n], i * 0.09, 0.07, 0.9))
  },
  cart() {
    if (!allowed() || !ensure()) return
    ctx.resume?.()
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, i * 0.08, 0.1, 0.9))
  },
}

function chord() {
  const notes = CHORDS[Math.floor(Date.now() / 8000) % CHORDS.length]
  notes.forEach((f, i) => {
    ;[0, 5].forEach((detune) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 900
      o.type = i % 2 ? 'sine' : 'triangle'
      o.frequency.value = f
      o.detune.value = detune
      const s = ctx.currentTime
      g.gain.setValueAtTime(0.0001, s)
      g.gain.linearRampToValueAtTime(0.018, s + 3)
      g.gain.linearRampToValueAtTime(0.0001, s + 9)
      o.connect(lp).connect(g)
      g.connect(master)
      g.connect(reverb)
      o.start(s)
      o.stop(s + 9.5)
    })
  })
}

function sprinkle() {
  if (!running) return
  const f = PENTA[Math.floor(Math.random() * PENTA.length)]
  bell(f, 0, 0.032, 2.2)
  noteTimer = setTimeout(sprinkle, 900 + Math.random() * 2200)
}

export function startAmbient() {
  if (running || !allowed() || !ensure()) return
  ctx.resume?.()
  running = true
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 2)
  chord()
  ambientTimer = setInterval(chord, 7000)
  sprinkle()
}

export function stopAmbient() {
  running = false
  clearInterval(ambientTimer)
  clearTimeout(noteTimer)
  if (ctx) {
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
    setTimeout(() => { if (!running) master.gain.value = 0.9 }, 800)
  }
}

export function initSound() {
  const toggles = [...document.querySelectorAll('[data-sound-toggle]')]
  const paint = () => toggles.forEach((b) => {
    b.setAttribute('aria-pressed', String(allowed()))
    b.classList.toggle('is-off', !allowed())
    b.classList.toggle('is-on', allowed())
    const l = b.querySelector('[data-sound-label]')
    if (l) l.textContent = allowed() ? 'sound on' : 'sound off'
  })
  paint()

  toggles.forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation()
    if (allowed()) { store('off'); stopAmbient() } else { store('on'); startAmbient(); sfx.pop() }
    paint()
  }))

  // first gesture unlocks audio and starts the ambient bed
  const unlock = () => { startAmbient(); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock) }
  addEventListener('pointerdown', unlock)
  addEventListener('keydown', unlock)

  // hover ticks on interactive things (throttled)
  let last = 0
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest?.('a, button, .card, .opt__pill')
    if (!t || t === document.__lastHover) return
    document.__lastHover = t
    const now = performance.now()
    if (now - last > 90) { last = now; sfx.hover() }
  })
  document.addEventListener('pointerout', () => { document.__lastHover = null })

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) ctx.suspend?.(); else if (running) ctx.resume?.()
  })
}
