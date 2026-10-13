import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnswerOptions, WrittenAnswer } from '@/components/answers';
import { AppBar } from '@/components/app-bar';
import { PrimaryButton } from '@/components/buttons';
import { Chip, useWeightLabel } from '@/components/difficulty';
import { Icon } from '@/components/icon';
import { FamilyIcon, TaskPicture } from '@/components/task-picture';
import { Font, Text } from '@/components/text';
import { findTask, tasksOf } from '@/data/bank';
import { ageGroup, topicFamily } from '@/data/groups';
import type { Task } from '@/data/types';
import { optionLetter, useLocalize, useStrings } from '@/i18n';
import { TRIES, nextTaskAfter, recordOf, type TaskRecord } from '@/state/progress';
import { useProgress } from '@/state/store';
import { alpha, useTheme } from '@/theme';

/**
 * One task: three tries, a wrong option is marked at once and can't be picked again;
 * after the right answer or the third miss the task closes and shows how to solve it.
 * A closed task opens read-only.
 */
export default function TaskScreen() {
  const { grade, number } = useLocalSearchParams<{ grade: string; number: string }>();
  const group = ageGroup(grade);
  const task = group ? findTask(group.grade, Number(number)) : undefined;
  if (!task) return <Redirect href="/" />;
  // a new key per task resets the pick and the scroll when «Следующая задача» swaps the task
  return <TaskContent key={task.id} task={task} />;
}

function TaskContent({ task }: { task: Task }) {
  const c = useTheme();
  const t = useStrings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useProgress();
  const localize = useLocalize();
  const weight = useWeightLabel();
  const record = recordOf(store.progress[task.grade], task);
  const [pick, setPick] = useState<string | null>(null);
  const [shake, setShake] = useState<{ key: string; token: number } | null>(null);
  const scroll = useRef<ScrollView>(null);

  const written = !task.options;
  const left = TRIES - record.wrong.length;
  const repeated = !!pick && record.wrong.includes(pick);

  const check = () => {
    if (!pick || repeated) return;
    const ok = store.answer(task, pick);
    if (ok) {
      AccessibilityInfo.announceForAccessibility(t.right);
    } else {
      setShake({ key: pick, token: (shake?.token ?? 0) + 1 });
      const leftNow = left - 1;
      AccessibilityInfo.announceForAccessibility(leftNow ? t.missed(leftNow) : t.failedTitle);
    }
    setPick(null);
    if (ok || left === 1) setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 250);
  };

  const goNext = () => {
    const progress = store.progress[task.grade];
    const next = nextTaskAfter(progress, tasksOf(task.grade), task);
    if (!next) {
      router.dismissTo({ pathname: '/age/[grade]', params: { grade: task.grade } });
      return;
    }
    router.replace({
      pathname: '/task/[grade]/[number]',
      params: { grade: task.grade, number: next.number },
    });
  };

  let note: { icon: 'replay' | 'touch_app'; text: string } | null = null;
  if (!record.done) {
    if (repeated) note = { icon: 'replay', text: t.repeated };
    else if (record.wrong.length) note = { icon: 'replay', text: t.missed(left) };
    else if (!pick) note = { icon: 'touch_app', text: written ? t.typeHint : t.pickHint };
  }
  const family = topicFamily(task.topics);

  return (
    <View style={{ flex: 1 }}>
      <AppBar
        title={t.task(task.number)}
        onBack={() =>
          router.canGoBack()
            ? router.back()
            : router.replace({ pathname: '/age/[grade]', params: { grade: task.grade } })
        }
        right={<Tries left={left} label={t.triesLeft(left, TRIES)} />}
      />
      <ScrollView ref={scroll} contentContainerStyle={styles.body}>
        <View style={styles.meta}>
          <Chip stars={task.weight} label={weight(task)} />
          <Chip icon={FamilyIcon[family]} label={t.families[family]} />
        </View>
        {task.image && (
          <TaskPicture
            task={task}
            inset={12}
            label={t.picture(task.number)}
            style={[
              styles.pic,
              {
                height: written ? 176 : 236,
                backgroundColor: '#ffffffb3',
                borderColor: c.hairline,
              },
            ]}
          />
        )}
        <Text variant="task" style={styles.question}>
          {localize(task.text)}
        </Text>
        {written ? (
          <WrittenAnswer
            task={task}
            record={record}
            pick={pick}
            onChange={setPick}
            shakeToken={shake?.token ?? 0}
          />
        ) : (
          <AnswerOptions task={task} record={record} pick={pick} onPick={setPick} shake={shake} />
        )}
        {written && !record.done && record.wrong.length > 0 && (
          <View style={styles.misses}>
            {record.wrong.map((w) => (
              <Text
                key={w}
                variant="small"
                color={c.inkMuted}
                style={[styles.miss, { backgroundColor: alpha(c.ink, 0.07) }]}
              >
                {w}
              </Text>
            ))}
          </View>
        )}
        {note && (
          <View style={styles.note} accessibilityLiveRegion="polite">
            <Icon name={note.icon} size={20} color={c.inkMuted} />
            <Text variant="small" muted style={{ flex: 1 }}>
              {note.text}
            </Text>
          </View>
        )}
        {record.done && <Verdict task={task} record={record} />}
      </ScrollView>
      <View
        style={[
          styles.dock,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: alpha(c.page, 0.94),
            borderTopColor: c.hairline,
          },
        ]}
      >
        {record.done ? (
          <PrimaryButton label={t.nextTask} onPress={goNext} />
        ) : (
          <PrimaryButton
            label={t.check}
            icon="check"
            onPress={check}
            disabled={!pick || repeated}
          />
        )}
      </View>
    </View>
  );
}

/** Three dots in the app bar; a used try is an empty circle. */
function Tries({ left, label }: { left: number; label: string }) {
  const c = useTheme();
  return (
    <View style={styles.tries} accessible accessibilityRole="image" accessibilityLabel={label}>
      {Array.from({ length: TRIES }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < left
              ? { backgroundColor: c.progress }
              : { borderWidth: 2, borderColor: alpha(c.ink, 0.28) },
          ]}
        />
      ))}
    </View>
  );
}

/** After the answer: «Верно!» or the right answer, then how to solve it. */
function Verdict({ task, record }: { task: Task; record: TaskRecord }) {
  const c = useTheme();
  const t = useStrings();
  const localize = useLocalize();
  const quiet = useReducedMotion();
  const solved = record.done === 'solved';
  const option = task.options?.find((o) => o.key === task.answer);
  const answer = option
    ? `${optionLetter(task, task.answer, t.letters)}: ${localize(option.text)}`
    : task.answer;

  return (
    <View
      style={[
        styles.verdict,
        solved
          ? { backgroundColor: c.shallow }
          : { backgroundColor: c.panel, borderWidth: 1, borderColor: c.hairline },
      ]}
    >
      <View style={styles.vh}>
        <Animated.View
          entering={quiet ? undefined : ZoomIn.springify().duration(500)}
          style={[styles.vIcon, { backgroundColor: solved ? c.progress : c.shallow }]}
        >
          <Icon
            name={solved ? 'check' : 'lightbulb'}
            size={26}
            color={solved ? '#ffffff' : c.deep}
          />
        </Animated.View>
        <Text
          variant="title"
          style={{ fontSize: 24, lineHeight: 28, flex: 1 }}
          accessibilityRole="header"
        >
          {solved ? t.right : t.failedTitle}
        </Text>
      </View>
      {!solved && (
        <Text variant="bodyStrong" muted style={{ fontSize: 16 }}>
          {t.failedText(answer)}
        </Text>
      )}
      <Text variant="small" muted style={styles.how}>
        {t.howToSolve}
      </Text>
      <Text variant="body">{localize(task.solution)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 16, gap: 12 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pic: { borderRadius: 20, borderWidth: 1 },
  question: { marginHorizontal: 4, marginVertical: 2 },
  misses: { flexDirection: 'row', gap: 6, marginHorizontal: 4 },
  miss: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 99,
    textDecorationLine: 'line-through',
    overflow: 'hidden',
  },
  note: { minHeight: 24, marginHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
  verdict: { borderRadius: 20, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 18, gap: 8 },
  vh: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  how: { marginTop: 8, fontSize: 14, fontFamily: Font.extrabold },
  dock: { paddingTop: 10, paddingHorizontal: 12, borderTopWidth: 1 },
  tries: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 14 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
