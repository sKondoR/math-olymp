import { Redirect, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnswerOptions, WrittenAnswer } from '@/components/answers';
import { AppBar } from '@/components/app-bar';
import { PrimaryButton } from '@/components/buttons';
import { Chip, useWeightLabel } from '@/components/difficulty';
import { Icon, type IconName } from '@/components/icon';
import { PortionButton } from '@/components/portion';
import { FamilyIcon, TaskPicture } from '@/components/task-picture';
import { Font, Text } from '@/components/text';
import { useTask } from '@/data/bank';
import type { Task } from '@/data/types';
import { optionLetter, useLocalize, useStrings } from '@/i18n';
import { ageHref, useNav } from '@/navigation';
import { TRIES, type AttemptNote } from '@/state/attempt';
import { useGradeSummary } from '@/state/store';
import { useAttempt } from '@/state/use-attempt';
import { alpha, useTheme } from '@/theme';

/**
 * One task: three tries, a wrong option is marked at once and can't be picked again;
 * after the right answer or the third miss the task closes and shows how to solve it.
 * A closed task opens read-only, a locked one does not open.
 */
export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useTask(id);
  if (!task) return <Redirect href="/" />;
  // a new key per task resets the pick and the scroll when «Следующая задача» swaps the task
  return <OpenTask key={task.id} task={task} />;
}

function OpenTask({ task }: { task: Task }) {
  const { stateOf } = useGradeSummary(task.grade);
  if (stateOf(task) === 'locked') return <Redirect href={ageHref(task.grade)} />;
  return <TaskContent task={task} />;
}

function TaskContent({ task }: { task: Task }) {
  const c = useTheme();
  const t = useStrings();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { nextAfter, portion } = useGradeSummary(task.grade);
  const localize = useLocalize();
  const weight = useWeightLabel();
  const attempt = useAttempt(task);
  const { written, left, done } = attempt;
  const scroll = useRef<ScrollView>(null);

  const check = () => {
    const result = attempt.check();
    if (!result) return;
    const { outcome } = result;
    AccessibilityInfo.announceForAccessibility(
      outcome === 'solved' ? t.right : outcome === 'failed' ? t.failedTitle : t.missed(result.left),
    );
    if (outcome !== 'missed') {
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 250);
    }
  };

  const nextTask = nextAfter(task);
  const goNext = () => nav.nextTask(task, nextTask);
  /** every open task is closed: instead of «Следующая задача», the ad for the next portion */
  const portionInstead = !nextTask && portion;

  const notes: Record<AttemptNote, { icon: IconName; text: string }> = {
    pick: { icon: 'touch_app', text: t.pickHint },
    type: { icon: 'touch_app', text: t.typeHint },
    missed: { icon: 'replay', text: t.missed(left) },
    repeated: { icon: 'replay', text: t.repeated },
  };
  const note = attempt.note && notes[attempt.note];

  return (
    <View style={{ flex: 1 }}>
      <AppBar
        title={t.task(task.number)}
        onBack={() => nav.leaveTask(task)}
        right={<Tries left={left} label={t.triesLeft(left, TRIES)} />}
      />
      <ScrollView ref={scroll} contentContainerStyle={styles.body}>
        <View style={styles.meta}>
          <Chip stars={task.weight} label={weight(task)} />
          <Chip icon={FamilyIcon[task.family]} label={t.families[task.family]} />
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
            done={done}
            shown={attempt.shown}
            onKey={attempt.type}
            shakeToken={attempt.shake?.token ?? 0}
          />
        ) : (
          <AnswerOptions
            task={task}
            statuses={attempt.options}
            onPick={attempt.choose}
            shake={attempt.shake}
          />
        )}
        {attempt.misses.length > 0 && (
          <View style={styles.misses}>
            {attempt.misses.map((w) => (
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
        {done && <Verdict task={task} solved={done === 'solved'} />}
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
        {done && portionInstead ? (
          <View style={{ gap: 6 }}>
            <Text variant="small" muted style={{ textAlign: 'center' }}>
              {t.portionTitle(portionInstead)}
            </Text>
            <PortionButton
              grade={task.grade}
              portion={portionInstead}
              onOpened={() => nav.nextTask(task, portionInstead.first)}
            />
          </View>
        ) : done ? (
          <PrimaryButton label={t.nextTask} onPress={goNext} />
        ) : (
          <PrimaryButton
            label={t.check}
            icon="check"
            onPress={check}
            disabled={!attempt.canCheck}
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
function Verdict({ task, solved }: { task: Task; solved: boolean }) {
  const c = useTheme();
  const t = useStrings();
  const localize = useLocalize();
  const quiet = useReducedMotion();
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
            color={solved ? c.onDark : c.deep}
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
