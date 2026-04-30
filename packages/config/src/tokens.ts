/**
 * Rally design tokens — TypeScript
 *
 * Use these in contexts where CSS variables aren't available:
 * - Recharts / D3 chart colors
 * - Canvas drawing
 * - React Native (Phase 2)
 * - Programmatic style logic
 *
 * For all regular React/Next.js component styling, use Tailwind
 * classes or CSS variables from globals.css instead.
 */

// ─────────────────────────────────────────────────────────────────────────────
// RAW RAMPS
// ─────────────────────────────────────────────────────────────────────────────

export const violet = {
  50:  '#EEEDFE',
  100: '#CECBF6',
  200: '#AFA9EC',
  400: '#7F77DD',
  600: '#534AB7',
  800: '#3C3489',
  900: '#26215C',
} as const

export const teal = {
  50:  '#E1F5EE',
  100: '#9FE1CB',
  200: '#5DCAA5',
  400: '#1D9E75',
  600: '#0F6E56',
  800: '#085041',
  900: '#04342C',
} as const

export const coral = {
  50:  '#FAECE7',
  100: '#F5C4B3',
  200: '#F0997B',
  400: '#D85A30',
  600: '#993C1D',
  800: '#712B13',
  900: '#4A1B0C',
} as const

export const sand = {
  50:  '#F1EFE8',
  100: '#D3D1C7',
  200: '#B4B2A9',
  400: '#888780',
  600: '#5F5E5A',
  800: '#444441',
  900: '#2C2C2A',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SEMANTIC TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  /**
   * Primary (violet) — brand identity, CTAs, active states,
   * best open windows, sent chat messages
   */
  primary: {
    DEFAULT: violet[400],
    surface: violet[50],
    border:  violet[200],
    text:    violet[800],
    muted:   violet[600],
    deep:    violet[900],
  },

  /**
   * Signal (teal) — open windows, free availability blocks,
   * "go" states, system messages about found windows.
   * Only ever means "something is available".
   */
  signal: {
    DEFAULT: teal[400],
    surface: teal[50],
    border:  teal[100],
    text:    teal[800],
  },

  /**
   * Conflict (coral) — busy blocks, scheduling conflicts,
   * destructive actions, error states.
   * Used sparingly — its rarity is what gives it signal strength.
   */
  conflict: {
    DEFAULT: coral[400],
    surface: coral[50],
    border:  coral[200],
    text:    coral[800],
  },

  /**
   * Neutral (sand) — structural chrome, secondary surfaces,
   * placeholder text, inactive states.
   */
  neutral: {
    DEFAULT: sand[400],
    surface: sand[50],
    border:  sand[100],
    text:    sand[800],
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// CHART COLORS
// Ordered by preference for sequential use in data visualisations
// ─────────────────────────────────────────────────────────────────────────────

export const chartColors = [
  violet[400],  // primary data series
  teal[400],    // secondary data series (availability/windows)
  sand[400],    // tertiary / neutral comparison
  coral[400],   // conflict / negative delta — use last
] as const

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR COLOR ROTATION
// Cycles through avatar background variants for member lists
// ─────────────────────────────────────────────────────────────────────────────

export const avatarPalette = [
  { bg: violet[50], text: violet[800] },
  { bg: teal[50],   text: teal[800]   },
  { bg: sand[50],   text: sand[800]   },
] as const

/**
 * Returns a deterministic avatar color for a given user ID or index.
 * Consistent across renders — same user always gets same color.
 */
export function avatarColor(seed: string | number) {
  const index =
    typeof seed === 'number'
      ? seed
      : seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return avatarPalette[index % avatarPalette.length]
}

// ─────────────────────────────────────────────────────────────────────────────
// WINDOW SCORE → COLOR MAPPING
// Maps open window quality tier to card color token
// ─────────────────────────────────────────────────────────────────────────────

export type WindowTier = 'best' | 'good' | 'partial'

export const windowColors: Record<WindowTier, {
  bg: string
  label: string
  labelText: string
  timeText: string
  metaText: string
}> = {
  best: {
    bg:        violet[400],
    label:     'Best match',
    labelText: teal[200],    // muted on violet bg
    timeText:  '#ffffff',
    metaText:  violet[200],
  },
  good: {
    bg:        teal[50],
    label:     'Good',
    labelText: teal[400],
    timeText:  teal[800],
    metaText:  teal[400],
  },
  partial: {
    bg:        '#ffffff',    // card background
    label:     'Partial',
    labelText: sand[400],
    timeText:  sand[900],
    metaText:  sand[400],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────────────────────────────────────

export const spacing = {
  cardX:    20,
  cardY:    16,
  cardSmX:  14,
  cardSmY:  12,
  avXs:     18,
  avSm:     24,
  avMd:     32,
  avLg:     40,
  btnH:     40,
  btnSmH:   32,
  inputH:   40,
  tabBarH:  56,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────────────────────────────────────

export const radius = {
  sm:   6,
  md:   8,
  lg:   12,
  xl:   16,
  full: 9999,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// TYPE SCALE (px values for RN / canvas)
// ─────────────────────────────────────────────────────────────────────────────

export const fontSize = {
  '2xs': 10,
  xs:    11,
  sm:    12,
  base:  13,
  md:    14,
  lg:    15,
  xl:    16,
  '2xl': 18,
  '3xl': 22,
} as const
