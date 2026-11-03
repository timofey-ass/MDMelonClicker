# MDMelonClicker: бот (Mini App)

Игра в Телеграме без плагина: тап, генераторы, кейсы, коты, сеты, таблица лидеров, обмен котами и перенос прогресса из плагина.
Всё работает на одном бесплатном Cloudflare Worker + база D1.

## Установка (10 минут, без командной строки)

1. **Бот.** В Телеграме открой @BotFather, команда `/newbot`, придумай имя. Сохрани токен вида `123456:ABC...`.
2. **Worker.** dash.cloudflare.com, Workers & Pages, Create, Create Worker (Hello World), имя `md-clicker`, Deploy. Затем Edit code: удали всё, вставь содержимое `worker.js`, Deploy.
3. **База.** Storage & Databases, D1 SQL Database, Create, имя `mdclicker`. Потом Worker, Settings, Bindings, Add, D1 database: имя переменной **DB**, база `mdclicker`.
4. **Токен.** Worker, Settings, Variables and Secrets, Add: тип Secret, имя **BOT_TOKEN**, значение токен из шага 1. Deploy.
5. **Подключение.** Открой в браузере `https://ИМЯ.workers.dev/setup`. Должно показать `"ok": true` у webhook и menu.
6. **Играй.** Открой бота, `/start`, кнопка «Играть» (или кнопка меню слева от поля ввода).

Таблицы создаются сами при первом запуске.

## Перенос из плагина
Плагин (расширение 17 и новее): Ещё, «Код переноса в бота», Копировать. В боте: Ещё, Перенос из плагина, вставить код. Работает один раз на аккаунт.

## Файлы
- `worker.js`: готовый сервер вместе с игрой (вставлять в Cloudflare).
- `src/index.html`: игра отдельным файлом (для разработки).
