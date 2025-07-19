import React, { useState } from 'react'
import { Book, Download, ExternalLink, Search, FileText, Video, Code } from 'lucide-react'

interface DocumentationProps {
  telegramId?: number
}

export const DocumentationSystem: React.FC<DocumentationProps> = ({ telegramId }) => {
  const [activeSection, setActiveSection] = useState<'getting-started' | 'payment' | 'api' | 'troubleshooting'>('getting-started')
  const [searchTerm, setSearchTerm] = useState('')

  const documentationSections = {
    'getting-started': {
      title: 'Начало работы',
      icon: <Book className="w-5 h-5" />,
      content: [
        {
          title: 'Регистрация и первые шаги',
          content: `
# Добро пожаловать в VIP Клуб!

## Как начать работу

1. **Запустите бота** - Нажмите /start в Telegram боте
2. **Изучите возможности** - Ознакомьтесь с доступными функциями
3. **Произведите оплату** - Для получения VIP доступа
4. **Получите доступ** - После подтверждения оплаты

## Что включает VIP доступ

- 🔒 Доступ к закрытым материалам
- 💬 Участие в приватных чатах
- ⚡ Приоритетная поддержка
- 📊 Расширенная аналитика
- 🎯 Эксклюзивный контент

## Срок действия

VIP доступ действует **30 дней** с момента подтверждения оплаты.
          `
        },
        {
          title: 'Интерфейс и навигация',
          content: `
# Интерфейс системы

## Основные разделы

### 🏠 Главная страница
- Информация о VIP доступе
- Кнопка оплаты
- Инструкции

### ⚙️ Личный кабинет
- Статус VIP доступа
- История платежей
- Ссылки доступа

### 🛡️ Безопасность
- Журнал активности
- Настройки безопасности
- Мониторинг сессий

### 📞 Поддержка
- Создание обращений
- FAQ
- Контакты

## Навигация

Используйте кнопки в правом верхнем углу для быстрого доступа к разделам.
          `
        }
      ]
    },
    'payment': {
      title: 'Оплата и доступ',
      icon: <FileText className="w-5 h-5" />,
      content: [
        {
          title: 'Процесс оплаты',
          content: `
# Как произвести оплату

## Шаг 1: Инициация платежа
1. Нажмите кнопку "Оплатить доступ"
2. Выберите удобный способ оплаты
3. Следуйте инструкциям платежной системы

## Шаг 2: Подтверждение
1. Сделайте скриншот успешной оплаты
2. Отправьте скриншот в бот
3. Дождитесь подтверждения (до 5 минут)

## Способы оплаты

### 💳 Банковские карты
- Visa, MasterCard, МИР
- Мгновенное зачисление
- Комиссия 0%

### 🏦 СБП (Система быстрых платежей)
- Переводы по номеру телефона
- Без комиссии
- Мгновенное зачисление

### ₿ Криптовалюта
- Bitcoin, Ethereum, USDT
- Анонимность
- Подтверждение до 30 минут

### 💰 Электронные кошельки
- QIWI, YooMoney, WebMoney
- Быстрые переводы
- Минимальная комиссия

## Стоимость

**500 рублей** за 30 дней VIP доступа
          `
        },
        {
          title: 'Решение проблем с оплатой',
          content: `
# Проблемы с оплатой

## Платеж не прошел

### Возможные причины:
- Недостаточно средств на карте
- Карта заблокирована банком
- Технические проблемы платежной системы
- Неверные данные карты

### Что делать:
1. Проверьте баланс карты
2. Обратитесь в банк
3. Попробуйте другой способ оплаты
4. Обратитесь в поддержку

## Платеж прошел, но доступ не предоставлен

### Проверьте:
1. Отправили ли вы скриншот в бот
2. Прошло ли достаточно времени (до 5 минут)
3. Корректность скриншота

### Если проблема не решена:
1. Обратитесь в поддержку
2. Приложите скриншот оплаты
3. Укажите время и сумму платежа

## Возврат средств

Возврат возможен в течение **24 часов** при наличии веских оснований:
- Технические проблемы системы
- Двойное списание
- Ошибочный платеж
          `
        }
      ]
    },
    'api': {
      title: 'API и интеграции',
      icon: <Code className="w-5 h-5" />,
      content: [
        {
          title: 'API документация',
          content: `
# API для разработчиков

## Базовый URL
\`\`\`
https://api.vip-club.com/v1
\`\`\`

## Аутентификация
Используйте API ключ в заголовке:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Основные эндпоинты

### Проверка статуса пользователя
\`\`\`http
GET /users/{telegram_id}/status
\`\`\`

**Ответ:**
\`\`\`json
{
  "telegram_id": 123456789,
  "vip_access": true,
  "expires_at": "2025-02-18T10:30:00Z",
  "access_level": "premium"
}
\`\`\`

### Создание платежа
\`\`\`http
POST /payments
\`\`\`

**Тело запроса:**
\`\`\`json
{
  "telegram_id": 123456789,
  "amount": 500,
  "currency": "RUB",
  "payment_method": "card"
}
\`\`\`

### Webhook уведомления
Настройте webhook URL для получения уведомлений о платежах:
\`\`\`http
POST /webhooks/configure
\`\`\`

## Коды ошибок

- \`400\` - Неверный запрос
- \`401\` - Неавторизован
- \`403\` - Доступ запрещен
- \`404\` - Не найдено
- \`429\` - Превышен лимит запросов
- \`500\` - Внутренняя ошибка сервера
          `
        },
        {
          title: 'Webhook интеграция',
          content: `
# Настройка Webhook

## Что такое Webhook

Webhook - это HTTP callback, который отправляется на ваш сервер при определенных событиях в системе.

## Поддерживаемые события

### payment.completed
Платеж успешно завершен
\`\`\`json
{
  "event": "payment.completed",
  "data": {
    "payment_id": "pay_123",
    "telegram_id": 123456789,
    "amount": 500,
    "currency": "RUB",
    "timestamp": "2025-01-18T10:30:00Z"
  }
}
\`\`\`

### access.granted
VIP доступ предоставлен
\`\`\`json
{
  "event": "access.granted",
  "data": {
    "telegram_id": 123456789,
    "access_level": "premium",
    "expires_at": "2025-02-18T10:30:00Z",
    "access_link": "https://t.me/joinchat/VIP_ABC123"
  }
}
\`\`\`

### access.expired
VIP доступ истек
\`\`\`json
{
  "event": "access.expired",
  "data": {
    "telegram_id": 123456789,
    "expired_at": "2025-01-18T10:30:00Z"
  }
}
\`\`\`

## Безопасность

Все webhook запросы подписываются HMAC-SHA256:
\`\`\`
X-Signature: sha256=abc123...
\`\`\`

Проверяйте подпись для обеспечения безопасности.
          `
        }
      ]
    },
    'troubleshooting': {
      title: 'Решение проблем',
      icon: <Video className="w-5 h-5" />,
      content: [
        {
          title: 'Частые проблемы',
          content: `
# Решение частых проблем

## Проблемы с доступом

### Не могу войти в VIP чат
**Возможные причины:**
- VIP доступ истек
- Ссылка недействительна
- Технические проблемы Telegram

**Решение:**
1. Проверьте статус VIP в личном кабинете
2. Запросите новую ссылку через бота
3. Обратитесь в поддержку

### Бот не отвечает
**Возможные причины:**
- Технические работы
- Высокая нагрузка
- Проблемы с интернетом

**Решение:**
1. Подождите 5-10 минут
2. Перезапустите бота командой /start
3. Проверьте интернет соединение

## Проблемы с платежами

### Деньги списались, но доступ не предоставлен
**Что делать:**
1. Проверьте email с подтверждением
2. Отправьте скриншот в бот
3. Подождите до 30 минут
4. Обратитесь в поддержку с чеком

### Ошибка при оплате
**Частые причины:**
- Недостаточно средств
- Карта заблокирована
- Неверные данные

**Решение:**
1. Проверьте баланс карты
2. Убедитесь в правильности данных
3. Попробуйте другую карту
4. Обратитесь в банк

## Технические проблемы

### Сайт не загружается
1. Очистите кеш браузера
2. Попробуйте другой браузер
3. Проверьте интернет соединение
4. Используйте VPN если доступ ограничен

### Ошибки в личном кабинете
1. Обновите страницу
2. Выйдите и войдите заново
3. Очистите cookies
4. Обратитесь в поддержку
          `
        },
        {
          title: 'Контакты поддержки',
          content: `
# Как связаться с поддержкой

## Способы связи

### 🤖 Telegram бот
- **@support_bot** - основной канал поддержки
- Ответ в течение 2 часов
- Доступен 24/7

### 📧 Email
- **support@vip-club.com**
- Ответ в течение 4 часов
- Для сложных вопросов

### 📞 Телефон
- **+7 (999) 123-45-67**
- Рабочие дни: 9:00 - 18:00 МСК
- Экстренные случаи

### 💬 Онлайн чат
- Доступен на сайте
- Рабочие дни: 9:00 - 21:00 МСК
- Мгновенные ответы

## Что указать в обращении

### Для проблем с оплатой:
- Сумма и время платежа
- Способ оплаты
- Скриншот чека
- Ваш Telegram ID

### Для технических проблем:
- Описание проблемы
- Шаги для воспроизведения
- Скриншоты ошибок
- Браузер и устройство

### Для вопросов по доступу:
- Ваш Telegram ID
- Дата покупки VIP
- Описание проблемы

## Время ответа

- **Критические проблемы**: до 30 минут
- **Проблемы с оплатой**: до 2 часов
- **Общие вопросы**: до 4 часов
- **Предложения**: до 24 часов

## Статус системы

Проверить статус всех сервисов: **status.vip-club.com**
          `
        }
      ]
    }
  }

  const filteredContent = Object.entries(documentationSections).reduce((acc, [key, section]) => {
    const filteredItems = section.content.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (filteredItems.length > 0) {
      acc[key] = { ...section, content: filteredItems }
    }
    
    return acc
  }, {} as typeof documentationSections)

  const downloadPDF = () => {
    // In a real app, generate and download PDF
    alert('PDF документация будет загружена')
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Book className="w-6 h-6" />
          Документация
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={downloadPDF}
            className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Скачать PDF
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск в документации..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-2">
            {Object.entries(documentationSections).map(([key, section]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as any)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2 ${
                  activeSection === key
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {section.icon}
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {searchTerm ? (
            /* Search Results */
            <div>
              <h4 className="text-lg font-semibold mb-4">
                Результаты поиска для "{searchTerm}"
              </h4>
              {Object.keys(filteredContent).length === 0 ? (
                <p className="text-gray-400">Ничего не найдено</p>
              ) : (
                Object.entries(filteredContent).map(([sectionKey, section]) => (
                  <div key={sectionKey} className="mb-6">
                    <h5 className="font-medium text-emerald-400 mb-3">{section.title}</h5>
                    {section.content.map((item, index) => (
                      <div key={index} className="bg-gray-700/30 rounded-lg p-4 mb-3">
                        <h6 className="font-medium mb-2">{item.title}</h6>
                        <div className="text-sm text-gray-300 whitespace-pre-line">
                          {item.content.substring(0, 200)}...
                        </div>
                        <button
                          onClick={() => {
                            setActiveSection(sectionKey as any)
                            setSearchTerm('')
                          }}
                          className="text-emerald-400 hover:text-emerald-300 text-sm mt-2"
                        >
                          Читать полностью →
                        </button>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Section Content */
            <div>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {documentationSections[activeSection].icon}
                {documentationSections[activeSection].title}
              </h4>
              
              <div className="space-y-6">
                {documentationSections[activeSection].content.map((item, index) => (
                  <div key={index} className="bg-gray-700/30 rounded-lg p-6">
                    <h5 className="font-medium mb-4 text-emerald-400">{item.title}</h5>
                    <div className="prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
                        {item.content}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 pt-6 border-t border-gray-600">
        <h5 className="font-medium mb-4">Полезные ссылки</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://t.me/support_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 p-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Поддержка в Telegram
          </a>
          <a
            href="mailto:support@vip-club.com"
            className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 p-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Email поддержка
          </a>
          <a
            href="https://status.vip-club.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 p-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Статус системы
          </a>
        </div>
      </div>
    </div>
  )
}