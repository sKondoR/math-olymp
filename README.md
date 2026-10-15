# math-olymp

MathOlymp — Android-приложение (Expo SDK 57) с тренажёром олимпиадной математики для детей 6–15 лет. Продукт описан в [PRODUCT.md](PRODUCT.md), устройство кода и команды разработки — в [CLAUDE.md](CLAUDE.md), реклама — в [ADS.md](ADS.md).

## Разработка

```bash
npm install
npm run android   # нативная dev-сборка и запуск на эмуляторе/телефоне
npm start         # только Metro, если dev-сборка уже установлена
```

Для локальной сборки с рекламой Яндекса в корне нужен `.env.local` со строкой `EXPO_PUBLIC_STORE=rustore`. Этот файл не хранится в git. После смены магазина или после добавления нативного модуля сборку нужно пересобрать (`npm run android`). Если оставить старый бинарник, свежий JS в нём упадёт, например с ошибкой `Cannot find native module ...`.

## Прод-сборки

Сборки делаются в облаке EAS. Перед первой сборкой:

```bash
npm install -g eas-cli   # нужна версия >= 24.11.0
eas login
```

| Магазин     | Команда                                                        | Профиль в [eas.json](eas.json) | Реклама                                          |
| ----------- | -------------------------------------------------------------- | ------------------------------ | ------------------------------------------------ |
| RuStore     | `eas build --platform android --profile production`            | `production`                   | Yandex Mobile Ads, блок `R-M-20228054-1`         |
| Google Play | `eas build --platform android --profile production-googleplay` | `production-googleplay`        | пока нет: заглушка, порции открываются бесплатно |

Обе команды собирают подписанный `.aab`. Ссылку на файл EAS выдаёт по окончании сборки, файл также лежит на expo.dev в разделе Builds.

### Особенности

- **Магазин сборки** задаёт переменная `EXPO_PUBLIC_STORE` ([ADR 0001](docs/adr/0001-ad-sdk-per-store.md)). Она определяет и нативную часть ([react-native.config.js](react-native.config.js) линкует Yandex SDK только при `rustore`), и JS ([src/ads/index.ts](src/ads/index.ts)). Поэтому сборка под каждый магазин своя, и сборку для RuStore нельзя загружать в Google Play: Yandex SDK не входит в список SDK, разрешённых Families Policy.
- **Значение по умолчанию — RuStore.** Профиль `base` задаёт `EXPO_PUBLIC_STORE=rustore` для всех профилей, `production-googleplay` переопределяет его на `googleplay`. `.env.local` в облачную сборку не попадает, там действует только `env` из профиля.
- **Защита от сборки без рекламы.** [app.config.js](app.config.js) прерывает сборку `production` для RuStore, если не задан `EXPO_PUBLIC_YANDEX_REWARDED_ID`. Без этого ID все порции открывались бы бесплатно.
- **Google Play пока не публикуем.** Это этап 2: в сборку нужно добавить AdMob и проверить её на соответствие Families Policy, потому что JS-обёртка `yandex-mobile-ads` пока попадает в бандл любой сборки (PRODUCT.md, раздел «Магазины и сборки»). Профиль `production-googleplay` уже работает, но приложение из него собирается без рекламы.
- **Версии.** Номер версии для пользователя (`version` в [app.json](app.json)) меняется вручную. `versionCode` хранится на сервере EAS (`appVersionSource: remote`) и увеличивается при каждой production-сборке (`autoIncrement`). Счётчик один на оба магазина, так что номера сборок в двух магазинах не совпадут, и это нормально.
- **Подпись.** EAS подписывает сборки ключом, который хранит у себя (`eas credentials`). Ключ один на оба профиля. Локальная `gradlew bundleRelease` подписывает сборку debug-ключом из сгенерированной папки `android/`, такую сборку в магазины не загружать.
- **RuStore и AAB.** Прежде чем загружать `.aab`, в RuStore Консоль нужно загрузить ключ подписи (скачать его из EAS можно через `eas credentials` → Android → production → Keystore → Download). Если ключ загружать не хочется, есть другой путь: собрать APK. Для этого в профиль нужно добавить `"android": { "buildType": "apk" }`.
- **Google Play.** Первую версию нужно загрузить в Play Console вручную. Следующие можно отправлять командой `eas submit --platform android --profile production`, но для этого нужен ключ сервисного аккаунта Google.
- **Перед публикацией в RuStore** нужно пройти проверку на телефоне и дополнить политику конфиденциальности, оба пункта описаны в [ADS.md](ADS.md) в разделе «Что осталось до публикации в RuStore».
