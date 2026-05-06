// lib/sounds.ts
// All sounds generated via Web Audio API — no audio file dependencies.

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  return ctx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.18,
  startTime?: number
) {
  const ac = getCtx()
  if (!ac) return

  const osc  = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)

  const t = startTime ?? ac.currentTime
  osc.type = type
  osc.frequency.setValueAtTime(frequency, t)

  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(gainPeak, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)

  osc.start(t)
  osc.stop(t + duration + 0.02)
}

/** Short soft pop — new chat message */
export function playMessagePop() {
  const ac = getCtx()
  if (!ac) return
  playTone(660, 0.09, 'sine', 0.12)
}

/** Two-note ascending chime — new plan card in group */
export function playPlanChime() {
  const ac = getCtx()
  if (!ac) return
  const t = ac.currentTime
  playTone(523, 0.18, 'sine', 0.14, t)         // C5
  playTone(659, 0.22, 'sine', 0.14, t + 0.14)  // E5
}

/** Three-note success sequence — plan locked in */
export function playLockInSuccess() {
  const ac = getCtx()
  if (!ac) return
  const t = ac.currentTime
  playTone(523, 0.16, 'sine', 0.15, t)          // C5
  playTone(659, 0.16, 'sine', 0.15, t + 0.14)   // E5
  playTone(784, 0.26, 'sine', 0.18, t + 0.28)   // G5
}

/** Warm single tone — generic notification */
export function playNotificationTone() {
  const ac = getCtx()
  if (!ac) return
  playTone(587, 0.15, 'sine', 0.14)             // D5
}
