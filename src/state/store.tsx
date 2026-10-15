import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import type { RewardedAds } from '@/ads';
import type { ThemeName } from '@/constants/tokens';
import { useTasks } from '@/data/bank';
import type { GradeKey, Lang, Task } from '@/data/types';

import { afterReset, withAdPortion, type GradeOpenings } from './openings';
import { answer as applyAnswer } from './attempt';
import { recordOf, type GradeProgress, type TaskRecord } from './progress';
import {
  loadState,
  saveOpenings,
  saveProgress,
  saveSettings,
  type AllOpenings,
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
  /** what opens the tasks of each age group beyond the free portion */
  openings: AllOpenings;
  /** gives an answer to a task, returns its record after the answer */
  answer(task: Task, value: string): TaskRecord;
  /** a rewarded ad was watched (or there was none to show): the next portion opens */
  openPortion(grade: GradeKey): void;
  /**
   * «Начать заново»: every task of the age group can be solved again, results are gone and the
   * portions opened by ads close again
   */
  resetGrade(grade: GradeKey): void;
};

const SettingsContext = createContext<SettingsStore | null>(null);
const ProgressContext = createContext<ProgressStore | null>(null);
const AdsContext = createContext<RewardedAds | null>(null);

/**
 * Renders nothing until the saved state is read, so children can rely on it. The storage, the
 * device language and the ads come from outside: the device's and the build's in the app
 * (`state/device.ts`, `ads/`), fakes in tests.
 */
export function StoreProvider({
  storage,
  deviceLang,
  ads,
  children,
}: {
  storage: Storage;
  /** the language when none was chosen yet */
  deviceLang: Lang;
  /** the rewarded ads that open portions */
  ads: RewardedAds;
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [progress, setProgress] = useState<AllProgress | null>(null);
  const [openings, setOpenings] = useState<AllOpenings | null>(null);

  useEffect(() => {
    loadState(storage, deviceLang).then((st) => {
      setSettings(st.settings);
      setProgress(st.progress);
      setOpenings(st.openings);
    });
  }, [storage, deviceLang]);

  if (!settings || !progress || !openings) return null;

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(storage, next);
  };

  const updateProgress = (grade: GradeKey, next: GradeProgress) => {
    setProgress({ ...progress, [grade]: next });
    saveProgress(storage, grade, next);
  };

  const updateOpenings = (grade: GradeKey, next: GradeOpenings) => {
    setOpenings({ ...openings, [grade]: next });
    saveOpenings(storage, grade, next);
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
    openings,
    answer: (task, value) => {
      const before = recordOf(progress[task.grade], task);
      const after = applyAnswer(before, task, value);
      if (after !== before)
        updateProgress(task.grade, { ...progress[task.grade], [task.id]: after });
      return after;
    },
    openPortion: (grade) => updateOpenings(grade, withAdPortion(openings[grade])),
    resetGrade: (grade) => {
      updateProgress(grade, {});
      updateOpenings(grade, afterReset(openings[grade]));
    },
  };

  return (
    <SettingsContext value={settingsStore}>
      <ProgressContext value={progressStore}>
        <AdsContext value={ads}>{children}</AdsContext>
      </ProgressContext>
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

/** The build's rewarded ads, as given to `StoreProvider`. */
export function useAds() {
  const ads = use(AdsContext);
  if (!ads) throw new Error('useAds outside StoreProvider');
  return ads;
}

/** Summary of an age group: what is done, what is ahead, the task to solve next. */
export function useGradeSummary(grade: GradeKey) {
  const { progress, openings } = useProgress();
  return summarize(useTasks(grade), progress[grade], openings[grade]);
}
