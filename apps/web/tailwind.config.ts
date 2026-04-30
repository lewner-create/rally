import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─────────────────────────────────────────────
      // COLOR SYSTEM
      // Raw ramps: violet, teal, coral, sand
      // Semantic aliases: primary, signal, conflict, neutral
      // Rule: use semantic aliases in components, raw ramps only in this file
      // ─────────────────────────────────────────────
      colors: {

        // Violet — brand identity, CTAs, active nav, best windows, sent messages
        violet: {
          50:  '#EEEDFE',  // surfaces: active nav bg, boost prompt bg, badge bg
          100: '#CECBF6',  // light fills
          200: '#AFA9EC',  // borders, avatar borders on violet bg, muted text on violet
          400: '#7F77DD',  // PRIMARY — buttons, icons, logo
          600: '#534AB7',  // body text on violet surfaces
          800: '#3C3489',  // title text on violet surfaces, admin badge text
          900: '#26215C',  // deepest — rarely used
        },

        // Teal — opportunity signal, open windows, free blocks, system messages
        teal: {
          50:  '#E1F5EE',  // good-window card bg, free-block bg, system message bg
          100: '#9FE1CB',  // borders on teal surfaces
          200: '#5DCAA5',  // mid fill
          400: '#1D9E75',  // signal green — icon stroke, badge bg
          600: '#0F6E56',  // stronger stroke
          800: '#085041',  // text on teal surfaces
          900: '#04342C',  // deepest teal
        },

        // Coral — conflict only: busy blocks, destructive actions, error states
        coral: {
          50:  '#FAECE7',  // busy-block bg, error input ring, danger button bg
          100: '#F5C4B3',  // light fill
          200: '#F0997B',  // danger button border
          400: '#D85A30',  // conflict stroke, error border
          600: '#993C1D',  // stronger
          800: '#712B13',  // text on coral surfaces
          900: '#4A1B0C',  // deepest coral
        },

        // Sand — structural chrome, neutral backgrounds, secondary surfaces
        sand: {
          50:  '#F1EFE8',  // page background (light mode)
          100: '#D3D1C7',  // borders, dividers
          200: '#B4B2A9',  // muted borders
          400: '#888780',  // placeholder text, tertiary icons
          600: '#5F5E5A',  // secondary text
          800: '#444441',  // primary text on sand surfaces
          900: '#2C2C2A',  // near-black for dark mode surfaces
        },

        // ── Semantic aliases ─────────────────────────────────────────────────
        // These are what component code should reference. Rename-safe.

        primary: {
          DEFAULT: '#7F77DD',  // violet-400 — use for bg on filled elements
          surface: '#EEEDFE',  // violet-50  — use for bg on tinted elements
          border:  '#AFA9EC',  // violet-200 — use for borders on tinted elements
          text:    '#3C3489',  // violet-800 — use for text on tinted elements
          muted:   '#534AB7',  // violet-600 — use for body text on violet bg
          deep:    '#26215C',  // violet-900
        },

        signal: {
          DEFAULT: '#1D9E75',  // teal-400
          surface: '#E1F5EE',  // teal-50
          border:  '#9FE1CB',  // teal-100
          text:    '#085041',  // teal-800
        },

        conflict: {
          DEFAULT: '#D85A30',  // coral-400
          surface: '#FAECE7',  // coral-50
          border:  '#F0997B',  // coral-200
          text:    '#712B13',  // coral-800
        },

        neutral: {
          DEFAULT: '#888780',  // sand-400
          surface: '#F1EFE8',  // sand-50  — page bg in light mode
          border:  '#D3D1C7',  // sand-100
          text:    '#444441',  // sand-800
        },
      },

      // ─────────────────────────────────────────────
      // BORDER RADIUS
      // ─────────────────────────────────────────────
      borderRadius: {
        // Override Tailwind defaults with Rally scale
        none: '0',
        sm:   '6px',   // small buttons, badges, inner chips
        md:   '8px',   // inputs, buttons, tooltips, small cards
        lg:   '12px',  // cards, panels, window cards — DEFAULT for cards
        xl:   '16px',  // modals, bottom sheets, phone frames
        '2xl':'24px',  // large decorative surfaces
        full: '9999px', // pills, avatars
      },

      // ─────────────────────────────────────────────
      // BOX SHADOW — focus rings only
      // No decorative shadows in Rally
      // ─────────────────────────────────────────────
      boxShadow: {
        none:             'none',
        'focus-primary':  '0 0 0 3px #EEEDFE',  // violet focus ring
        'focus-signal':   '0 0 0 3px #E1F5EE',  // teal focus ring
        'focus-conflict': '0 0 0 3px #FAECE7',  // coral focus ring (errors)
      },

      // ─────────────────────────────────────────────
      // TYPOGRAPHY
      // ─────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },

      fontSize: {
        // Rally type scale — tighter than Tailwind default
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.01em' }],
        xs:    ['11px', { lineHeight: '16px' }],
        sm:    ['12px', { lineHeight: '18px' }],
        base:  ['13px', { lineHeight: '20px' }],
        md:    ['14px', { lineHeight: '22px' }],
        lg:    ['15px', { lineHeight: '24px' }],
        xl:    ['16px', { lineHeight: '26px' }],
        '2xl': ['18px', { lineHeight: '28px' }],
        '3xl': ['22px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        // No 600 or 700 — they read heavy next to the UI chrome
      },

      // ─────────────────────────────────────────────
      // COMPONENT SIZE CONSTANTS
      // ─────────────────────────────────────────────
      height: {
        'btn':       '40px',  // primary / secondary buttons
        'btn-sm':    '32px',  // small buttons, inline actions
        'input':     '40px',  // all text inputs and selects
        'badge':     '22px',  // status badges
        'badge-lg':  '26px',  // type-selector pills
        'tab-bar':   '56px',  // mobile bottom tab bar
        'nav-item':  '36px',  // sidebar nav item
      },

      width: {
        'btn-icon':    '40px',
        'btn-icon-sm': '32px',
      },

      // ─────────────────────────────────────────────
      // SPACING ALIASES
      // ─────────────────────────────────────────────
      spacing: {
        // Card padding
        'card-x':    '20px',
        'card-y':    '16px',
        'card-sm-x': '14px',
        'card-sm-y': '12px',
        // Avatar sizes
        'av-xs': '18px',
        'av-sm': '24px',
        'av-md': '32px',
        'av-lg': '40px',
      },

      // ─────────────────────────────────────────────
      // ANIMATIONS
      // ─────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.15s ease-out',
        'slide-up':   'slide-up 0.2s ease-out',
        'slide-down': 'slide-down 0.15s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
