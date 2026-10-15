import { Text, type StyleProp, type TextStyle } from 'react-native';

/**
 * Material Symbols glyphs used in the app (codepoints from the Material Symbols font).
 * Fonts are loaded in the root layout: `MaterialSymbols` (outlined) and `MaterialSymbolsFilled`.
 */
const GLYPHS = {
  check: 58826,
  arrow_forward: 58824,
  arrow_back: 58820,
  menu_book: 59929,
  menu: 58834,
  close: 58829,
  backspace: 57674,
  lightbulb: 57584,
  calculate: 59999,
  category: 58740,
  route: 60109,
  schedule: 59573,
  bar_chart: 57963,
  chevron_right: 58828,
  restart_alt: 61523,
  workspace_premium: 59311,
  check_circle: 59500,
  radio_button_unchecked: 59446,
  replay: 57410,
  touch_app: 59667,
  expand_more: 58831,
  expand_less: 58830,
  star: 59448,
  lock: 59543,
  smart_display: 61546,
} as const;

export type IconName = keyof typeof GLYPHS;

export function Icon({
  name,
  size = 24,
  color,
  filled,
  style,
}: {
  name: IconName;
  size?: number;
  color: string;
  filled?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      accessible={false}
      importantForAccessibility="no"
      allowFontScaling={false}
      style={[
        {
          fontFamily: filled ? 'MaterialSymbolsFilled' : 'MaterialSymbols',
          fontSize: size,
          lineHeight: size,
          width: size,
          height: size,
          textAlign: 'center',
          color,
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {String.fromCharCode(GLYPHS[name])}
    </Text>
  );
}
