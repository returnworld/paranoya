# Решение проблемы CRLF/LF в Git

## Что означает предупреждение "CRLF will be replaced by LF"

**CRLF** (Carriage Return + Line Feed) - `\r\n` - стандарт окончания строк в Windows
**LF** (Line Feed) - `\n` - стандарт окончания строк в Unix/Linux/macOS

Git автоматически конвертирует CRLF ↔ LF для совместимости между операционными системами.

## Команды для настройки Git

### 1. Проверить текущие настройки

```bash
git config --list | grep core.autocrlf
```

### 2. Настройка для Windows (рекомендуется)

```bash
# Включить автоматическую конвертацию CRLF ↔ LF
git config --global core.autocrlf true

# Или только для текущего репозитория
git config core.autocrlf true
```

### 3. Настройка для Unix/Linux/macOS

```bash
# Только LF в репозитории, без конвертации
git config --global core.autocrlf input

# Или для текущего репозитория
git config core.autocrlf input
```

### 4. Отключить автоконвертацию (не рекомендуется)

```bash
git config --global core.autocrlf false
```

## Рекомендуемые настройки

### Для Windows:
```bash
git config --global core.autocrlf true
```

### Для Unix/Linux/macOS:
```bash
git config --global core.autocrlf input
```

## Проверка и исправление файлов

### Посмотреть статус окончаний строк:
```bash
git status
git diff --check
```

### Принудительно переконвертировать файлы:
```bash
# Удалить все файлы из индекса (не удаляя физически)
git rm --cached -r .

# Пересобрать индекс с правильными окончаниями строк
git add .

# Создать коммит с исправлениями
git commit -m "Fix line endings"
```

## Дополнительные настройки в .gitattributes

Создайте файл `.gitattributes` в корне проекта:

```
# Автоматическая обработка окончаний строк
* text=auto

# Явно указанные типы файлов
*.txt text
*.md text
*.js text
*.json text
*.css text
*.html text

# Бинарные файлы (не изменять)
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.pdf binary
```

## Итог

Предупреждение **не критично** - это нормальное поведение Git на Windows. Рекомендуется настроить `core.autocrlf=true` для Windows и `core.autocrlf=input` для Unix систем.

После настройки предупреждение исчезнет при следующих операциях с Git.