// Helpers for tests of decorative drawings (AC unit, particles, icons). Those views are hidden
// from VoiceOver on purpose, so tests can't find them by role or label; instead they inspect the
// host tree the real components render. See .claude/skills/honest-tests (decorative drawings).
import { screen } from '@testing-library/react-native';

type Node = ReturnType<typeof screen.container.queryAll>[number];

/** Host views driven by Reanimated, optionally filtered by an animated style key they carry. */
export function animatedViews(key?: string): Node[] {
  return screen.container.queryAll((n) => {
    const value = n.props.jestAnimatedStyle?.value;
    return n.type === 'View' && value !== undefined && (key === undefined || key in value);
  });
}

/** The current animated style of a host view. */
export function animatedStyle(node: Node | undefined): Record<string, unknown> {
  return { ...(node?.props.jestAnimatedStyle?.value ?? {}) };
}

/** Every SVG path drawn on screen (`d` attributes), in order. */
export function drawnPaths(): string[] {
  return screen.container
    .queryAll((n) => typeof n.props.d === 'string')
    .map((n) => n.props.d as string);
}

/** The path data of a Lucide icon, e.g. lucidePaths('snowflake'). */
export function lucidePaths(name: string): string[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const icon = require(`lucide-react-native/icons/${name}`) as {
    __iconData: { node: [string, { d?: string }][] };
  };
  return icon.__iconData.node.map(([, attrs]) => attrs.d).filter((d): d is string => !!d);
}

/** Host views whose own style sets the given width and height. */
export function viewsSized(width: number, height: number): Node[] {
  return screen.container.queryAll((n) => {
    if (n.type !== 'View') return false;
    const flat = [n.props.style].flat(Infinity).filter(Boolean) as Record<string, unknown>[];
    const merged = Object.assign({}, ...flat);
    return merged.width === width && merged.height === height;
  });
}
