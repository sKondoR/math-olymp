import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { GradeKey } from '@/data/types';
import { useStrings } from '@/i18n';
import { useNav } from '@/navigation';
import type { NextPortion } from '@/state/summary';
import { usePortion } from '@/state/use-portion';
import { useTheme } from '@/theme';

import { PrimaryButton } from './buttons';
import { Icon } from './icon';
import { useSnackbar } from './overlays';
import { Text } from './text';

/**
 * Opening the next portion of an age group from a screen: shows the ad, says how it went and,
 * once the portion is open, goes to its first task — or runs `onOpened` instead.
 */
export function useWatchForPortion(grade: GradeKey) {
  const t = useStrings();
  const snack = useSnackbar();
  const nav = useNav();
  const { watching, watch } = usePortion(grade);

  const watchFor = async (portion: NextPortion, onOpened?: () => void) => {
    const result = await watch();
    if (result === 'opened') {
      snack(t.portionOpened(portion));
      (onOpened ?? (() => nav.openTask(portion.first)))();
    } else if (result === 'offline') snack(t.adOffline);
    else if (result === 'dismissed') snack(t.adDismissed);
  };

  return { watching, watchFor };
}

/**
 * The next portion as a card: which tasks, that an ad opens them, «Смотреть рекламу». The ad
 * starts only from this button, never by itself.
 */
export function PortionCard({
  grade,
  portion,
  overline,
}: {
  grade: GradeKey;
  portion: NextPortion;
  /** a line above the title, e.g. the age on the home screen */
  overline?: ReactNode;
}) {
  const c = useTheme();
  const t = useStrings();

  return (
    <View style={[styles.card, { backgroundColor: c.shallow, borderColor: c.hairline }]}>
      <View style={{ gap: 2 }}>
        {overline}
        <View style={styles.head}>
          <Icon name="lock" size={26} color={c.deep} />
          <Text variant="headline" style={{ flex: 1 }}>
            {t.portionTitle(portion)}
          </Text>
        </View>
      </View>
      <Text variant="body">{t.portionText}</Text>
      <PortionButton grade={grade} portion={portion} />
    </View>
  );
}

/**
 * «Смотреть рекламу» for the next portion; disabled while an ad is showing. Once the portion is
 * open: its first task, or `onOpened`.
 */
export function PortionButton({
  grade,
  portion,
  onOpened,
}: {
  grade: GradeKey;
  portion: NextPortion;
  onOpened?: () => void;
}) {
  const t = useStrings();
  const { watching, watchFor } = useWatchForPortion(grade);
  return (
    <PrimaryButton
      label={t.watchAd}
      icon="smart_display"
      disabled={watching}
      onPress={() => watchFor(portion, onOpened)}
    />
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
});
