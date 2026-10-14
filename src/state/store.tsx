import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import type { ThemeName } from '@/constants/tokens';
import { tasksOf } from '@/data/bank';
import { Langs, type GradeKey, type Lang, type Task } from '@/data/types';

import { answer as applyAnswer } from './attempt';
import { recordOf, type GradeProgress, type TaskRecord } from './progress';
import { loadState, saveProgress, saveSettings, type AllProgress, type Settings } from './saved';
import { summarize } from './summary';

export type { Settings } from './saved';

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

/**
 * Renders nothing until the saved state is read, so children can rely on it.
 * AsyncStorage lives in the app's database folder, which Android Auto Backup includes,
 * so progress survives a reinstall or a new phone.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [progress, setProgress] = useState<AllProgress | null>(null);

  useEffect(() => {
    loadState(AsyncStorage, deviceLang()).then((st) => {
      setSettings(st.settings);
      setProgress(st.progress);
    });
  }, []);

  if (!settings || !progress) return null;

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(AsyncStorage, next);
  };

  const updateProgress = (grade: GradeKey, next: GradeProgress) => {
    setProgress({ ...progress, [grade]: next });
    saveProgress(AsyncStorage, grade, next);
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

/** Summary of an age group: what is done, what is ahead, the task to solve next. */
export function useGradeSummary(grade: GradeKey) {
  return summarize(tasksOf(grade), useProgress().progress[grade]);
}
