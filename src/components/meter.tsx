import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useStrings } from '@/i18n';
import { alpha, useTheme } from '@/theme';

import { Text } from './text';

/** Progress track with «N из M». */
export function Meter({
  value,
  total,
  style,
}: {
  value: number;
  total: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useStrings();
  return (
    <View
      style={[styles.row, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t.solvedOf(value, total)}
      accessibilityValue={{ min: 0, max: total, now: value }}
    >
      <Track value={value} total={total} />
      <Text variant="caption" muted>
        {t.ofTotal(value, total)}
      </Text>
    </View>
  );
}

export function Track({ value, total }: { value: number; total: number }) {
  const c = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: alpha(c.ink, 0.12) }]}>
      <View
        style={[
          styles.fill,
          { backgroundColor: c.progress, width: `${total ? (value / total) * 100 : 0}%` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
