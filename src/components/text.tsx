import { StyleSheet, Text as RNText, type TextProps } from 'react-native';

import { useTheme } from '@/theme';

/** Manrope weights loaded in the root layout; Android needs a family per weight. */
export const Font = {
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

/** Type scale from DESIGN.md (sizes in sp, so the system font size setting applies). */
const variants = StyleSheet.create({
  display: { fontFamily: Font.bold, fontSize: 38, lineHeight: 39, letterSpacing: -1.3 },
  headline: { fontFamily: Font.extrabold, fontSize: 28, lineHeight: 30, letterSpacing: -0.85 },
  title: { fontFamily: Font.extrabold, fontSize: 22, lineHeight: 27, letterSpacing: -0.45 },
  task: { fontFamily: Font.semibold, fontSize: 20, lineHeight: 27, letterSpacing: -0.2 },
  body: { fontFamily: Font.medium, fontSize: 17, lineHeight: 25 },
  bodyStrong: { fontFamily: Font.semibold, fontSize: 17, lineHeight: 23 },
  label: { fontFamily: Font.bold, fontSize: 17, lineHeight: 21, letterSpacing: -0.17 },
  button: { fontFamily: Font.extrabold, fontSize: 17, lineHeight: 21 },
  small: { fontFamily: Font.bold, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: Font.bold, fontSize: 13, lineHeight: 17 },
  captionStrong: { fontFamily: Font.extrabold, fontSize: 13, lineHeight: 17 },
});

export type TextVariant = keyof typeof variants;

export function Text({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: TextProps & { variant?: TextVariant; muted?: boolean; color?: string }) {
  const c = useTheme();
  return (
    <RNText
      {...rest}
      style={[variants[variant], { color: color ?? (muted ? c.inkMuted : c.ink) }, style]}
    />
  );
}
