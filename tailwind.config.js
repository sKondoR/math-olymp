const plugin = require('tailwindcss/plugin');

const { Colors, Spacing } = require('./src/constants/tokens.ts');

const kebab = (name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
// '#60646C' -> '96 100 108', so Tailwind opacity modifiers (bg-text/50) keep working.
const rgbChannels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');
const colorVars = (palette) =>
  Object.fromEntries(
    Object.entries(palette).map(([name, hex]) => [`--color-${kebab(name)}`, rgbChannels(hex)]),
  );

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Theme colors switch with the system color scheme via CSS variables:
      // text-text, bg-background, bg-background-element, text-text-secondary, ...
      colors: Object.fromEntries(
        Object.keys(Colors.light).map((name) => [
          kebab(name),
          `rgb(var(--color-${kebab(name)}) / <alpha-value>)`,
        ]),
      ),
      // p-two, gap-three, ... (px values from Spacing)
      spacing: Object.fromEntries(Object.entries(Spacing).map(([k, v]) => [k, `${v}px`])),
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': colorVars(Colors.light),
        '@media (prefers-color-scheme: dark)': { ':root': colorVars(Colors.dark) },
      });
    }),
  ],
};
