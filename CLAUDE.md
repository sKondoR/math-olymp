# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Проект

MathOlymp — Android-приложение (Expo) с тренажёром олимпиадной математики для детей 6–15 лет (1–10 классы, в интерфейсе — возрастные группы) и закрытым родительским разделом. Продуктовые решения, ограничения и открытые вопросы описаны в [PRODUCT.md](PRODUCT.md). Прочитайте его перед любой продуктовой или UI-работой. Нерешённое там (формат подсказок, вход для родителей, детали монетизации и т. п.) не додумывайте, а спрашивайте.

v1 реализован: первый экран с выбором возраста, экран возраста, экран задачи (3 попытки и разбор), меню (язык, тема) и «Мои результаты» со сбросом возраста.

## Команды

```bash
npm start              # expo start (dev-сервер)
npm run android        # expo run:android — нативная сборка и запуск
npm run lint           # expo lint (ESLint flat config + prettier как правило)
npm run lint:fix
npm run typecheck      # tsc --noEmit
npm run format         # prettier --write .
npm run format:check
npm run tasks:sync     # перенести задачи и рисунки из ../sources/generated в assets/tasks
npm run icons          # перерисовать иконку и заставку (логотип «M·A») в assets/images
```

Тестов и тестового раннера нет. Проверка изменений: `npm run lint && npm run typecheck`.

## Стек и версии

Expo SDK 57, React Native 0.86, React 19.2, expo-router 57 (typed routes и React Compiler включены в `app.json`), Reanimated 4 и worklets, TypeScript 6. Эти версии новее хорошо известных, поэтому перед использованием API сверяйтесь с документацией (context7 или плагин `expo` в `.claude/settings.json`). Целевая платформа одна — Android (`com.kondrse.matholymp`). Папка `android/` сгенерирована (CNG) и лежит в `.gitignore`: нативные настройки меняйте через `app.json` и плагины, а не правкой `android/`.

## Архитектура

- **Роутинг** (expo-router, `Stack` без заголовков, в `src/app/`): `index.tsx` — первый экран; `age/[grade].tsx` — возраст; `task/[grade]/[number].tsx` — задача; `results.tsx` — «Мои результаты». Меню — нижняя панель (`components/menu-sheet.tsx`), не маршрут. `[grade]` — ключ класса из данных (`1`, `3-4`…), в интерфейсе показывается только возраст (`data/groups.ts`).
- **Данные** (`src/data/`): `types.ts` — модель задачи (`Localized` тексты, `source`, место под `hint`); `bank.ts` — банк из источников (`TaskSource`): сейчас только встроенный, `addTaskSource()` — точка для загружаемых задач после v1; `builtin.generated.ts` и `assets/tasks/` пишет `scripts/sync-tasks.mjs` — руками не править.
- **Рисунки задач** — SVG «стекло» как есть, рисуются через `expo-image` (на Android — AndroidSVG: `<style>` поддерживается, blur-фильтры игнорируются, это свечение под точной копией элемента, данные рисунка не теряются). Не растрировать.
- **Состояние** (`src/state/`): `progress.ts` — чистая логика (попытки, закрытие, следующая задача, подсчёты); `store.tsx` — два контекста в AsyncStorage: `useSettings()` (язык, тема, последний возраст; `mo:settings`) и `useProgress()` (прогресс по возрастам; `mo:progress:<grade>`), раздельно, чтобы ответ на задачу не перерисовывал всё, что читает тему и язык; `useGradeSummary(grade)` — задачи возраста, подсчёты и следующая задача. Профилей нет, всё локально; Android Auto Backup включён (`android.allowBackup` в `app.json`).
- **i18n** (`src/i18n/`): строки интерфейса на ru/en/es/fr в `strings.ts`; тексты задач — `localize()` с откатом на русский.
- **Тема и стили**: палитры трёх тем в [src/constants/tokens.ts](src/constants/tokens.ts) (`Palettes.sea/lilac/stone`, роли одинаковые). `useTheme()` из `@/theme` даёт палитру выбранной темы; там же `alpha()` и `pressedScale()` (отклик нажатия для стандартного `Pressable`). Всё на StyleSheet, NativeWind/Tailwind не используются.
- **Шрифты и иконки**: Manrope 500–800 (`components/text.tsx`, семейство на каждый вес) и Material Symbols (`components/icon.tsx`, кодовые точки глифов там же) грузятся в `_layout.tsx`.
- **Алиасы:** `@/*` → `src/*`, `@/assets/*` → `assets/*`.

## Стиль кода

Prettier: одинарные кавычки, trailing commas, ширина 100. ESLint запускает prettier как правило, так что ошибки форматирования — это ошибки линта.

## Дизайн-прототипы (`frontend-ideas/`)

Одноразовые HTML-прототипы экранов (выбор возраста, список задач, задача, меню и результаты) в рамке телефона. Это не код приложения. Папка исключена из ESLint, Prettier и git. Общий каркас лежит в `_shared/core.js` (каждый вариант задаёт `window.VARIANT`), обзор и оценка вариантов — в `review-01-04.md`, выбран дизайн 01 «Тихий» с тремя темами (море — основная, сирень, камень); остальные варианты — история поиска. Expo-экраны собираются по 01. Критики дизайна от skill impeccable сохраняются в `.impeccable/critique/`.

## Банк задач (вне репозитория)

Задачи и рисунки лежат в соседней папке `../sources` (Python-конвейер, описание в `../sources/STATUS.md`):

- `generated/<класс>/tasks.json` и SVG-рисунки (`NN.svg`, стиль «стекло» — `styled_glass/NN.svg`): придуманные задачи. **В приложение попадают только они.**
- `tasks/<класс>/`: разобранные задачи настоящего «Кенгуру». Это только образцы, в приложение их не включать.
- Формат задачи как в «Кенгуру»: варианты А–Д (в 1 классе А–Г, часть задач с вписываемым ответом), баллы 3/4/5 (в 1 классе `level`: лёгкая/средняя/трудная), `type`, `topics`, решение.
- Правила контента: никаких кенгуру и мультяшных персонажей, персонажи — разные животные. Придуманные задачи нельзя выдавать за задачи настоящих олимпиад.
- Скрипты запускаются как `python -X utf8 scripts/<script>.py` из `../sources`.
- Доставка в приложение: `npm run tasks:sync` копирует JSON (в формате приложения) и SVG из `generated/` в `assets/tasks/` и проверяет данные (ответ среди вариантов, вписываемый ответ — число, есть рисунок). Результат лежит в репозитории, так что сборка не зависит от `../sources`. Позже дополнительные задачи будут загружаться с сервера за оплату; как это устроено, ещё не решено — новый источник подключается через `addTaskSource()`.

Интерфейс и задачи должны поддерживать русский и английский с первой версии; задачи переведены на en/es/fr: тексты — `i18n` в исходном JSON, надписи на рисунках — словарь `../sources/generated/svg_i18n.json`, по которому `tasks:sync` пишет копии `assets/tasks/<класс>/<язык>/NN.svg` (приложение берёт рисунок по языку, `localize()`). Синхронизация падает, если нет перевода текста или надписи. Буквенные метки (варианты на рисунке, полянки, точки) на en/es/fr — латиница A, B, C… по позиции, как буквы кнопок; буквы-как-текст (ребусы, русские слова) остаются кириллицей.

## Agent skills

### Issue tracker

Задачи и спецификации — markdown-файлы в `.scratch/<feature>/`. См. `docs/agents/issue-tracker.md`.

### Triage labels

Стандартные пять меток (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). См. `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` и `docs/adr/` в корне. См. `docs/agents/domain.md`.
