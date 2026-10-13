import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBar } from '@/components/app-bar';
import { PrimaryButton, SecondaryButton } from '@/components/buttons';
import { Chip, Stars, useWeightLabel } from '@/components/difficulty';
import { Icon } from '@/components/icon';
import { Meter, Track } from '@/components/meter';
import { TaskPicture } from '@/components/task-picture';
import { TaskTile } from '@/components/task-tile';
import { Font, Text } from '@/components/text';
import { ageGroup } from '@/data/groups';
import type { GradeKey, Task } from '@/data/types';
import { useLocalize, useStrings } from '@/i18n';
import { countProgress, isClosed, taskState, type GradeProgress } from '@/state/progress';
import { useGradeSummary, useSettings } from '@/state/store';
import { useTheme } from '@/theme';

const PREVIEW = 6;

/** Age group: the next task, tasks by difficulty, what is done. */
export default function AgeScreen() {
  const { grade } = useLocalSearchParams<{ grade: string }>();
  const group = ageGroup(grade);
  const { openGrade } = useSettings();

  useEffect(() => {
    if (group) openGrade(group.grade);
  }, [group, openGrade]);

  if (!group) return <Redirect href="/" />;
  return <AgeContent grade={group.grade} age={group.age} />;
}

function AgeContent({ grade, age }: { grade: GradeKey; age: string }) {
  const c = useTheme();
  const t = useStrings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const localize = useLocalize();
  const { tasks, progress: p, counts, next } = useGradeSummary(grade);
  const weight = useWeightLabel();
  const open = (task: Task) =>
    router.push({ pathname: '/task/[grade]/[number]', params: { grade, number: task.number } });

  return (
    <View style={{ flex: 1 }}>
      <AppBar
        title={t.ageLabel(age)}
        right={<Meter value={counts.solved} total={counts.total} style={styles.barMeter} />}
      />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}>
        {next ? (
          <View
            style={[styles.next, { backgroundColor: c.shallow, borderColor: c.hairline }]}
            accessibilityLabel={t.nextTask}
          >
            <View style={styles.nextHead}>
              <Text variant="headline">{t.task(next.number)}</Text>
              <Chip stars={next.weight} label={weight(next)} />
            </View>
            <TaskPicture
              task={next}
              glyphSize={64}
              label={t.picture(next.number)}
              style={styles.nextPic}
            />
            <Text variant="bodyStrong" numberOfLines={3} style={{ marginHorizontal: 4 }}>
              {localize(next.text)}
            </Text>
            <PrimaryButton label={t.solve} onPress={() => open(next)} />
          </View>
        ) : (
          <View style={[styles.next, { backgroundColor: c.shallow, borderColor: c.hairline }]}>
            <Text variant="headline">{t.allDoneTitle}</Text>
            <Text variant="body">{t.allDoneText}</Text>
            <SecondaryButton
              label={t.results}
              icon="bar_chart"
              iconFirst
              onPress={() => router.push('/results')}
            />
          </View>
        )}

        {([1, 2, 3] as const).map((w) => (
          <WeightGroup
            key={w}
            weight={w}
            tasks={tasks.filter((x) => x.weight === w)}
            progress={p}
            next={next}
            onOpen={open}
          />
        ))}

        <View style={[styles.sum, { backgroundColor: c.panel }]} accessible>
          <View style={[styles.sumIcon, { backgroundColor: c.shallow }]}>
            <Icon name="workspace_premium" size={28} color={c.deep} />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Text variant="label" style={{ fontFamily: Font.extrabold }}>
              {t.solvedOf(counts.solved, counts.total)}
            </Text>
            <Track value={counts.solved} total={counts.total} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function WeightGroup({
  weight,
  tasks,
  progress,
  next,
  onOpen,
}: {
  weight: 1 | 2 | 3;
  tasks: Task[];
  progress: GradeProgress;
  next: Task | undefined;
  onOpen: (t: Task) => void;
}) {
  const t = useStrings();
  const [expanded, setExpanded] = useState(false);
  if (!tasks.length) return null;

  const { solved } = countProgress(progress, tasks);
  // the preview starts two tasks before the first open one, so what was done stays in sight
  const front = tasks.findIndex((x) => !isClosed(progress, x));
  const start = front > 2 ? Math.min(front - 2, Math.max(0, tasks.length - PREVIEW)) : 0;
  const shown = expanded ? tasks : tasks.slice(start, start + PREVIEW);
  const points = tasks[0].points;
  const aside = `${points ? `${t.points(points)} · ` : ''}${
    solved ? t.ofTotal(solved, tasks.length) : t.tasksCount(tasks.length)
  }`;

  const rows: Task[][] = [];
  for (let i = 0; i < shown.length; i += 3) rows.push(shown.slice(i, i + 3));

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.label}>
        <View style={styles.lvl}>
          <Stars n={weight} />
          <Text variant="label" accessibilityRole="header">
            {t.levels[weight - 1]}
          </Text>
        </View>
        <Text variant="small" muted style={{ fontFamily: Font.semibold, fontSize: 14 }}>
          {aside}
        </Text>
      </View>
      {rows.map((row) => (
        <View key={row[0].id} style={styles.gridRow}>
          {row.map((task) => (
            <TaskTile
              key={task.id}
              task={task}
              state={taskState(progress, task, next)}
              onPress={() => onOpen(task)}
            />
          ))}
          {row.length < 3 &&
            Array.from({ length: 3 - row.length }, (_, i) => <View key={i} style={{ flex: 1 }} />)}
        </View>
      ))}
      {tasks.length > PREVIEW && (
        <SecondaryButton
          label={expanded ? t.collapse : t.showAll(tasks.length)}
          icon={expanded ? 'expand_less' : 'expand_more'}
          onPress={() => setExpanded(!expanded)}
          accessibilityState={{ expanded }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  barMeter: { width: 128, marginRight: 12 },
  body: { paddingHorizontal: 12, paddingTop: 4, gap: 8 },
  next: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 12 },
  nextHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  nextPic: { height: 176, borderRadius: 16, backgroundColor: '#ffffffb3' },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 2,
  },
  lvl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gridRow: { flexDirection: 'row', gap: 10 },
  sum: {
    marginTop: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
