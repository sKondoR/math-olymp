import type { Lang, Localized, Task } from '@/data/types';
import { useSettings } from '@/state/store';

import { StringsByLang } from './strings';

export { LangNames } from './strings';

export function useStrings() {
  return StringsByLang[useSettings().settings.lang];
}

/** Task content in the chosen language, Russian until it is translated. */
export function localize(text: Localized, lang: Lang) {
  return text[lang] ?? text.ru;
}

/** `localize` bound to the chosen language. */
export function useLocalize() {
  const lang = useSettings().settings.lang;
  return (text: Localized) => localize(text, lang);
}

/** The letter shown for an option: А–Д in Russian, A–E otherwise. */
export function optionLetter(task: Task, key: string, letters: string[]) {
  const i = task.options?.findIndex((o) => o.key === key) ?? -1;
  return i >= 0 ? (letters[i] ?? key) : key;
}
