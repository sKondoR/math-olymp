import { StyleSheet, View } from 'react-native';

import type { Task } from '@/data/types';
import { useStrings } from '@/i18n';
import { useTheme } from '@/theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

/** Difficulty as 1–3 stars a child reads without reading. */
export function Stars({ n, size = 16 }: { n: number; size?: number }) {
  const c = useTheme();
  return (
    <View style={styles.stars}>
      {[1, 2, 3].map((i) => (
        <Icon
          key={i}
          name="star"
          filled
          size={size}
          color={c.deep}
          style={i > n && { opacity: 0.25 }}
        />
      ))}
    </View>
  );
}

/** «3 балла» or, in the first grade, «лёгкая»; points stay a quiet word beside the stars. */
export function useWeightLabel() {
  const t = useStrings();
  return (task: Task) => (task.points ? t.points(task.points) : t.level[task.weight - 1]);
}

/** White pill with stars or a topic glyph. */
export function Chip({ stars, icon, label }: { stars?: number; icon?: IconName; label: string }) {
  const c = useTheme();
  return (
    <View style={styles.chip}>
      {stars ? <Stars n={stars} /> : null}
      {icon ? <Icon name={icon} size={18} color={c.deep} /> : null}
      <Text variant="captionStrong">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', gap: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 5,
    paddingLeft: 8,
    paddingRight: 11,
    borderRadius: 99,
    backgroundColor: '#ffffff',
  },
});
