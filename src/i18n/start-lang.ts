import { Langs, type Lang } from '@/data/types';

/** Regions where Russian is the language to start with when the system speaks none of ours. */
const RussianRegions = ['RU', 'BY', 'KZ', 'KG', 'UZ', 'TJ', 'AM', 'AZ', 'MD'];

/**
 * The language before one is chosen in the menu: the system's when the app speaks it; otherwise
 * Russian in the CIS and English elsewhere or when the system gives no region.
 */
export function startLang(languageCode: string | null, regionCode: string | null): Lang {
  const own = Langs.find((l) => l === languageCode);
  if (own) return own;
  return regionCode && RussianRegions.includes(regionCode.toUpperCase()) ? 'ru' : 'en';
}
