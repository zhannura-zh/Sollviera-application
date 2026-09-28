# Sollviera Staff

Мобильное приложение для персонала отелей — Expo Router + React Native

## Роли

| Роль | Экраны | Статус API |
|---|---|---|
| **Клинер** | Номера, Активное, Техслужба, Склад, Профиль | ✅ на реальном API |
| **Супервайзер** | Мониторинг номеров, Инспекция, Техслужба, Команда, Профиль | 🟡 частично — приглашение персонала пока без бэкенда |
| **Техник** | Заявки, В работе, Создать, Склад, Профиль | ✅ на реальном API |
| **Официант / метрдотель** | Сегодня, Зал, Профиль | ⚪️ демо-данные — эндпоинтов под ресторан в API ещё нет |
| **Парковка** | Двор, Заезд, Профиль | ✅ на реальном API (`/parking/spots`, `/parking/tickets`) |

Подробная построчная сверка (что реально пишет в бэкенд, а что живёт только на экране) — см. `lib/api-client.ts` и комментарии в `context/app-store.tsx`.

## Стек

- [Expo](https://expo.dev) 54 · [Expo Router](https://docs.expo.dev/router/introduction/) (file-based, `Stack.Protected` для гейта авторизации)
- React Native 0.81 · React 19 · TypeScript
- NativeWind (Tailwind для React Native)
- Axios-клиент к REST API (`lib/api-client.ts`)

## Быстрый старт

```bash
yarn install

# при необходимости — свой бэкенд/тенант
cp .env.example .env   # EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_TENANT_SLUG

yarn start
```

Дальше — выбор платформы из вывода Expo CLI, либо напрямую:

```bash
yarn ios       # нативная сборка через Xcode (ios/ уже в репозитории)
yarn android   # нативная сборка через Gradle (android/ уже в репозитории)
yarn web
```

`ios/` и `android/` закоммичены (без `Pods/`, `build/`, `.gradle/` — см. `.gitignore`), так что `npx expo prebuild` не требуется. Для iOS перед первой сборкой: `cd ios && pod install`.

## Структура

```
app/
  (auth)/            # логин — доступен, только если НЕ залогинен
  (app)/              # всё остальное — доступен, только если залогинен
    (tabs)/            # табы клинера
    (supervisor)/       # табы супервайзера
    (tech)/             # табы техника
    (waiter)/           # табы официанта
    (parking)/          # табы парковки
    profile/, room/, ticket/, inspect/, monitor/, staff/, staff-member/  # общие пуш-экраны
screens/
  cleaner/ supervisor/ technician/ waiter/ parking/   # экраны по ролям, роуты — только тонкие обёртки
components/           # общие + табы по ролям (role-tab-bar.tsx — общая база)
context/app-store.tsx  # весь стейт приложения (сессия, роли, данные)
lib/api-client.ts      # единственная точка обращения к бэкенду
types/index.ts
```

## Демо-аккаунты

На экране логина есть быстрый вход по каждой роли (общий демо-пароль). Приложение само определяет роль по `role`/`roleCode` из ответа `/staff/me` (см. `classifyRole` в `context/app-store.tsx`) и решает, в какую табовую группу отправить.
