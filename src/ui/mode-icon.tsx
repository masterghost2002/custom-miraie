// Design: design/boards/Climate.dc.html — mode glyphs: snowflake, droplet, fan, sun, circle-A
import { Droplet, Fan, Snowflake, Sun } from 'lucide-react-native';

import { AutoModeIcon } from './icons/auto-mode';

export type AcModeName = 'cool' | 'dry' | 'fan' | 'heat' | 'auto';

const lucide = { cool: Snowflake, dry: Droplet, fan: Fan, heat: Sun } as const;

export type ModeIconProps = {
  mode: AcModeName;
  size?: number;
  color: string;
  strokeWidth?: number;
};

export function ModeIcon({ mode, size = 20, color, strokeWidth = 1.9 }: ModeIconProps) {
  if (mode === 'auto') return <AutoModeIcon size={size} color={color} strokeWidth={strokeWidth} />;
  const Icon = lucide[mode];
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
