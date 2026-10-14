import type { Storage } from './saved';

/**
 * The storage as a plain map: the adapter tests use instead of AsyncStorage. Values given as
 * objects are saved as JSON, strings as they are (to plant damaged data).
 */
export function memoryStorage(initial: Record<string, unknown> = {}) {
  const data = new Map(
    Object.entries(initial).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
  );
  const storage: Storage = {
    multiGet: async (keys) => keys.map((k) => [k, data.get(k) ?? null] as const),
    setItem: async (key, value) => {
      data.set(key, value);
    },
  };
  /** what is saved under `key`, parsed */
  const saved = (key: string): unknown => JSON.parse(data.get(key) ?? 'null');
  return { storage, data, saved };
}
