# Wavelength — веб-поле

Онлайн-версия командного поля в духе настольной игры **Wavelength**: полукруглая шкала, скрытый цветной сектор (2–3–4–3–2), заслонка «открыть / закрыть» и общая стрелка с перетаскиванием.

## Запуск локально

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
npm run preview
```

## Публикация на GitHub Pages

Сайт собирается с базовым путём `/wavelength/`, чтобы открываться по адресу:

`https://aromana33.github.io/wavelength/`

### Настройка в репозитории GitHub

1. **Settings → Pages**: Source — **GitHub Actions** (не «Deploy from branch»).
2. Добавьте workflow (см. ниже) и запушьте в **`main`**, либо запустите workflow вручную после первого деплоя.
3. Через минуту-две страница будет доступна по ссылке выше.

Если репозиторий переименуют или используют пользовательский домен `username.github.io` без подпути, измените `base` в `vite.config.ts` и пересоберите.

### Если `git push` падает из‑за токена и `workflow`

Сообщение вида *refusing to allow a Personal Access Token … without `workflow` scope* значит: по HTTPS с PAT **нельзя** менять файлы в `.github/workflows/`, пока у токена нет scope **`workflow`**.

**Вариант 1 — расширить PAT (удобно оставить всё в репо):**  
GitHub → **Settings → Developer settings → Personal access tokens** → создайте новый или отредактируйте существующий classic-токен и включите **`workflow`**, затем снова `git push`.

**Вариант 2 — workflow только с сайта GitHub (пуш без Actions-файлов):**  
Файл workflow в этом репозитории намеренно не лежит в git, чтобы пуш проходил с обычным PAT. Создайте workflow вручную:

1. Репозиторий → вкладка **Actions** → **New workflow** → **set up a workflow yourself**.
2. Имя файла, например: `.github/workflows/deploy.yml`.
3. Вставьте содержимое ниже, **Commit changes** (это делает GitHub от своего имени, PAT не нужен).

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

После первого успешного прогона откройте **Settings → Pages** и убедитесь, что источник — **GitHub Actions**.

## Правила раунда (реализованные фазы)

`hidden` → `preview` → `hidden` → `guessing` → `locked` → `sideGuess` → `reveal` → `scoring` → `nextRound` → снова `hidden`.

- Психик настраивает цель, смотрит её с включённым флажком «я психик», закрывает заслонку.
- Вводятся два края спектра (текст), затем команда двигает стрелку и фиксирует ответ.
- Соперники выбирают, левее или правее центра цели находится «четвёрка» относительно стрелки.
- Очки: за попадание по клину 0 / 2 / 3 / 4; соперникам +1 за верный выбор стороны (если цель не совпала со стрелкой ровно).

Игра рассчитана на **одно общее устройство** (все смотрят в один экран); режим психика — честный «отвернитесь», при необходимости можно открыть вторую вкладку позже и синхронизировать через сеть — это уже следующий этап.
