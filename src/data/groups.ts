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

/** Topic families: catalogue topics folded into groups a child can tell apart. */
export type TopicFamily = 'count' | 'logic' | 'shape' | 'pattern' | 'time';

const FAMILY: Record<string, TopicFamily> = {
  арифметика: 'count',
  'числа-и-цифры': 'count',
  'текстовая-задача': 'count',
  деньги: 'count',
  измерения: 'count',
  ребусы: 'count',
  'неравенства-и-оценки': 'count',
  'делимость-и-остатки': 'count',
  'дроби-и-проценты': 'count',
  'уравнения-и-алгебра': 'count',
  'степени-и-корни': 'count',
  движение: 'count',
  вероятность: 'count',
  логика: 'logic',
  'истина-и-ложь': 'logic',
  'задачи-с-буквами': 'logic',
  'сравнение-и-порядок': 'logic',
  'таблицы-и-квадраты': 'logic',
  весы: 'logic',
  'геометрия-фигуры': 'shape',
  'клетчатая-геометрия': 'shape',
  'симметрия-и-повороты': 'shape',
  'разрезание-и-складывание': 'shape',
  'пространство-кубики': 'shape',
  'углы-и-треугольники': 'shape',
  'площадь-и-периметр': 'shape',
  окружности: 'shape',
  'координаты-и-графики': 'shape',
  закономерности: 'pattern',
  'комбинаторика-перебор': 'pattern',
  'маршруты-и-лабиринты': 'pattern',
  графы: 'pattern',
  'игры-и-стратегии': 'pattern',
  'время-и-часы': 'time',
  календарь: 'time',
};

export function topicFamily(topics: string[]): TopicFamily {
  return FAMILY[topics[0]] ?? 'logic';
}
