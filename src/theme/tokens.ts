// Design: Chill canvas › Style.dc.html (.th-light / .th-dark custom properties).
// The ONLY file allowed to hold raw colour values (pnpm check:style-policy).

export type ThemeName = 'light' | 'dark';

export const themes = {
  light: {
    bg: '#E7E5E2',
    ink: '#141210',
    muted: '#5E5A56',
    tick: 'rgba(20,18,16,0.22)',
    track: 'rgba(20,18,16,0.07)',
    glass: 'rgba(255,255,255,0.58)',
    glassLine: 'rgba(255,255,255,0.85)',
    pill: '#FFFFFF',
    fieldLine: 'rgba(20,18,16,0.08)',
    selBg: '#141210',
    selInk: '#FFFFFF',
    accent: '#E8701F',
    onAccent: '#FFFFFF',
    modeSel: '#FFFFFF',
    unit: '#F7F6F4',
    slot: '#1C1A18',
    particle: 'rgba(20,18,16,0.45)',
    guide: 'rgba(20,18,16,0.06)',
    wave: 'rgba(20,18,16,0.09)',
    shadow: 'rgb(60,40,20)',
    shadowOpacity: 0.07,
  },
  dark: {
    bg: '#151413',
    ink: '#F3F1EE',
    muted: '#A39E98',
    tick: 'rgba(255,255,255,0.22)',
    track: 'rgba(255,255,255,0.08)',
    glass: 'rgba(48,46,44,0.55)',
    glassLine: 'rgba(255,255,255,0.08)',
    pill: 'rgba(255,255,255,0.10)',
    fieldLine: 'rgba(255,255,255,0.10)',
    selBg: '#F3F1EE',
    selInk: '#151413',
    accent: '#F07A2A',
    onAccent: '#FFFFFF',
    modeSel: '#2A2826',
    unit: '#F2F1EF',
    slot: '#1C1A18',
    particle: 'rgba(255,255,255,0.5)',
    guide: 'rgba(255,255,255,0.06)',
    wave: 'rgba(255,255,255,0.07)',
    shadow: 'rgb(0,0,0)',
    shadowOpacity: 0.3,
  },
} as const;

export type ThemeTokens = (typeof themes)[ThemeName];

/** The AC unit's dead-front display glows the same orange in both themes. */
export const display = {
  glow: '#E8701F',
  dim: 'rgba(232,112,31,0.2)',
  vent: '#2B2825',
  ledOff: '#C9C5C0',
} as const;

/** CSS variables consumed by tailwind.config.js colour names. */
export function cssVars(t: ThemeTokens): Record<`--${string}`, string> {
  return {
    '--bg': t.bg,
    '--ink': t.ink,
    '--muted': t.muted,
    '--tick': t.tick,
    '--track': t.track,
    '--glass': t.glass,
    '--glass-line': t.glassLine,
    '--pill': t.pill,
    '--field-line': t.fieldLine,
    '--sel-bg': t.selBg,
    '--sel-ink': t.selInk,
    '--accent': t.accent,
    '--on-accent': t.onAccent,
    '--mode-sel': t.modeSel,
    '--unit': t.unit,
    '--slot': t.slot,
  };
}
