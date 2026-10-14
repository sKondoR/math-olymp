import type { ThemeColor } from '@/constants/tokens';

import type { GradeKey } from './types';

/**
 * Six age groups. The interface shows only the age; data, files and the bank keep school grades.
 */
export type AgeGroup = {
  grade: GradeKey;
  /** the age as shown on cards: «6», «8–9» */
  age: string;
  /** card fill */
  tone: ThemeColor;
};

export const AgeGroups: AgeGroup[] = [
  { grade: '1', age: '6', tone: 'shallow' },
  { grade: '2', age: '7', tone: 'sand' },
  { grade: '3-4', age: '8–9', tone: 'pearl' },
  { grade: '5-6', age: '10–11', tone: 'shallow' },
  { grade: '7-8', age: '12–13', tone: 'sand' },
  { grade: '9-10', age: '14–15', tone: 'pearl' },
];

export function ageGroup(grade: string): AgeGroup | undefined {
  return AgeGroups.find((g) => g.grade === grade);
}
