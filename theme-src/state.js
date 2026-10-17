// tiny shared state between UI, scroll and WebGL modules
export const state = {
  pointer: { x: 0, y: 0 }, // -0.5 .. 0.5
  sceneActive: true, // false when the 3D hero has scrolled out of view (skips rendering)
}
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
export const isMobile = () => matchMedia('(max-width: 800px)').matches
