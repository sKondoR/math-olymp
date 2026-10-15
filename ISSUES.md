# Технический долг

Задачи, отложенные после чистки кода (`/simplify`, 2026-10-15). Это не баги: приложение работает, но в этих местах код дороже менять или легко сломать.

Отметка `- [x] Сделано` под заголовком — задача выполнена (с датой и коротко, что сделано).

Приоритеты: **P1** — сделать до следующего релиза, **P2** — при следующей работе в этой части кода, **P3** — когда будет время.

## P2

### Одна реклама за раз — на всё приложение, а не на кнопку

- [x] Сделано (2026-10-15): признак показа — один на модуль `use-portion.ts`, кнопки читают его через `useSyncExternalStore`; тест «shows one ad at a time in the whole app» проверяет второй экземпляр `usePortion`.

`usePortion` ([src/state/use-portion.ts](src/state/use-portion.ts)) держит флаг «реклама показывается» в `useRef` своего экземпляра. На экране возраста таких экземпляров несколько: диалог для заблокированной плитки и `PortionButton` в каждой `PortionCard`. Правило «одна реклама за раз» выполняется для каждой кнопки отдельно, и `watching` (неактивная кнопка) видит только та кнопка, которую нажали.

Сейчас это вряд ли проявится: диалог модальный, а ролик закрывает экран. Но правило держится на раскладке экранов, а не на коде.

**Как исправить:** держать признак показа в одном месте. Например, `RewardedAds.show()` возвращает уже идущий промис на уровне модуля, или `watching` хранится в store рядом с `openPortion`.

### Размер порции «20» зашит в текстах

- [x] Сделано (2026-10-15): `PORTION` экспортируется из `openings.ts`, строки на всех 4 языках подставляют его в шаблон (`${PORTION}`) — сигнатуры строк не менялись.

Число 20 записано в строках на 4 языках, примерно 12 мест ([src/i18n/strings.ts](src/i18n/strings.ts): «по 20», «после 20-й», «20 at a time» и т. п.). Сам размер задаётся константой `PORTION` в [src/state/openings.ts](src/state/openings.ts). Если её поменять, тексты станут неверными.

**Как исправить:** передавать размер в строки параметром (`portionText(size)`, `resultsNote(size)`) и снова экспортировать `PORTION`.

### Рекламу передавать через `StoreProvider`

- [x] Сделано (2026-10-15): `StoreProvider` получает `ads` пропом (`_layout.tsx` — `rewardedAds`, тесты — фейк), `usePortion(grade)` берёт её через `useAds()`; `src/state` больше не импортирует SDK, `vi.mock` для `yandex-mobile-ads`, `expo-network` и `react-native` из `store.test.tsx` убраны. Ленивое создание `yandexAds` не делал: SDK и так запускается при первом `show()`.

`usePortion(grade, ads = rewardedAds)` подключает рекламу сборки при импорте модуля. Хранилище и язык устройства уже передаются в `StoreProvider` снаружи, а реклама — нет. Поэтому импорт `src/state` тянет `yandex-mobile-ads` и `react-native`, и в [src/state/store.test.tsx](src/state/store.test.tsx) их приходится мокать через `vi.mock`.

**Как исправить:** передавать `ads` пропом в `StoreProvider`, как `storage`: `_layout.tsx` даёт `rewardedAds`, тесты — фейк. `usePortion` берёт рекламу из контекста. Заодно можно создавать `yandexAds` лениво, при первом `show()`.

### «Задача, порция или всё пройдено» — одним значением в сводке

- [ ] Сделано

Правило «когда открытых задач не осталось, предложить следующую порцию» (CONTEXT.md) каждый экран выводит сам из `next` и `portion`:

- [src/app/index.tsx](src/app/index.tsx): `!next && portion`
- [src/app/age/[grade].tsx](src/app/age/[grade].tsx): `next ? … : portion ? … : done`
- [src/app/task/[id].tsx](src/app/task/[id].tsx): `!after && portion`

Из-за этого `nav.resume` и `nav.nextTask` всё ещё описывают ветку «задач нет → экран возраста», которую экраны обходят.

**Как исправить:** `summarize` возвращает размеченное значение `ahead: { kind: 'task', task } | { kind: 'portion', portion } | { kind: 'done' }` и такое же «после задачи N». Экраны делают `switch` по `kind`.

## P3

### Общая тестовая фабрика `Task`

- [x] Сделано (2026-10-15): [src/data/test-tasks.ts](src/data/test-tasks.ts) — `testTask`, `testStoredTask` и `testBuiltinBank` (для мока `builtin.generated`); все четыре теста собирают задачи через них.

Похожие сборщики задач есть в четырёх тестах: [src/data/bank.test.ts](src/data/bank.test.ts), [src/state/store.test.tsx](src/state/store.test.tsx), [src/state/attempt.test.ts](src/state/attempt.test.ts) и [src/state/summary.test.ts](src/state/summary.test.ts). Мок пустого `builtin.generated` повторяется в `bank.test.ts` и `store.test.tsx`. Каждое новое обязательное поле `Task` (как недавно `family`) приходится добавлять во все копии.

**Как исправить:** одна фабрика `testTask(over: Partial<Task>)` рядом с типами (например, `src/data/test-tasks.ts`), как уже сделано с `memoryStorage`.

### Обёртка `summarizeWith` в тесте сводки

- [x] Сделано (2026-10-15): настоящая `summarize` импортируется под своим именем и вызывается напрямую, когда открыты порции; обёртка для одной бесплатной порции названа `summarizeFree`.

В [src/state/summary.test.ts](src/state/summary.test.ts) настоящая функция `summarize` импортирована как `summarizeWith`, а именем `summarize` названа тестовая обёртка с `openings = NO_OPENINGS`. Код легко прочитать неправильно.

**Как исправить:** назвать обёртку по смыслу (`summarizeFree`) или передавать `NO_ACCESS` явно в каждом вызове.
