import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { ThemeNames, type ThemeName } from '@/constants/tokens';
import { tasksOf } from '@/data/bank';
import { AgeGroups, ageGroup } from '@/data/groups';
import { Langs, type GradeKey, type Lang, type Task } from '@/data/types';

import { answer as applyAnswer } from './attempt';
import { countProgress, nextTask, recordOf, type GradeProgress, type TaskRecord } from './progress';

/**
 * Everything the app remembers, kept on the device only (no accounts in v1).
 * AsyncStorage lives in the app's database folder, which Android Auto Backup includes,
 * so progress survives a reinstall or a new phone.
 */
export type Settings = {
  lang: Lang;
  theme: ThemeName;
  /** the age group opened last; the home screen's «Решать» card leads there */
  lastGrade: GradeKey | null;
};

type AllProgress = Record<GradeKey, GradeProgress>;

const SETTINGS_KEY = 'mo:settings';
const progressKey = (grade: GradeKey) => `mo:progress:${grade}`;

/**
 * Settings and progress are separate contexts: an answer re-renders only what reads progress,
 * not every `Text` that reads the theme or the language.
 */
type SettingsStore = {
  settings: Settings;
  setLang(lang: Lang): void;
  setTheme(theme: ThemeName): void;
  openGrade(grade: GradeKey): void;
};

type ProgressStore = {
  progress: AllProgress;
  /** gives an answer to a task, returns its record after the answer */
  answer(task: Task, value: string): TaskRecord;
  /** «Начать заново»: every task of the age group is open again, results are gone */
  resetGrade(grade: GradeKey): void;
};

const SettingsContext = createContext<SettingsStore | null>(null);
const ProgressContext = createContext<ProgressStore | null>(null);

function deviceLang(): Lang {
  const code = getLocales()[0]?.languageCode;
  return Langs.find((l) => l === code) ?? 'ru';
}

function save(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch((e) => console.warn('save failed', e));
}

async function load() {
  const keys = [SETTINGS_KEY, ...AgeGroups.map((g) => progressKey(g.grade))];
  const entries = new Map(
    await AsyncStorage.multiGet(keys).catch((e) => {
      console.warn('load failed', e);
      return [];
    }),
  );
  const parse = (key: string) => {
    try {
      return JSON.parse(entries.get(key) ?? 'null');
    } catch {
      return null;
    }
  };
  const s = parse(SETTINGS_KEY) ?? {};
  const settings: Settings = {
    lang: Langs.includes(s.lang) ? s.lang : deviceLang(),
    theme: ThemeNames.includes(s.theme) ? s.theme : 'sea',
    lastGrade: ageGroup(s.lastGrade) ? s.lastGrade : null,
  };
  const progress = Object.fromEntries(
    AgeGroups.map((g) => [g.grade, parse(progressKey(g.grade)) ?? {}]),
  ) as AllProgress;
  return { settings, progress };
}

/** Renders nothing until the saved state is read, so children can rely on it. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [progress, setProgress] = useState<AllProgress | null>(null);

  useEffect(() => {
    load().then((st) => {
      setSettings(st.settings);
      setProgress(st.progress);
    });
  }, []);

  if (!settings || !progress) return null;

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    save(SETTINGS_KEY, next);
  };

  const updateProgress = (grade: GradeKey, next: GradeProgress) => {
    setProgress({ ...progress, [grade]: next });
    save(progressKey(grade), next);
  };

  const settingsStore: SettingsStore = {
    settings,
    setLang: (lang) => updateSettings({ lang }),
    setTheme: (theme) => updateSettings({ theme }),
    openGrade: (grade) => {
      if (settings.lastGrade !== grade) updateSettings({ lastGrade: grade });
    },
  };

  const progressStore: ProgressStore = {
    progress,
    answer: (task, value) => {
      const before = recordOf(progress[task.grade], task);
      const after = applyAnswer(before, task, value);
      if (after !== before)
        updateProgress(task.grade, { ...progress[task.grade], [task.id]: after });
      return after;
    },
    resetGrade: (grade) => updateProgress(grade, {}),
  };

  return (
    <SettingsContext value={settingsStore}>
      <ProgressContext value={progressStore}>{children}</ProgressContext>
    </SettingsContext>
  );
}

export function useSettings() {
  const store = use(SettingsContext);
  if (!store) throw new Error('useSettings outside StoreProvider');
  return store;
}

export function useProgress() {
  const store = use(ProgressContext);
  if (!store) throw new Error('useProgress outside StoreProvider');
  return store;
}

/** Tasks of an age group with what is done and the task to solve next. */
export function useGradeSummary(grade: GradeKey) {
  const progress = useProgress().progress[grade];
  const tasks = tasksOf(grade);
  return {
    tasks,
    progress,
    counts: countProgress(progress, tasks),
    next: nextTask(progress, tasks),
  };
}
