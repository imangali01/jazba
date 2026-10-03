# 04: Настройки языка / стиля / тела учитываются в промпте

**What to build:** Пользователь управляет выводом через настройки: язык сообщения (по умолчанию русский), формат (авто по истории / Conventional Commits / простой императив), включать ли тело сообщения, мягкий лимит длины заголовка. Промпт эти настройки соблюдает.

**Blocked by:** 03.

**Status:** done (v0.0.6) — commiter.language / commiter.commitStyle (5 стилей: auto|conventional|plain|gitmoji|detailed) / commiter.length (short|medium|long). includeBody заменён на length=short. subjectMaxLength не вводился (покрывается length).

- [ ] Объявлены настройки: `commiter.language` (строка, по умолчанию `"russian"`, scope global), `commiter.commitStyle` (`auto` | `conventional` | `plain`, по умолчанию `auto`), `commiter.includeBody` (boolean, по умолчанию `true`), `commiter.subjectMaxLength` (number, по умолчанию 72)
- [ ] `commiter.language` попадает в промпт как язык вывода; произвольная строка (напр. `"german"`) тоже работает
- [ ] `commitStyle=auto` — копировать стиль истории; `conventional` / `plain` — задать формат, но содержание всё равно опирается на примеры из тикета 03
- [ ] `includeBody=false` — только заголовок; `true` — заголовок + маркированное тело
- [ ] `subjectMaxLength` передаётся в промпт как мягкий предел
- [ ] Сборка промпта остаётся чистой функцией; ветвление по всем настройкам покрыто юнит-тестами
- [ ] Ручная проверка: смена `commiter.language` на `english` и обратно меняет язык сгенерированного сообщения
