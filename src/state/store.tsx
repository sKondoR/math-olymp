import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import type { ThemeName } from '@/constants/tokens';
import { useTasks } from '@/data/bank';
import type { GradeKey, Lang, Task } from '@/data/types';

import { answer as applyAnswer } from './attempt';
import { recordOf, type GradeProgress, type TaskRecord } from './progress';
import {
  loadState,
  saveProgress,
  saveSettings,
  type AllProgress,
  type Settings,
  type Storage,
} from './saved';
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

/**
 * Renders nothing until the saved state is read, so children can rely on it. The storage and the
 * device language come from outside: the device's in the app (`state/device.ts`), a map in tests.
 */
export function StoreProvider({
  storage,
  deviceLang,
  children,
}: {
  storage: Storage;
  /** the language when none was chosen yet */
  deviceLang: Lang;
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [progress, setProgress] = useState<AllProgress | null>(null);

  useEffect(() => {
    loadState(storage, deviceLang).then((st) => {
      setSettings(st.settings);
      setProgress(st.progress);
    });
  }, [storage, deviceLang]);

  if (!settings || !progress) return null;

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(storage, next);
  };

  const updateProgress = (grade: GradeKey, next: GradeProgress) => {
    setProgress({ ...progress, [grade]: next });
    saveProgress(storage, grade, next);
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
  return summarize(useTasks(grade), useProgress().progress[grade]);
}
