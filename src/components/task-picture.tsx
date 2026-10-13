import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { topicFamily, type TopicFamily } from '@/data/groups';
import type { Task } from '@/data/types';
import { useLocalize } from '@/i18n';
import { useTheme } from '@/theme';

import { Icon, type IconName } from './icon';

export const FamilyIcon: Record<TopicFamily, IconName> = {
  count: 'calculate',
  logic: 'lightbulb',
  shape: 'category',
  pattern: 'route',
  time: 'schedule',
};

/**
 * The task picture, always whole (contain): it carries the data of the task.
 * Without a picture — the glyph of the task's topic.
 */
export function TaskPicture({
  task,
  inset = 10,
  glyphSize = 48,
  label,
  style,
}: {
  task: Task;
  inset?: number;
  glyphSize?: number;
  /** spoken label; decorative when absent */
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  const localize = useLocalize();
  return (
    <View style={[styles.box, style]}>
      {task.image ? (
        <Image
          source={localize(task.image)}
          contentFit="contain"
          style={[StyleSheet.absoluteFill, { margin: inset }]}
          accessible={!!label}
          accessibilityLabel={label}
          transition={120}
        />
      ) : (
        <Icon name={FamilyIcon[topicFamily(task.topics)]} size={glyphSize} color={c.deep} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
