import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, PrimaryButton } from '@/components/buttons';
import { Logo } from '@/components/logo';
import { MenuSheet } from '@/components/menu-sheet';
import { Meter } from '@/components/meter';
import { PortionCard } from '@/components/portion';
import { TaskPicture } from '@/components/task-picture';
import { Font, Text } from '@/components/text';
import { AgeGroups, ageGroup, type AgeGroup } from '@/data/groups';
import { useStrings } from '@/i18n';
import { useNav } from '@/navigation';
import { useGradeSummary, useSettings } from '@/state/store';
import { pressedScale, useTheme } from '@/theme';

/**
 * First screen: greeting, «Решать» for the last opened age (or its next portion once every open
 * task there is closed), the choice of age.
 */
export default function Home() {
  const c = useTheme();
  const t = useStrings();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const [menu, setMenu] = useState(false);
  const last = settings.lastGrade ? ageGroup(settings.lastGrade) : undefined;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.page,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.hello}>
          <Logo />
          <Text variant="display" style={styles.h1} accessibilityRole="header">
            {t.hello}
          </Text>
        </View>
        {last && <ResumeCard group={last} />}
        <Text variant="label" style={styles.label} accessibilityRole="header">
          {t.ages}
        </Text>
        {AgeGroups.map((g) => (
          <AgeCard key={g.grade} group={g} />
        ))}
      </ScrollView>
      <View style={[styles.menuBtn, { top: insets.top + 12 }]}>
        <IconButton icon="menu" size={32} label={t.menu} onPress={() => setMenu(true)} />
      </View>
      <View style={[styles.statusScrim, { height: insets.top, backgroundColor: c.page }]} />
      <MenuSheet visible={menu} onClose={() => setMenu(false)} />
    </View>
  );
}

function ResumeCard({ group }: { group: AgeGroup }) {
  const c = useTheme();
  const t = useStrings();
  const nav = useNav();
  const { counts, next, portion } = useGradeSummary(group.grade);
  const go = () => nav.resume(group.grade, next);

  if (!next && portion) {
    return (
      <PortionCard
        grade={group.grade}
        portion={portion}
        overline={
          <Text variant="small" muted style={{ paddingHorizontal: 4 }}>
            {t.ageLabel(group.age)}
          </Text>
        }
      />
    );
  }

  return (
    <View style={[styles.resume, { backgroundColor: c.shallow, borderColor: c.hairline }]}>
      <View style={styles.resumeTop}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="small" muted>
            {t.ageLabel(group.age)}
          </Text>
          <Text variant="headline" style={{ fontSize: 30, lineHeight: 32 }}>
            {next ? t.task(next.number) : t.allDoneTitle}
          </Text>
          <View style={{ flex: 1 }} />
          <Meter value={counts.solved} total={counts.total} />
        </View>
        {next && <TaskPicture task={next} inset={6} style={styles.resumePic} />}
      </View>
      <PrimaryButton label={t.solve} onPress={go} style={{ marginTop: 12 }} />
    </View>
  );
}

function AgeCard({ group }: { group: AgeGroup }) {
  const c = useTheme();
  const t = useStrings();
  const nav = useNav();
  const { tasks, counts } = useGradeSummary(group.grade);
  const pics = tasks.filter((x) => x.image).filter((_, i) => i === 1 || i === 6);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t.ageLabel(group.age)}, ${t.solvedOf(counts.solved, counts.total)}`}
      onPress={() => nav.openAge(group.grade)}
      style={({ pressed }) => [
        styles.ageCard,
        { backgroundColor: c[group.tone], borderColor: c.hairline },
        pressedScale(pressed),
      ]}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.ageRow}>
          <Text style={styles.ageN}>{group.age}</Text>
          <Text variant="label" style={styles.ageYears}>
            {t.years}
          </Text>
        </View>
        {counts.solved + counts.failed > 0 ? (
          <Meter value={counts.solved} total={counts.total} style={styles.ageMeter} />
        ) : (
          <Text variant="caption" muted style={{ marginTop: 10 }}>
            {t.tasksCount(counts.total)}
          </Text>
        )}
      </View>
      <View style={styles.pics}>
        {pics.map((p, i) => (
          <TaskPicture
            key={p.id}
            task={p}
            inset={4}
            style={[styles.thumb, i > 0 && { marginLeft: -18, transform: [{ rotate: '6deg' }] }]}
          />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 12, gap: 10 },
  hello: { paddingHorizontal: 8, paddingTop: 4, paddingBottom: 6 },
  h1: { marginTop: 14 },
  menuBtn: { position: 'absolute', right: 6 },
  statusScrim: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0.94 },
  label: { paddingHorizontal: 8, paddingTop: 14, paddingBottom: 2 },
  resume: { borderRadius: 20, borderWidth: 1, padding: 16 },
  resumeTop: { flexDirection: 'row', gap: 12 },
  resumePic: { width: 112, height: 112, borderRadius: 16, backgroundColor: '#ffffffb3' },
  ageCard: {
    minHeight: 96,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ageRow: { flexDirection: 'row', alignItems: 'baseline' },
  ageN: { fontFamily: Font.bold, fontSize: 46, lineHeight: 48, letterSpacing: -2.3 },
  ageYears: { marginLeft: 6, fontSize: 18 },
  ageMeter: { marginTop: 10, maxWidth: 170 },
  pics: { flexDirection: 'row' },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#ffffffcc',
  },
});
