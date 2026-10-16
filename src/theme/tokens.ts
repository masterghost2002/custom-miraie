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
    guideStrong: 'rgba(20,18,16,0.10)',
    beam: 'rgba(20,18,16,0.07)',
    wave: 'rgba(20,18,16,0.09)',
    shadow: 'rgb(60,40,20)',
    shadowOpacity: 0.07,
    /** --glass-shadow colour (0 10px 30px). */
    glassShadow: 'rgba(60,40,20,0.07)',
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
    guideStrong: 'rgba(255,255,255,0.10)',
    beam: 'rgba(255,255,255,0.07)',
    wave: 'rgba(255,255,255,0.07)',
    shadow: 'rgb(0,0,0)',
    shadowOpacity: 0.3,
    /** --glass-shadow colour (0 10px 30px). */
    glassShadow: 'rgba(0,0,0,0.3)',
  },
} as const;

export type ThemeTokens = (typeof themes)[ThemeName];

/** The AC unit's dead-front display glows the same orange in both themes. */
export const display = {
  glow: '#E8701F',
  dim: 'rgba(232,112,31,0.2)',
  /** Digit text glow (CSS text-shadow 0 0 8px). */
  glowShadow: 'rgba(232,112,31,0.3)',
  vent: '#2B2825',
  /** Vent blade inside the large (Climate) unit. */
  blade: '#8C857E',
  /** Swing flap on the Airflow side view. */
  flap: '#D8D4CE',
  ledOff: '#C9C5C0',
} as const;

/** Colours that are the same in both themes (see docs/design-map.md › Fixed). */
export const fixed = {
  white: '#FFFFFF',
  black: '#000000',
  /** Warm shadow colour of light-theme unit drawings. */
  warm: 'rgb(60,40,20)',
  /** Shadow under a running power knob / button (0 6px 16px). */
  powerShadow: 'rgba(232,112,31,0.35)',
  /** Outer shadow of the selected mode button (0 8px 20px). */
  modeShadow: 'rgba(232,112,31,0.22)',
  /** Toggle knob shadow (0 1px 3px). */
  knobShadow: 'rgba(0,0,0,0.25)',
  /** Slider marker shadow (0 3px 8px). */
  markerShadow: 'rgba(0,0,0,0.15)',
  /** Seam line and inset shading on the unit drawings. */
  seam: 'rgba(0,0,0,0.06)',
  insetSoft: 'rgba(0,0,0,0.05)',
  /** Unit drop shadows (language §7). */
  unitShadowStrong: 'rgba(0,0,0,0.28)',
  unitShadowMid: 'rgba(0,0,0,0.22)',
  unitShadowSoft: 'rgba(0,0,0,0.12)',
  warmShadow16: 'rgba(60,40,20,0.16)',
  warmShadow14: 'rgba(60,40,20,0.14)',
  warmShadow12: 'rgba(60,40,20,0.12)',
  warmShadow08: 'rgba(60,40,20,0.08)',
  flapShadow: 'rgba(0,0,0,0.3)',
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
