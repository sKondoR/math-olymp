import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import type { Lang } from '@/data/types';
import { startLang } from '@/i18n/start-lang';

import type { Storage } from './saved';

/**
 * The device side of the store, passed to `StoreProvider` by the root layout; tests pass a map
 * and a language instead. AsyncStorage lives in the app's database folder, which Android Auto
 * Backup includes, so progress survives a reinstall or a new phone.
 */
export const deviceStorage: Storage = AsyncStorage;

/** The language to start with, from the system's language and region (`startLang`). */
export function deviceLang(): Lang {
  const locale = getLocales()[0];
  return startLang(locale?.languageCode ?? null, locale?.regionCode ?? null);
}
