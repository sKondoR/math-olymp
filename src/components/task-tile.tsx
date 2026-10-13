import { Pressable, StyleSheet, View } from 'react-native';

import type { Task } from '@/data/types';
import { useStrings } from '@/i18n';
import type { TaskState } from '@/state/progress';
import { pressedScale, useTheme } from '@/theme';

import { useWeightLabel } from './difficulty';
import { Icon } from './icon';
import { TaskPicture } from './task-picture';
import { Text } from './text';

/**
 * Square tile of the task grid. States are marked by shape, not colour only:
 * solved — filled check, next — arrow badge + thick ring, closed unsolved — outlined book.
 */
export function TaskTile({
  task,
  state,
  onPress,
}: {
  task: Task;
  state: TaskState;
  onPress: () => void;
}) {
  const c = useTheme();
  const t = useStrings();
  const weight = useWeightLabel();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t.task(task.number)}, ${weight(task)}, ${t.tileState[state]}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: task.image ? (state === 'solved' ? '#ffffff' : c.pearl) : c.tileEmpty,
          borderColor: c.hairline,
        },
        state === 'next' && { borderWidth: 3, borderColor: c.progress },
        pressedScale(pressed, 0.96),
      ]}
    >
      <TaskPicture task={task} inset={8} glyphSize={36} style={styles.pic} />
      <View style={styles.no}>
        <Text variant="captionStrong" color={c.ink}>
          № {task.number}
        </Text>
      </View>
      {state === 'solved' && (
        <View style={[styles.badge, styles.right, { backgroundColor: c.progress }]}>
          <Icon name="check" size={18} color={c.onDark} />
        </View>
      )}
      {state === 'next' && (
        <View style={[styles.badge, styles.left, { backgroundColor: c.action }]}>
          <Icon name="arrow_forward" size={18} color={c.onAction} />
        </View>
      )}
      {state === 'failed' && (
        <View
          style={[
            styles.badge,
            styles.left,
            { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: c.deep },
          ]}
        >
          <Icon name="menu_book" size={16} color={c.deep} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pic: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 24 },
  no: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    backgroundColor: '#ffffff',
  },
  badge: {
    position: 'absolute',
    top: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: { right: 6 },
  left: { left: 6 },
});
