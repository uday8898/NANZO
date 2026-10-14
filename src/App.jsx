import { useEffect, useRef, useState } from 'react'
import Scene from './Scene.jsx'

const pad = (n) => String(n).padStart(2, '0')
const secondsLeft = (end) => Math.floor(Math.max(0, end - Date.now()) / 1000)
const mask = (name) => ({ '--src': `url(/logos/${name}.png)` })

// back-to-front layers give the logo a chunky candy-extrude look
const LAYERS = [
  { z: -60, c: '#c7869a' },
  { z: -45, c: '#f4739a' },
  { z: -30, c: '#483432' },
  { z: -15, c: '#d9e8e0' },
  { z: 0, c: '#fffaf0' },
]
const HEARTS = ['♡', '✧', '❀', '✦', '♥']

// synthesized "bubble pop + music-box twinkle": no audio files needed
let audio
const TWINKLE = [1318.5, 1568, 1760, 2093, 2349.3] // high, bell-like pentatonic
function cuteSound() {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)()
    if (audio.state === 'suspended') audio.resume()
    const t = audio.currentTime
    const out = audio.createGain()
    out.gain.value = 0.9
    out.connect(audio.destination)

    // sweeping sine = the bubbly "pop"
    const pop = audio.createOscillator()
    const pg = audio.createGain()
    pop.frequency.setValueAtTime(380, t)
    pop.frequency.exponentialRampToValueAtTime(1500, t + 0.09)
    pg.gain.setValueAtTime(0.0001, t)
    pg.gain.exponentialRampToValueAtTime(0.22, t + 0.012)
    pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    pop.connect(pg).connect(out)
    pop.start(t)
    pop.stop(t + 0.15)

    // two quick music-box notes (fundamental + soft inharmonic partial)
    const i = Math.floor(Math.random() * (TWINKLE.length - 1))
    ;[TWINKLE[i], TWINKLE[i + 1]].forEach((f, n) => {
      const s = t + 0.07 + n * 0.09
      ;[[1, 0.12], [2.76, 0.035]].forEach(([mult, vol]) => {
        const o = audio.createOscillator()
        const g = audio.createGain()
        o.frequency.value = f * mult
        g.gain.setValueAtTime(0.0001, s)
        g.gain.exponentialRampToValueAtTime(vol, s + 0.008)
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.55)
        o.connect(g).connect(out)
        o.start(s)
        o.stop(s + 0.6)
      })
    })
  } catch { /* audio unavailable */ }
}

// launch: 25 November 2026, 00:00 in the visitor's local time
const LAUNCH = new Date(2026, 10, 25).getTime()

function useCountdown(end = LAUNCH) {
  const [left, setLeft] = useState(() => secondsLeft(end))
  useEffect(() => {
    const id = setInterval(() => setLeft(secondsLeft(end)), 1000)
    return () => clearInterval(id)
  }, [end])
  return [
    Math.floor(left / 86400),
    Math.floor((left % 86400) / 3600),
    Math.floor((left % 3600) / 60),
    left % 60,
  ]
}

export default function App() {
  const pointer = useRef({ x: 0, y: 0 })
  const stageRef = useRef(null)
  const [msg, setMsg] = useState('')
  const [d, h, m, s] = useCountdown()

  useEffect(() => {
    const move = (e) => {
      const nx = e.clientX / innerWidth - 0.5
      const ny = e.clientY / innerHeight - 0.5
      pointer.current = { x: nx, y: ny }
      stageRef.current.style.transform = `rotateY(${nx * 24}deg) rotateX(${-ny * 18}deg)`
    }
    // sprinkle little hearts wherever you click
    const click = (e) => {
      cuteSound()
      for (let i = 0; i < 7; i++) {
        const el = document.createElement('span')
        el.className = 'pop'
        el.textContent = HEARTS[i % HEARTS.length]
        el.style.left = e.clientX + 'px'
        el.style.top = e.clientY + 'px'
        el.style.color = ['#f4739a', '#fffaf0', '#483432'][i % 3]
        el.style.setProperty('--dx', (Math.random() - 0.5) * 160 + 'px')
        el.style.setProperty('--dy', -40 - Math.random() * 120 + 'px')
        el.style.setProperty('--r', (Math.random() - 0.5) * 120 + 'deg')
        document.body.appendChild(el)
        setTimeout(() => el.remove(), 1000)
      }
    }
    addEventListener('mousemove', move)
    addEventListener('click', click)
    return () => {
      removeEventListener('mousemove', move)
      removeEventListener('click', click)
    }
  }, [])

  const track = Array.from({ length: 16 }, (_, i) => (
    <span key={i} style={{ display: 'contents' }}>
      <span>nanzo</span>
      <i className="lg" style={mask('shell')} />
      <span>coming soon ♡</span>
      <i className="lg" style={mask('shell')} />
    </span>
  ))

  return (
    <>
      <Scene pointer={pointer} />

      <header>
        <i className="lg" style={mask('wordmark')} aria-label="nanzo" />
        <div className="pill"><i /> drop 001 · loading</div>
      </header>

      <main>
        <div className="stage" ref={stageRef}>
          <div className="logo3d" role="img" aria-label="nanzo">
            {LAYERS.map((l) => (
              <i key={l.z} className="lg" style={{ ...mask('logo-horizontal'), '--c': l.c, transform: `translateZ(${l.z}px)` }} />
            ))}
          </div>
          <div className="badge">coming soon · 25 Nov ♡</div>
          <p className="sub">cute fits, big feelings. something dreamy is washing ashore.</p>
          <div className="cd">
            {[[d, 'DAYS'], [h, 'HRS'], [m, 'MIN'], [s, 'SEC']].map(([v, l]) => (
              <div key={l}><b>{pad(v)}</b><small>{l}</small></div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setMsg("yay! you're on the list ♡")
              e.target.reset()
            }}
          >
            <input type="email" placeholder="your email, cutie" required />
            <button>Notify me ✧</button>
          </form>
          <div className="msg">{msg}</div>
        </div>
      </main>

      <div className="marq"><div className="track">{track}{track}</div></div>
    </>
  )
}
