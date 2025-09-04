#!/bin/bash

# Скрипт для створення репозиторію на GitHub та деплою

echo "🚀 Створення репозиторію на GitHub..."

# Перевіряємо чи встановлений GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI не встановлений. Встановіть його:"
    echo "brew install gh"
    echo "або перейдіть на https://github.com/new і створіть репозиторій вручну"
    exit 1
fi

# Перевіряємо авторизацію
if ! gh auth status &> /dev/null; then
    echo "🔐 Авторизуйтесь в GitHub CLI:"
    gh auth login
fi

# Створюємо репозиторій
echo "📦 Створення репозиторію xlsx-analytics-dashboard..."
gh repo create xlsx-analytics-dashboard --public --description "Веб-додаток для аналізу щоденних XLSX звітів з рекламних кампаній" --source=. --remote=origin --push

if [ $? -eq 0 ]; then
    echo "✅ Репозиторій створено успішно!"
    echo "🌐 URL: https://github.com/vadimfdit/xlsx-analytics-dashboard"
    echo "📱 GitHub Pages буде доступний за: https://vadimfdit.github.io/xlsx-analytics-dashboard/"
    echo ""
    echo "🔧 Налаштування GitHub Pages:"
    echo "1. Перейдіть в Settings репозиторію"
    echo "2. Знайдіть розділ Pages"
    echo "3. Виберіть Source: Deploy from a branch"
    echo "4. Виберіть Branch: gh-pages"
    echo "5. Натисніть Save"
else
    echo "❌ Помилка при створенні репозиторію"
    exit 1
fi
