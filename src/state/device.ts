import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import { Langs, type Lang } from '@/data/types';

import type { Storage } from './saved';

/**
 * The device side of the store, passed to `StoreProvider` by the root layout; tests pass a map
 * and a language instead. AsyncStorage lives in the app's database folder, which Android Auto
 * Backup includes, so progress survives a reinstall or a new phone.
 */
export const deviceStorage: Storage = AsyncStorage;

/** The system language when the app speaks it, Russian otherwise. */
export function deviceLang(): Lang {
  const code = getLocales()[0]?.languageCode;
  return Langs.find((l) => l === code) ?? 'ru';
}
