import { describe, expect, it } from 'vitest';

import { startLang } from './start-lang';

describe('startLang', () => {
  it('takes the system language when the app speaks it', () => {
    expect(startLang('fr', 'CA')).toBe('fr');
    expect(startLang('ru', 'DE')).toBe('ru');
    expect(startLang('en', 'RU')).toBe('en');
  });

  it('gives Russian in the CIS when the system speaks another language', () => {
    expect(startLang('kk', 'KZ')).toBe('ru');
    expect(startLang('uz', 'uz')).toBe('ru');
  });

  it('gives English elsewhere', () => {
    expect(startLang('de', 'DE')).toBe('en');
    expect(startLang('uk', 'UA')).toBe('en');
  });

  it('gives English when the system gives no language or region', () => {
    expect(startLang('de', null)).toBe('en');
    expect(startLang(null, null)).toBe('en');
  });
});
