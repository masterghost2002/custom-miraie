// Design: design/boards/Climate.dc.html — "Auto" mode glyph (circle with an A), not in Lucide
import Svg, { Circle, Path } from 'react-native-svg';

export type AutoModeIconProps = { size?: number; color: string; strokeWidth?: number };

export function AutoModeIcon({ size = 20, color, strokeWidth = 1.9 }: AutoModeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={12} r={9} />
      <Path d="M8.5 16 12 7.5 15.5 16" />
      <Path d="M9.8 13h4.4" />
    </Svg>
  );
}
