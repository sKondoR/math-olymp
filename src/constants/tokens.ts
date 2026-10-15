/**
 * Theme colours from DESIGN.md, read through `useTheme()`.
 *
 * Three themes with the same roles; a theme is values only. The sea theme is the main one.
 */

export const ThemeNames = ['sea', 'lilac', 'stone'] as const;
export type ThemeName = (typeof ThemeNames)[number];

export const Palettes = {
  sea: {
    ink: '#0f2a3d',
    inkMuted: '#2b6c80',
    page: '#e9f7f7',
    panel: '#ffffffb3',
    hairline: '#0f2a3d33',
    /** main action: «Решать», «Проверить», «Следующая задача» */
    action: '#f5a065',
    onAction: '#0f2a3d',
    /** the icon circle on the action pill: a light tint, never a dark one (it reads as grime) */
    actionTint: '#ffffff66',
    /** text and icons on progress, deep and the snackbar */
    onDark: '#ffffff',
    /** pure white surfaces: the tile badges and number pill, a solved tile's picture */
    paper: '#ffffff',
    /** progress, solved, next-task ring, focus, right answer */
    progress: '#2a7590',
    /** logo tiles, icons in components, difficulty stars */
    deep: '#1f5d80',
    /** the A outline and «Olymp» in the logo */
    logo: '#e3600f',
    /** card fills, each with one meaning */
    shallow: '#cdebee',
    sand: '#f6ebcd',
    pearl: '#fff6df',
    tileEmpty: '#d9f0f2',
  },
  lilac: {
    ink: '#2b2730',
    inkMuted: '#6b6474',
    page: '#f3f0f5',
    panel: '#fbfafc',
    hairline: '#2b273033',
    action: '#7a5fa6',
    onAction: '#ffffff',
    actionTint: '#ffffff29',
    onDark: '#ffffff',
    paper: '#ffffff',
    progress: '#7a5fa6',
    deep: '#8f73b8',
    logo: '#a87e12',
    shallow: '#ebe4f1',
    sand: '#f0eedd',
    pearl: '#f6f2f1',
    tileEmpty: '#ebe4f1',
  },
  stone: {
    ink: '#2d2a28',
    inkMuted: '#5b5550',
    page: '#efeeea',
    panel: '#faf9f6',
    hairline: '#2d2a2838',
    action: '#48655f',
    onAction: '#ffffff',
    actionTint: '#ffffff29',
    onDark: '#ffffff',
    paper: '#ffffff',
    progress: '#48655f',
    deep: '#48655f',
    logo: '#b0694f',
    shallow: '#dfe8e4',
    sand: '#ebe5dc',
    pearl: '#f8f6f2',
    tileEmpty: '#e4eae7',
  },
} as const;

export type Palette = { [K in keyof (typeof Palettes)['sea']]: string };
export type ThemeColor = keyof Palette;
