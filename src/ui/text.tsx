// Design: design/boards/Style.dc.html — type scale (Plus Jakarta Sans, docs/design/language.md §2)
import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

const sizes = {
  reading: 'text-reading',
  'reading-sm': 'text-reading-sm',
  degree: 'text-degree',
  'degree-sm': 'text-degree-sm',
  hero: 'text-hero',
  title: 'text-title',
  header: 'text-header',
  card: 'text-card',
  body: 'text-body',
  intro: 'text-intro',
  chip: 'text-chip',
  support: 'text-support',
  caption: 'text-caption',
  note: 'text-note',
  micro: 'text-micro',
  'display-sm': 'text-display-sm',
  'display-md': 'text-display-md',
  'display-lg': 'text-display-lg',
} as const;

export type TextVariant = keyof typeof sizes;

const weights = {
  light: 'font-light',
  regular: 'font-regular',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

export type TextWeight = keyof typeof weights;

/** Weight each role uses on the boards unless a screen says otherwise. */
const defaultWeight: Record<TextVariant, TextWeight> = {
  reading: 'light',
  'reading-sm': 'light',
  degree: 'light',
  'degree-sm': 'light',
  hero: 'regular',
  title: 'bold',
  header: 'semibold',
  card: 'semibold',
  body: 'regular',
  intro: 'regular',
  chip: 'semibold',
  support: 'regular',
  caption: 'regular',
  note: 'regular',
  micro: 'regular',
  'display-sm': 'medium',
  'display-md': 'medium',
  'display-lg': 'medium',
};

const tones = {
  ink: 'text-ink',
  muted: 'text-muted',
  'sel-ink': 'text-sel-ink',
  accent: 'text-accent',
  'on-accent': 'text-on-accent',
} as const;

export type TextTone = keyof typeof tones;

const numeric = new Set<TextVariant>([
  'reading',
  'reading-sm',
  'degree',
  'degree-sm',
  'display-sm',
  'display-md',
  'display-lg',
]);

export type TextProps = NativeTextProps & {
  variant?: TextVariant;
  weight?: TextWeight;
  tone?: TextTone;
  className?: string;
};

/** The only way screens set type: a role from the Style board, never a raw size or family. */
export function Text({
  variant = 'body',
  weight,
  tone = 'ink',
  className,
  style,
  ...rest
}: TextProps) {
  return (
    <NativeText
      {...rest}
      className={[sizes[variant], weights[weight ?? defaultWeight[variant]], tones[tone], className]
        .filter(Boolean)
        .join(' ')}
      style={numeric.has(variant) ? [{ fontVariant: ['tabular-nums'] }, style] : style}
    />
  );
}
