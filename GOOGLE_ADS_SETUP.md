# 🔗 Налаштування Google Ads API

## Крок 1: Створення Google Cloud Project

1. Перейдіть до [Google Cloud Console](https://console.cloud.google.com/)
2. Створіть новий проект або виберіть існуючий
3. Увімкніть Google Ads API:
   - Перейдіть до "APIs & Services" > "Library"
   - Знайдіть "Google Ads API" та увімкніть його

## Крок 2: Створення OAuth 2.0 Credentials

1. Перейдіть до "APIs & Services" > "Credentials"
2. Натисніть "Create Credentials" > "OAuth 2.0 Client IDs"
3. Виберіть тип додатку "Web application"
4. Додайте авторизовані URI перенаправлення:
   - `http://localhost:4200/auth/callback`
   - `https://yourdomain.com/auth/callback`
5. Збережіть `Client ID` та `Client Secret`

## Крок 3: Отримання Developer Token

1. Перейдіть до [Google Ads API Center](https://developers.google.com/google-ads/api/docs/first-call/dev-token)
2. Заповніть форму для отримання Developer Token
3. Дочекайтеся схвалення (зазвичай 1-2 дні)
4. Збережіть `Developer Token`

## Крок 4: Отримання Customer ID

1. Увійдіть в [Google Ads](https://ads.google.com/)
2. Перейдіть до "Tools & Settings" > "Setup" > "Account settings"
3. Знайдіть `Customer ID` (формат: XXX-XXX-XXXX)

## Крок 5: Отримання Refresh Token

1. Створіть URL для авторизації:
```
https://accounts.google.com/o/oauth2/auth?
client_id=YOUR_CLIENT_ID&
redirect_uri=http://localhost:4200/auth/callback&
scope=https://www.googleapis.com/auth/adwords&
response_type=code&
access_type=offline
```

2. Відкрийте URL в браузері та авторизуйтесь
3. Скопіюйте `authorization code` з URL
4. Обміняйте код на refresh token:

```bash
curl -X POST https://oauth2.googleapis.com/token \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=AUTHORIZATION_CODE" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=http://localhost:4200/auth/callback"
```

## Крок 6: Налаштування в додатку

1. Оновіть `google-ads.service.ts`:

```typescript
private getGoogleAdsConfig(): GoogleAdsConfig {
  return {
    clientId: 'YOUR_ACTUAL_CLIENT_ID',
    clientSecret: 'YOUR_ACTUAL_CLIENT_SECRET',
    developerToken: 'YOUR_ACTUAL_DEVELOPER_TOKEN',
    customerId: 'YOUR_ACTUAL_CUSTOMER_ID',
    refreshToken: 'YOUR_ACTUAL_REFRESH_TOKEN'
  };
}
```

## Крок 7: Environment Variables (Рекомендовано)

Створіть файл `.env`:

```env
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CUSTOMER_ID=your_customer_id
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
```

І оновіть сервіс:

```typescript
private getGoogleAdsConfig(): GoogleAdsConfig {
  return {
    clientId: process.env['GOOGLE_ADS_CLIENT_ID'] || '',
    clientSecret: process.env['GOOGLE_ADS_CLIENT_SECRET'] || '',
    developerToken: process.env['GOOGLE_ADS_DEVELOPER_TOKEN'] || '',
    customerId: process.env['GOOGLE_ADS_CUSTOMER_ID'] || '',
    refreshToken: process.env['GOOGLE_ADS_REFRESH_TOKEN'] || ''
  };
}
```

## Перевірка налаштування

Після налаштування:

1. Запустіть додаток: `npm start`
2. Перейдіть до секції "Бенчмаркинг"
3. Перевірте статус API (повинен бути "Підключено")
4. Спробуйте змінити галузь для тестування

## Troubleshooting

### Помилка "Invalid Client"
- Перевірте Client ID та Client Secret
- Переконайтеся, що OAuth 2.0 credentials правильно налаштовані

### Помилка "Invalid Developer Token"
- Дочекайтеся схвалення Developer Token
- Перевірте правильність введення

### Помилка "Invalid Customer ID"
- Перевірте Customer ID в Google Ads
- Переконайтеся, що у вас є доступ до цього акаунту

### Помилка "Invalid Refresh Token"
- Отримайте новий refresh token
- Перевірте правильність введення

## Безпека

⚠️ **Важливо:**
- Ніколи не комітьте реальні credentials в Git
- Використовуйте environment variables
- Регулярно оновлюйте refresh tokens
- Обмежте доступ до API тільки необхідними scope
