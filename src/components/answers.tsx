import { useEffect, type ReactNode } from 'react';
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { Task } from '@/data/types';
import { optionLetter, useLocalize, useStrings } from '@/i18n';
import type { TaskRecord } from '@/state/progress';
import { alpha, pressedScale, useTheme } from '@/theme';

import { Icon } from './icon';
import { Font, Text } from './text';

/** A miss: one short horizontal shake (440 ms), then the option stays crossed out. */
function Shake({
  token,
  style,
  children,
}: {
  /** changes on every miss of this element; 0 — never shaken */
  token: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const x = useSharedValue(0);
  const quiet = useReducedMotion();
  useEffect(() => {
    if (!token || quiet) return;
    const step = (to: number, ms: number) => withTiming(to, { duration: ms });
    x.value = withSequence(
      step(-7, 53),
      step(7, 88),
      step(-7, 88),
      step(7, 88),
      step(-2, 79),
      step(0, 44),
    );
  }, [token, quiet, x]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/**
 * Options А–Д: short ones in one row like the olympiad answer sheet, up to 11 characters in two
 * columns, longer ones as a list.
 */
export function AnswerOptions({
  task,
  record,
  pick,
  onPick,
  shake,
}: {
  task: Task;
  record: TaskRecord;
  pick: string | null;
  onPick: (key: string) => void;
  shake: { key: string; token: number } | null;
}) {
  const c = useTheme();
  const t = useStrings();
  const localize = useLocalize();
  const options = task.options ?? [];
  const texts = options.map((o) => localize(o.text));
  const longest = Math.max(...texts.map((s) => s.length));
  const form = longest <= 3 ? 'row' : longest <= 11 ? 'two' : 'list';

  return (
    <View
      style={[styles.opts, form !== 'list' && styles.wrap]}
      accessibilityRole="radiogroup"
      accessibilityLabel={t.answerOptions}
    >
      {options.map((o, i) => {
        const letter = optionLetter(task, o.key, t.letters);
        const wrong = record.wrong.includes(o.key);
        const right = record.done === 'solved' && o.key === task.answer;
        const reveal = record.done === 'failed' && o.key === task.answer;
        const picked = !record.done && pick === o.key;
        const off = !!record.done || wrong;
        const lastOdd = form === 'two' && i === options.length - 1 && options.length % 2 === 1;
        const mark = `${wrong ? `, ${t.wrongMark}` : ''}${right || reveal ? `, ${t.rightMark}` : ''}`;
        return (
          <Shake
            key={o.key}
            token={shake?.key === o.key ? shake.token : 0}
            style={
              form === 'row' ? { flex: 1 } : form === 'two' && (lastOdd ? styles.full : styles.half)
            }
          >
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: picked, disabled: off }}
              accessibilityLabel={`${letter}: ${texts[i]}${mark}`}
              disabled={off}
              onPress={() => onPick(o.key)}
              style={({ pressed }) => [
                styles.opt,
                form === 'row' && styles.optRow,
                { backgroundColor: c.panel, borderColor: c.hairline },
                picked && { borderColor: c.progress, borderWidth: 3 },
                wrong && { backgroundColor: 'transparent', borderColor: alpha(c.ink, 0.1) },
                right && { backgroundColor: c.progress, borderColor: c.progress },
                reveal && { borderColor: c.progress, borderWidth: 3 },
                !off && pressedScale(pressed, 0.97),
              ]}
            >
              <View
                style={[
                  styles.letter,
                  { backgroundColor: c.shallow },
                  (picked || reveal) && { backgroundColor: c.progress },
                  wrong && { backgroundColor: alpha(c.ink, 0.08) },
                  right && { backgroundColor: '#ffffff' },
                ]}
              >
                {wrong ? (
                  <Icon name="close" size={18} color={alpha(c.ink, 0.42)} />
                ) : right || reveal ? (
                  <Icon name="check" size={18} color={right ? c.progress : c.onDark} />
                ) : (
                  <Text
                    variant="captionStrong"
                    style={{ fontSize: 14 }}
                    color={picked ? c.onDark : c.deep}
                  >
                    {letter}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.value,
                  form === 'row' && styles.valueRow,
                  wrong && styles.struck,
                  form !== 'row' && { flexShrink: 1 },
                ]}
                color={right ? c.onDark : wrong ? alpha(c.ink, 0.42) : c.ink}
              >
                {texts[i]}
              </Text>
            </Pressable>
          </Shake>
        );
      })}
    </View>
  );
}

/** A written answer (6 years): the number and own digit keys, no system keyboard over the task. */
export function WrittenAnswer({
  task,
  record,
  pick,
  onChange,
  shakeToken,
}: {
  task: Task;
  record: TaskRecord;
  pick: string | null;
  onChange: (v: string | null) => void;
  shakeToken: number;
}) {
  const c = useTheme();
  const t = useStrings();
  const shown = record.done ? task.answer : pick;
  const press = (key: string) => {
    const cur = pick ?? '';
    if (key === 'del') onChange(cur.slice(0, -1) || null);
    else onChange((cur + key).replace(/^0+(?=\d)/, '').slice(0, 3));
  };
  return (
    <View style={{ gap: 8 }}>
      <Shake token={shakeToken}>
        <View
          accessible
          accessibilityLabel={shown ?? t.typeNumber}
          style={[
            styles.ans,
            { backgroundColor: c.panel, borderColor: c.hairline },
            !!pick && !record.done && { borderColor: c.progress, borderWidth: 3 },
            record.done === 'solved' && { backgroundColor: c.progress, borderColor: c.progress },
            record.done === 'failed' && { borderColor: c.progress, borderWidth: 3 },
          ]}
        >
          {shown ? (
            <>
              {record.done && (
                <Icon
                  name="check"
                  size={30}
                  color={record.done === 'solved' ? c.onDark : c.progress}
                />
              )}
              <Text style={styles.ansValue} color={record.done === 'solved' ? c.onDark : c.ink}>
                {shown}
              </Text>
            </>
          ) : (
            <Text variant="bodyStrong" muted>
              {t.typeNumber}
            </Text>
          )}
        </View>
      </Shake>
      {!record.done && (
        <View style={styles.pad} accessibilityLabel={t.digits}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) =>
            k ? (
              <Pressable
                key={k}
                accessibilityRole="button"
                accessibilityLabel={k === 'del' ? t.erase : k}
                onPress={() => press(k)}
                style={({ pressed }) => [
                  styles.key,
                  { backgroundColor: pressed ? c.shallow : c.panel, borderColor: c.hairline },
                  pressedScale(pressed, 0.95),
                ]}
              >
                {k === 'del' ? (
                  <Icon name="backspace" color={c.ink} />
                ) : (
                  <Text style={styles.keyText}>{k}</Text>
                )}
              </Pressable>
            ) : (
              <View key="gap" style={styles.keyGap} />
            ),
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  opts: { gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  half: { width: '48.5%', flexGrow: 1 },
  full: { width: '100%' },
  opt: {
    minHeight: 64,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optRow: {
    minHeight: 92,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  letter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontFamily: Font.extrabold, fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
  valueRow: { fontSize: 22, lineHeight: 26, textAlign: 'center' },
  struck: { textDecorationLine: 'line-through' },
  ans: {
    height: 76,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ansValue: { fontFamily: Font.extrabold, fontSize: 40, lineHeight: 46, letterSpacing: -1.2 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  key: {
    width: '31.5%',
    flexGrow: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyGap: { width: '31.5%', flexGrow: 1, height: 52 },
  keyText: { fontFamily: Font.extrabold, fontSize: 24, lineHeight: 30 },
});
