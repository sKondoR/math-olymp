import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBar } from '@/components/app-bar';
import { SecondaryButton } from '@/components/buttons';
import { Stars } from '@/components/difficulty';
import { Icon, type IconName } from '@/components/icon';
import { Meter } from '@/components/meter';
import { ConfirmDialog, useSnackbar } from '@/components/overlays';
import { Font, Text } from '@/components/text';
import { AgeGroups, type AgeGroup } from '@/data/groups';
import { useStrings } from '@/i18n';
import { useGradeSummary, useProgress } from '@/state/store';
import { alpha, useTheme } from '@/theme';

/** «Мои результаты»: per age — solved, didn't work out, ahead; «Начать заново» per age. */
export default function Results() {
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const { resetGrade } = useProgress();
  const snack = useSnackbar();
  const [asking, setAsking] = useState<AgeGroup | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <AppBar title={t.results} />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}>
        <Text variant="small" muted style={styles.note}>
          {t.resultsNote}
        </Text>
        {AgeGroups.map((g) => (
          <AgeResults key={g.grade} group={g} onReset={() => setAsking(g)} />
        ))}
      </ScrollView>
      <ConfirmDialog
        visible={!!asking}
        icon="restart_alt"
        title={asking ? t.restartTitle(asking.age) : ''}
        text={asking ? t.restartText(asking.age) : ''}
        confirm={t.restart}
        onCancel={() => setAsking(null)}
        onConfirm={() => {
          if (!asking) return;
          resetGrade(asking.grade);
          snack(t.restarted(asking.age));
          setAsking(null);
        }}
      />
    </View>
  );
}

function AgeResults({ group, onReset }: { group: AgeGroup; onReset: () => void }) {
  const c = useTheme();
  const t = useStrings();
  const { counts } = useGradeSummary(group.grade);
  const touched = counts.solved + counts.failed > 0;

  return (
    <View
      style={[styles.card, { backgroundColor: c[group.tone], borderColor: c.hairline }]}
      accessibilityLabel={t.ageLabel(group.age)}
    >
      <View style={styles.top}>
        <View style={styles.ageRow}>
          <Text style={styles.ageN}>{group.age}</Text>
          <Text variant="label" style={{ marginLeft: 5 }}>
            {t.years}
          </Text>
        </View>
        <Meter value={counts.solved} total={counts.total} style={{ flex: 1 }} />
      </View>
      <View style={styles.stats}>
        <Stat
          icon="check_circle"
          n={counts.solved}
          word={t.solvedWord(counts.solved)}
          by={counts.byWeight.solved}
        />
        <Stat icon="menu_book" n={counts.failed} word={t.failedWord} by={counts.byWeight.failed} />
        <Stat
          icon="radio_button_unchecked"
          n={counts.open}
          word={t.aheadWord}
          by={counts.byWeight.open}
        />
      </View>
      <SecondaryButton
        label={t.restart}
        icon="restart_alt"
        iconFirst
        outline
        disabled={!touched}
        onPress={onReset}
        style={{ alignSelf: 'center', minHeight: 48 }}
      />
    </View>
  );
}

function Stat({ icon, n, word, by }: { icon: IconName; n: number; word: string; by: number[] }) {
  const c = useTheme();
  const t = useStrings();
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${n} ${word}: ${t.byLevel(by)}`}>
      <Icon name={icon} size={18} color={c.deep} />
      <Text style={styles.statN}>{n}</Text>
      <Text variant="caption" muted style={{ fontFamily: Font.semibold }}>
        {word}
      </Text>
      <View style={[styles.levels, { borderTopColor: c.hairline }]}>
        {by.map((x, i) => (
          <View key={i} style={styles.level}>
            <Stars n={i + 1} size={11} />
            <Text variant="small" style={{ fontFamily: Font.extrabold, fontSize: 14 }}>
              {x}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 12, paddingTop: 4, gap: 8 },
  note: {
    marginHorizontal: 8,
    marginTop: 4,
    marginBottom: 6,
    fontFamily: Font.semibold,
    fontSize: 14,
  },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ageRow: { flexDirection: 'row', alignItems: 'baseline' },
  ageN: { fontFamily: Font.bold, fontSize: 40, lineHeight: 44, letterSpacing: -2 },
  stats: { flexDirection: 'row', gap: 6 },
  stat: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: alpha('#ffffff', 0.65),
    gap: 2,
  },
  statN: { fontFamily: Font.extrabold, fontSize: 22, lineHeight: 26, letterSpacing: -0.4 },
  levels: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, gap: 3 },
  level: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
});
