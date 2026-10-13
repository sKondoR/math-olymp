import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Palettes, type Palette } from '@/constants/tokens';
import { useSettings } from '@/state/store';

/** Colours of the theme chosen in the menu. */
export function useTheme(): Palette {
  return Palettes[useSettings().settings.theme];
}

/** Root view in the page colour of the chosen theme. */
export function ThemeRoot({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, backgroundColor: useTheme().page }}>{children}</View>;
}

/** `#rrggbb` + alpha 0–1 → `#rrggbbaa`. */
export function alpha(hex: string, a: number) {
  return (
    hex.slice(0, 7) +
    Math.round(a * 255)
      .toString(16)
      .padStart(2, '0')
  );
}

/** The press feedback of tappable cards and buttons: a slight shrink. */
export const pressedScale = (pressed: boolean, scale = 0.98) =>
  pressed ? { transform: [{ scale }] } : null;
