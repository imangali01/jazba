# 06: Упаковка — сборка `.vsix`, цветной логотип, README

**What to build:** Расширение можно собрать в `.vsix` и поставить в чистое окно VS Code, где всё работает: кнопка-палочка, панель, генерация. В README есть цветной логотип и инструкция для пользователя.

**Blocked by:** 05.

**Status:** ready-for-agent

- [ ] Цветной PNG-логотип с прозрачным фоном (из `magit.jpg`), подключён в `package.json` как `icon`
- [ ] README: назначение, установка, использование (кнопка в поле коммита + панель), список настроек, требование установленного и авторизованного `claude` CLI
- [ ] `package.json`: `publisher` `bmg`, `name` `commiter`, `displayName`, `description`, `categories`, `repository`
- [ ] Скрипт сборки: `npm run package` даёт `commiter-<version>.vsix` через `@vscode/vsce`
- [ ] `.vscodeignore` исключает исходники/тесты/`.scratch` из пакета
- [ ] Проверка: `code --install-extension commiter-<version>.vsix` в чистом окне, сквозной сценарий генерации проходит
