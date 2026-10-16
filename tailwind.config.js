// Tailwind for NativeWind v4. Colour values live in src/theme/tokens.ts and are
// injected as CSS variables by <ThemeProvider>; this file only maps class names
// to those variables. See docs/design-map.md for the design-name → class table.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  // Themes are CSS variables set by <ThemeProvider>, not dark: variants; 'class' stops
  // NativeWind on web from throwing when the colour scheme is set programmatically.
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ground: 'var(--bg)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        tick: 'var(--tick)',
        track: 'var(--track)',
        glass: 'var(--glass)',
        'glass-line': 'var(--glass-line)',
        pill: 'var(--pill)',
        'field-line': 'var(--field-line)',
        'sel-bg': 'var(--sel-bg)',
        'sel-ink': 'var(--sel-ink)',
        accent: 'var(--accent)',
        unit: 'var(--unit)',
        slot: 'var(--slot)',
        'on-accent': 'var(--on-accent)',
        'mode-sel': 'var(--mode-sel)',
      },
      fontFamily: {
        light: ['PlusJakartaSans_300Light'],
        regular: ['PlusJakartaSans_400Regular'],
        medium: ['PlusJakartaSans_500Medium'],
        semibold: ['PlusJakartaSans_600SemiBold'],
        bold: ['PlusJakartaSans_700Bold'],
      },
      fontSize: {
        // name: [size, { lineHeight, letterSpacing }] — from the canvas Style board
        micro: ['11px', { lineHeight: '14px' }],
        caption: ['12px', { lineHeight: '17px' }],
        support: ['13px', { lineHeight: '18px' }],
        chip: ['14px', { lineHeight: '19px' }],
        body: ['15px', { lineHeight: '21px' }],
        card: ['16px', { lineHeight: '21px' }],
        header: ['17px', { lineHeight: '22px', letterSpacing: '-0.17px' }],
        title: ['30px', { lineHeight: '35px', letterSpacing: '-0.9px' }],
        hero: ['40px', { lineHeight: '45px', letterSpacing: '-1.6px' }],
        degree: ['40px', { lineHeight: '40px' }],
        'degree-sm': ['28px', { lineHeight: '28px' }],
        'reading-sm': ['64px', { lineHeight: '64px', letterSpacing: '-3.2px' }],
        reading: ['96px', { lineHeight: '96px', letterSpacing: '-4.8px' }],
        // AC dead-front display digits (line height 1)
        'display-sm': ['11px', { lineHeight: '11px' }],
        'display-md': ['15px', { lineHeight: '15px' }],
        'display-lg': ['17px', { lineHeight: '17px', letterSpacing: '0.17px' }],
        // Sign-in body (line height 1.5) and secure-storage note (1.45)
        intro: ['15px', { lineHeight: '22.5px' }],
        note: ['12px', { lineHeight: '17.4px' }],
      },
      spacing: {
        4.5: '18px',
        5.5: '22px',
        6.5: '26px',
        13: '52px',
        15: '60px',
        17: '68px',
        18: '72px',
        19: '76px',
        21: '84px',
        30: '120px',
        42: '168px',
        47.5: '190px',
        59: '236px',
        70: '280px',
      },
      borderRadius: {
        chip: '18px',
        'tile-sm': '22px',
        tile: '26px',
        card: '28px',
        panel: '30px',
        dock: '34px',
      },
    },
  },
  plugins: [
    // Web preview only: the frosted fallback's blur (language §5). Native ignores it.
    ({ addUtilities }) =>
      addUtilities({
        '.backdrop-glass': {
          'backdrop-filter': 'blur(22px) saturate(140%)',
          '-webkit-backdrop-filter': 'blur(22px) saturate(140%)',
        },
        '.backdrop-pill': {
          'backdrop-filter': 'blur(22px)',
          '-webkit-backdrop-filter': 'blur(22px)',
        },
      }),
  ],
};
