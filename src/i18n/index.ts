import type { Lang, Localized, Task } from '@/data/types';
import { useSettings } from '@/state/store';

import { StringsByLang } from './strings';

export { LangNames } from './strings';

export function useStrings() {
  return StringsByLang[useSettings().settings.lang];
}

/** Task content (text or picture) in the chosen language, Russian when there is no copy. */
export function localize<T>(content: Localized<T>, lang: Lang): T {
  return content[lang] ?? content.ru;
}

/** `localize` bound to the chosen language. */
export function useLocalize() {
  const lang = useSettings().settings.lang;
  return <T>(content: Localized<T>) => localize(content, lang);
}

/** The letter shown for an option: А–Д in Russian, A–E otherwise. */
export function optionLetter(task: Task, key: string, letters: string[]) {
  const i = task.options?.findIndex((o) => o.key === key) ?? -1;
  return i >= 0 ? (letters[i] ?? key) : key;
}
