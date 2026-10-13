# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Проект

MathOlymp — Android-приложение (Expo) с тренажёром олимпиадной математики для 1–4 классов и закрытым родительским разделом. Продуктовые решения, ограничения и открытые вопросы описаны в [PRODUCT.md](PRODUCT.md). Прочитайте его перед любой продуктовой или UI-работой. Нерешённое там (формат подсказок, вход для родителей, как задачи попадут в приложение и т. п.) не додумывайте, а спрашивайте.

Сейчас `src/` — почти нетронутый шаблон Expo (вкладки Home/Explore, `ThemedText`/`ThemedView`). Настоящих экранов приложения ещё нет.

## Команды

```bash
npm start              # expo start (dev-сервер)
npm run android        # expo run:android — нативная сборка и запуск
npm run lint           # expo lint (ESLint flat config + prettier как правило)
npm run lint:fix
npm run typecheck      # tsc --noEmit
npm run format         # prettier --write .
npm run format:check
```

Тестов и тестового раннера нет. Проверка изменений: `npm run lint && npm run typecheck`.

`npm run reset-project` — шаблонный скрипт Expo, переносит `src/app` в пример. Не запускайте его без просьбы.

## Стек и версии

Expo SDK 57, React Native 0.86, React 19.2, expo-router 57 (typed routes и React Compiler включены в `app.json`), Reanimated 4 и worklets, NativeWind 4 с Tailwind 3, TypeScript 6. Эти версии новее хорошо известных, поэтому перед использованием API сверяйтесь с документацией (context7 или плагин `expo` в `.claude/settings.json`). Целевая платформа одна — Android (`com.kondrse.matholymp`). Папка `android/` сгенерирована (CNG) и лежит в `.gitignore`: нативные настройки меняйте через `app.json` и плагины, а не правкой `android/`.

## Архитектура

- **Роутинг:** файловый, в `src/app/` (expo-router). `_layout.tsx` подключает `global.css`, тему навигации и `AppTabs`. `AppTabs` использует `NativeTabs` из `expo-router/unstable-native-tabs`: каждая вкладка должна быть объявлена там как `Trigger` с `name`, равным имени файла маршрута.
- **Алиасы:** `@/*` → `src/*`, `@/assets/*` → `assets/*`.
- **Дизайн-токены — единый источник в [src/constants/tokens.ts](src/constants/tokens.ts)** (`Colors.light/dark`, `Spacing`). Их используют два потребителя:
  - StyleSheet-код через `@/constants/theme` и хук `useTheme()`;
  - Tailwind: [tailwind.config.js](tailwind.config.js) делает `require` этого `.ts`-файла в Node и превращает цвета в CSS-переменные `--color-<kebab>` (тёмная тема через `prefers-color-scheme`), а spacing — в классы `p-two`, `gap-three` и т. п. Классы цветов: `bg-background`, `text-text-secondary`, `bg-background-element/50`.
  - Поэтому в `tokens.ts` нельзя импортировать React Native или что-либо ещё, кроме чистых данных. Новый цвет нужно добавлять и в `light`, и в `dark`.
- **NativeWind** подключён через `babel.config.js` (`jsxImportSource: 'nativewind'`) и `metro.config.js` (`input: ./src/global.css`). Tailwind сканирует только `src/**`.

## Стиль кода

Prettier: одинарные кавычки, trailing commas, ширина 100, `prettier-plugin-tailwindcss` сортирует классы. ESLint запускает prettier как правило, так что ошибки форматирования — это ошибки линта.

## Дизайн-прототипы (`frontend-ideas/`)

Одноразовые HTML-прототипы экранов (выбор класса, список задач) в рамке телефона. Это не код приложения. Папка исключена из ESLint, Prettier и git. Общий каркас лежит в `_shared/core.js` (каждый вариант задаёт `window.VARIANT`), обзор и оценка вариантов — в `review-01-04.md`, фаворит — 01 «Ходилка». Expo-экраны собираются по выбранному варианту. Критики дизайна от skill impeccable сохраняются в `.impeccable/critique/`.

## Банк задач (вне репозитория)

Задачи и рисунки лежат в соседней папке `../sources` (Python-конвейер, описание в `../sources/STATUS.md`):

- `generated/<класс>/tasks.json` и SVG-рисунки (`NN.svg`, стиль «стекло» — `styled_glass/NN.svg`): придуманные задачи. **В приложение попадают только они.**
- `tasks/<класс>/`: разобранные задачи настоящего «Кенгуру». Это только образцы, в приложение их не включать.
- Формат задачи как в «Кенгуру»: варианты А–Д (в 1 классе А–Г, часть задач с вписываемым ответом), баллы 3/4/5 (в 1 классе `level`: лёгкая/средняя/трудная), `type`, `topics`, решение.
- Правила контента: никаких кенгуру и мультяшных персонажей, персонажи — разные животные. Придуманные задачи нельзя выдавать за задачи настоящих олимпиад.
- Скрипты запускаются как `python -X utf8 scripts/<script>.py` из `../sources`. Как задачи будут попадать в приложение, ещё не решено.

Интерфейс и задачи должны поддерживать русский и английский с первой версии; сейчас задачи есть только на русском.
