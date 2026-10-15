/**
 * Which tasks of an age group are open: the first portion is free, each next one opens with a
 * rewarded ad and stays open until the age group is reset; a purchase (v2) opens everything for
 * good. Portions go by task number: 1–20, 21–40, …
 */

/** Tasks in one portion; the texts about portions take it from here. */
export const PORTION = 20;

/** What opens the tasks of one age group beyond the free portion. */
export type GradeOpenings = {
  /** portions opened by ads since the last reset */
  ads: number;
  /** bought in the store (v2); survives a reset */
  bought: boolean;
};

export const NO_OPENINGS: GradeOpenings = { ads: 0, bought: false };

/** Tasks numbered up to this one are open. */
export function openUpTo(openings: GradeOpenings): number {
  return openings.bought ? Infinity : PORTION * (1 + openings.ads);
}

/** Tasks one more ad opens, by number. */
export type Portion = { from: number; to: number };

/** undefined when no task is locked */
export function nextPortion(openings: GradeOpenings, lastNumber: number): Portion | undefined {
  const from = openUpTo(openings) + 1;
  if (from > lastNumber) return undefined;
  return { from, to: Math.min(from + PORTION - 1, lastNumber) };
}

export function withAdPortion(openings: GradeOpenings): GradeOpenings {
  return { ...openings, ads: openings.ads + 1 };
}

/** «Начать заново»: portions opened by ads close again, a purchase stays. */
export function afterReset(openings: GradeOpenings): GradeOpenings {
  return { ...openings, ads: 0 };
}
