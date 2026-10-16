---
name: ui-primitives
description: Use when styling anything in Chill or creating/changing a src/ui primitive — tokens and NativeWind classes, useTheme() raw values, Glass (expo-glass-effect with frosted fallback), Text variants, reanimated motion, accessibility. Forbids raw hex/rgb outside src/theme/tokens.ts, arbitrary [..px] classes, StyleSheet colour literals, gradients, and animations that ignore reduced motion.
---

# UI primitives and styling

## Tokens and classes

- `src/theme/tokens.ts` holds every raw colour, for both themes (`themes.dark` is the default,
  `themes.light` optional) plus the fixed AC display colours (`display.glow`, `display.dim`,
  `display.vent`, `display.ledOff`). It is the only file allowed raw values
  (`check:style-policy`).
- `<ThemeProvider>` (`src/theme/theme-provider.tsx`) sets them as CSS variables; classes in
  `tailwind.config.js` read the variables:
  - colours (as `bg-*`, `text-*`, `border-*`): `ground` `ink` `muted` `track` `glass`
    `glass-line` `pill` `field-line` `sel-bg` `sel-ink` `accent` `on-accent` `mode-sel` `unit`
    `slot` `tick`
  - radii: `rounded-chip` (18) `rounded-tile` (26) `rounded-card` (28) `rounded-panel` (30)
    `rounded-dock` (34) `rounded-full`
  - extra spacing: `13` (52) `15` (60) `17` (68) `18` (72) `19` (76) `21` (84) `30` (120)
    `42` (168) `59` (236)
- Raw values where classes can't reach (SVG `stroke`, shadow colour, glass `tintColor`,
  reanimated `interpolateColor`): `const { tokens } = useTheme()`.
- Missing a value? Add it to tokens + tailwind config + `docs/design-map.md` in CHILL-003 —
  never inline it.

## Text

Use the `Text` primitive with a variant; never set `fontFamily` or size by hand.
Plus Jakarta Sans needs one family per weight:

- weights: `font-light` (300) `font-regular` (400) `font-medium` (500) `font-semibold` (600)
  `font-bold` (700)
- sizes: `text-micro` (11) `text-caption` (12) `text-support` (13) `text-chip` (14)
  `text-body` (15) `text-card` (16) `text-header` (17) `text-title` (30) `text-hero` (40)
  `text-degree` (40) `text-degree-sm` (28) `text-reading-sm` (64) `text-reading` (96)

Readings (temperatures) are light 300 with tight tracking and `fontVariant: ['tabular-nums']`.

## Glass

`Glass` is the one surface for cards, the tab bar and round icon buttons:

- iOS 26+ (`isLiquidGlassAvailable() && isGlassEffectAPIAvailable()` from `expo-glass-effect`):
  `<GlassView glassEffectStyle="regular" colorScheme={themeName} />` with the card's radius;
  `isInteractive` only on pressable glass.
- Otherwise (older iOS, web preview): a `View` with `bg-glass border border-glass-line`, the
  board's shadow (`0 10px 30px` → `shadowOffset {0,10}`, `shadowRadius 15`, colour/opacity from
  tokens).
- Reduce Transparency on (`AccessibilityInfo.isReduceTransparencyEnabled()`): use the fallback.
- Glass needs something behind it: screens render `Breeze` (and air particles) under the content.

## Motion

- reanimated 4 shared values and `withTiming` / `withRepeat`; never `setInterval` + state.
- Easings from the boards: sliding selection pill `.45s cubic-bezier(.2,.8,.2,1)`; toggle and
  power knob `.35s/.45s cubic-bezier(.3,1.3,.5,1)`; display fade-in `.6s ease-out`; breeze lines
  70 s / 110 s linear loops; particles 1.7–6 s depending on fan speed.
- `useReducedMotion()` → stop breeze, particles, sweeps and spins; keep state changes instant.

## Accessibility

- Real roles: `accessibilityRole="button" | "switch" | "adjustable" | "tab"`; state via
  `accessibilityState={{ selected, checked, disabled }}`; icon-only buttons get
  `accessibilityLabel` (take the board's `aria-label`).
- Touch targets ≥ 44pt (the boards use 44–56).
- Decorative SVG/illustration (`AcUnit`, `Breeze`, particles): `accessible={false}` /
  `importantForAccessibility="no-hide-descendants"`.
- Text contrast 4.5:1; `text-muted` on glass passes in both themes — don't go lighter.

## Don't

- No gradients, glows, colour blobs or extra accents. Orange marks only power and the active
  choice (slider fill, selected mode ring, running power button).
- No `StyleSheet` colour literals, no `style={{ color: '#…' }}`.
