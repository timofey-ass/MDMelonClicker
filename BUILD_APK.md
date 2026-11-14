# Сборка Android-приложения

Приложение — тонкая обёртка (Trusted Web Activity) над сайтом из этого репозитория.
Весь код игры находится здесь: сервер в `bot/worker_tpl.js`, клиент в `bot/app.js`, `bot/part3.js`,
`bot/app_head.html`, сборка страницы — `bot/build.py`. Приложение только открывает опубликованный сайт.

Параметры обёртки лежат в `twa-manifest.json`. Сборка стандартным инструментом [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap):

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest=https://raspy-term-3ab3.timofea71.workers.dev/manifest.webmanifest
# или используйте готовый twa-manifest.json из репозитория
bubblewrap build
```

Результат — `app-release-signed.apk`. Подпись ставится вашим собственным ключом
(создаётся при `bubblewrap build`); ключ в репозиторий не добавляется.

Сайт собирается так: `cd bot && python3 build.py`, деплой — через GitHub Actions (`.github/workflows`).
