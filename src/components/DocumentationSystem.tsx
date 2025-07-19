import React, { useState, useEffect } from 'react'
import { Book, Download, ExternalLink, Search, FileText, Video, Code, Eye, Globe } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Helmet } from 'react-helmet-async'
import html2pdf from 'html2pdf.js'

interface DocumentationProps {
  telegramId?: number
}

interface SearchHistoryItem {
  term: string
  timestamp: number
}

const translations = {
  ru: {
    documentation: 'Документация',
    downloadPDF: 'Скачать PDF',
    search: 'Поиск в документации...',
    searchResults: 'Результаты поиска для',
    nothingFound: 'Ничего не найдено',
    readMore: 'Читать полностью →',
    usefulLinks: 'Полезные ссылки',
    telegramSupport: 'Поддержка в Telegram',
    emailSupport: 'Email поддержка',
    systemStatus: 'Статус системы',
    searchHistory: 'История поиска',
    clearHistory: 'Очистить',
    gettingStarted: 'Начало работы',
    payment: 'Оплата и доступ',
    api: 'API и интеграции',
    troubleshooting: 'Решение проблем'
  },
  en: {
    documentation: 'Documentation',
    downloadPDF: 'Download PDF',
    search: 'Search documentation...',
    searchResults: 'Search results for',
    nothingFound: 'Nothing found',
    readMore: 'Read more →',
    usefulLinks: 'Useful links',
    telegramSupport: 'Telegram Support',
    emailSupport: 'Email Support',
    systemStatus: 'System Status',
    searchHistory: 'Search History',
    clearHistory: 'Clear',
    gettingStarted: 'Getting Started',
    payment: 'Payment & Access',
    api: 'API & Integrations',
    troubleshooting: 'Troubleshooting'
  }
}

export const DocumentationSystem: React.FC<DocumentationProps> = ({ telegramId }) => {
  const [activeSection, setActiveSection] = useState<'getting-started' | 'payment' | 'api' | 'troubleshooting'>('getting-started')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [language, setLanguage] = useState<'ru' | 'en'>('ru')
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)

  const t = translations[language]

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('documentation-search-history')
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }
  }, [])

  // Save search to history
  const saveSearchToHistory = (term: string) => {
    if (term.trim().length < 2) return
    
    const newHistory = [
      { term: term.trim(), timestamp: Date.now() },
      ...searchHistory.filter(item => item.term !== term.trim())
    ].slice(0, 5) // Keep only last 5 searches
    
    setSearchHistory(newHistory)
    localStorage.setItem('documentation-search-history', JSON.stringify(newHistory))
  }

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('documentation-search-history')
  }

  const documentationSections = {
    'getting-started': {
      title: language === 'ru' ? 'Начало работы' : 'Getting Started',
      icon: <Book className="w-5 h-5" />,
      preview: language === 'ru' ? 'Регистрация, первые шаги, интерфейс' : 'Registration, first steps, interface',
      content: [
        {
          title: language === 'ru' ? 'Регистрация и первые шаги' : 'Registration and First Steps',
          content: language === 'ru' ? `
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
          ` : `
# Welcome to VIP Club!

## How to get started

1. **Launch the bot** - Click /start in Telegram bot
2. **Explore features** - Get familiar with available functions
3. **Make payment** - To get VIP access
4. **Get access** - After payment confirmation

## What VIP access includes

- 🔒 Access to private materials
- 💬 Participation in private chats
- ⚡ Priority support
- 📊 Advanced analytics
- 🎯 Exclusive content

## Validity period

VIP access is valid for **30 days** from payment confirmation.
          `
        },
        {
          title: language === 'ru' ? 'Интерфейс и навигация' : 'Interface and Navigation',
          content: language === 'ru' ? `
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
          ` : `
# System Interface

## Main sections

### 🏠 Home page
- VIP access information
- Payment button
- Instructions

### ⚙️ Personal cabinet
- VIP access status
- Payment history
- Access links

### 🛡️ Security
- Activity log
- Security settings
- Session monitoring

### 📞 Support
- Create tickets
- FAQ
- Contacts

## Navigation

Use buttons in the top right corner for quick access to sections.
          `
        }
      ]
    },
    'payment': {
      title: language === 'ru' ? 'Оплата и доступ' : 'Payment & Access',
      icon: <FileText className="w-5 h-5" />,
      preview: language === 'ru' ? 'Способы оплаты, решение проблем' : 'Payment methods, troubleshooting',
      content: [
        {
          title: language === 'ru' ? 'Процесс оплаты' : 'Payment Process',
          content: language === 'ru' ? `
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
          ` : `
# How to make payment

## Step 1: Payment initiation
1. Click "Pay for access" button
2. Choose convenient payment method
3. Follow payment system instructions

## Step 2: Confirmation
1. Take screenshot of successful payment
2. Send screenshot to bot
3. Wait for confirmation (up to 5 minutes)

## Payment methods

### 💳 Bank cards
- Visa, MasterCard, МИР
- Instant crediting
- 0% commission

### 🏦 SBP (Fast Payment System)
- Transfers by phone number
- No commission
- Instant crediting

### ₿ Cryptocurrency
- Bitcoin, Ethereum, USDT
- Anonymity
- Confirmation up to 30 minutes

### 💰 Electronic wallets
- QIWI, YooMoney, WebMoney
- Fast transfers
- Minimal commission

## Cost

**500 rubles** for 30 days VIP access
          `
        }
      ]
    },
    'api': {
      title: language === 'ru' ? 'API и интеграции' : 'API & Integrations',
      icon: <Code className="w-5 h-5" />,
      preview: language === 'ru' ? 'API документация, webhook интеграция' : 'API documentation, webhook integration',
      content: [
        {
          title: language === 'ru' ? 'API документация' : 'API Documentation',
          content: `
# API ${language === 'ru' ? 'для разработчиков' : 'for developers'}

## ${language === 'ru' ? 'Базовый URL' : 'Base URL'}
\`\`\`
https://api.vip-club.com/v1
\`\`\`

## ${language === 'ru' ? 'Аутентификация' : 'Authentication'}
${language === 'ru' ? 'Используйте API ключ в заголовке:' : 'Use API key in header:'}
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## ${language === 'ru' ? 'Основные эндпоинты' : 'Main endpoints'}

### ${language === 'ru' ? 'Проверка статуса пользователя' : 'Check user status'}
\`\`\`http
GET /users/{telegram_id}/status
\`\`\`

**${language === 'ru' ? 'Ответ:' : 'Response:'}**
\`\`\`json
{
  "telegram_id": 123456789,
  "vip_access": true,
  "expires_at": "2025-02-18T10:30:00Z",
  "access_level": "premium"
}
\`\`\`

### ${language === 'ru' ? 'Создание платежа' : 'Create payment'}
\`\`\`http
POST /payments
\`\`\`

**${language === 'ru' ? 'Тело запроса:' : 'Request body:'}**
\`\`\`json
{
  "telegram_id": 123456789,
  "amount": 500,
  "currency": "RUB",
  "payment_method": "card"
}
\`\`\`
          `
        }
      ]
    },
    'troubleshooting': {
      title: language === 'ru' ? 'Решение проблем' : 'Troubleshooting',
      icon: <Video className="w-5 h-5" />,
      preview: language === 'ru' ? 'Частые проблемы, контакты поддержки' : 'Common issues, support contacts',
      content: [
        {
          title: language === 'ru' ? 'Частые проблемы' : 'Common Issues',
          content: language === 'ru' ? `
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
          ` : `
# Solving common problems

## Access issues

### Can't enter VIP chat
**Possible causes:**
- VIP access expired
- Link is invalid
- Telegram technical issues

**Solution:**
1. Check VIP status in personal cabinet
2. Request new link through bot
3. Contact support

### Bot doesn't respond
**Possible causes:**
- Technical maintenance
- High load
- Internet problems

**Solution:**
1. Wait 5-10 minutes
2. Restart bot with /start command
3. Check internet connection
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

  // Highlight search matches
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text
    
    const regex = new RegExp(`(${searchTerm})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-400 text-black px-1 rounded">$1</mark>')
  }

  const downloadPDF = async () => {
    setIsLoading(true)
    try {
      const element = document.getElementById('documentation-content')
      if (!element) return

      const opt = {
        margin: 1,
        filename: `documentation-${language}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }

      await html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert(language === 'ru' ? 'Ошибка при создании PDF' : 'PDF generation error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term.trim()) {
      saveSearchToHistory(term)
    }
  }

  // Custom markdown components
  const markdownComponents = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '')
      return !inline ? (
        <pre className="bg-gray-800 rounded-lg p-4 overflow-x-auto my-4">
          <code className={`text-sm ${className || ''} text-green-400`} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="bg-gray-700 px-2 py-1 rounded text-green-400 text-sm" {...props}>
          {children}
        </code>
      )
    },
    pre: ({ children }: any) => (
      <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto my-4">
        {children}
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{t.documentation} - VIP Club</title>
        <meta name="description" content={language === 'ru' ? 'Полная документация по использованию VIP Club системы' : 'Complete documentation for VIP Club system usage'} />
        <meta property="og:title" content={`${t.documentation} - VIP Club`} />
        <meta property="og:description" content={language === 'ru' ? 'Полная документация по использованию VIP Club системы' : 'Complete documentation for VIP Club system usage'} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>

      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Book className="w-5 h-5 sm:w-6 sm:h-6" />
            {t.documentation}
          </h3>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
              className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-200"
              title={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            >
              <Globe className="w-4 h-4" />
              {language === 'ru' ? 'EN' : 'RU'}
            </button>
            <button
              onClick={downloadPDF}
              disabled={isLoading}
              className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-200"
            >
              <Download className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t.downloadPDF}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white text-sm sm:text-base transition-all duration-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && !searchTerm && (
          <div className="mb-6 p-4 bg-gray-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium text-gray-300">{t.searchHistory}</h5>
              <button
                onClick={clearSearchHistory}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                {t.clearHistory}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSearchTerm(item.term)}
                  className="text-xs bg-gray-600 hover:bg-gray-500 text-gray-300 px-2 py-1 rounded transition-colors"
                >
                  {item.term}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-2 lg:sticky lg:top-4">
              {Object.entries(documentationSections).map(([key, section]) => (
                <div
                  key={key}
                  className="relative"
                  onMouseEnter={() => setHoveredSection(key)}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                  <button
                    onClick={() => setActiveSection(key as any)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      activeSection === key
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    {section.icon}
                    <span className="text-sm sm:text-base">{section.title}</span>
                    <Eye className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  
                  {/* Tooltip */}
                  {hoveredSection === key && (
                    <div className="absolute left-full ml-2 top-0 z-10 bg-gray-800 text-white text-xs p-2 rounded-lg shadow-lg whitespace-nowrap animate-fadeIn">
                      {section.preview}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1" id="documentation-content">
            {searchTerm ? (
              /* Search Results */
              <div className="animate-fadeIn">
                <h4 className="text-base sm:text-lg font-semibold mb-4">
                  {t.searchResults} "{searchTerm}"
                </h4>
                {Object.keys(filteredContent).length === 0 ? (
                  <p className="text-gray-400">{t.nothingFound}</p>
                ) : (
                  Object.entries(filteredContent).map(([sectionKey, section]) => (
                    <div key={sectionKey} className="mb-6">
                      <h5 className="font-medium text-emerald-400 mb-3">{section.title}</h5>
                      {section.content.map((item, index) => (
                        <div key={index} className="bg-gray-700/30 rounded-lg p-4 mb-3">
                          <h6 className="font-medium mb-2" dangerouslySetInnerHTML={{ __html: highlightText(item.title, searchTerm) }} />
                          <div className="text-sm text-gray-300">
                            <div dangerouslySetInnerHTML={{ __html: highlightText(item.content.substring(0, 200) + '...', searchTerm) }} />
                          </div>
                          <button
                            onClick={() => {
                              setActiveSection(sectionKey as any)
                              setSearchTerm('')
                            }}
                            className="text-emerald-400 hover:text-emerald-300 text-sm mt-2 transition-colors"
                          >
                            {t.readMore}
                          </button>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Section Content */
              <div className="animate-fadeIn">
                <h4 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                  {documentationSections[activeSection].icon}
                  {documentationSections[activeSection].title}
                </h4>
                
                <div className="space-y-6">
                  {documentationSections[activeSection].content.map((item, index) => (
                    <div key={index} className="bg-gray-700/30 rounded-lg p-4 sm:p-6">
                      <h5 className="font-medium mb-4 text-emerald-400 text-sm sm:text-base">{item.title}</h5>
                      <div className="prose prose-invert max-w-none prose-sm sm:prose-base">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                          className="text-gray-300 leading-relaxed"
                        >
                          {item.content}
                        </ReactMarkdown>
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
          <h5 className="font-medium mb-4 text-sm sm:text-base">{t.usefulLinks}</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="https://t.me/support_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 p-3 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              {t.telegramSupport}
            </a>
            <a
              href="mailto:support@vip-club.com"
              className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 p-3 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              {t.emailSupport}
            </a>
            <a
              href="https://status.vip-club.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 p-3 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              {t.systemStatus}
            </a>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            .bg-white\/5,
            .bg-gray-700\/30,
            .bg-gray-700,
            .bg-gray-800 {
              background: white !important;
              color: black !important;
            }
            
            .text-white,
            .text-gray-300,
            .text-gray-400,
            .text-emerald-400 {
              color: black !important;
            }
            
            .border-white\/10,
            .border-gray-600 {
              border-color: #ccc !important;
            }
            
            button,
            .hover\\:bg-emerald-500\/30,
            .hover\\:bg-blue-500\/30,
            .hover\\:bg-yellow-500\/30 {
              display: none !important;
            }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-in-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </>
  )
}