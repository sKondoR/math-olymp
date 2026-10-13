import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStrings } from '@/i18n';
import { alpha, useTheme } from '@/theme';

import { IconButton } from './buttons';
import { Text } from './text';

/** Top bar: «←», title, something on the right (progress or tries). */
export function AppBar({
  title,
  right,
  onBack,
}: {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const c = useTheme();
  const t = useStrings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={[styles.bar, { paddingTop: insets.top, backgroundColor: alpha(c.page, 0.94) }]}>
      <View style={styles.row}>
        <IconButton icon="arrow_back" label={t.back} onPress={back} />
        <Text variant="title" style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 4, zIndex: 10 },
  row: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { flex: 1 },
});
