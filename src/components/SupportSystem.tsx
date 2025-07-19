import React, { useState } from 'react'
import { MessageCircle, Send, Phone, Mail, Clock, CheckCircle } from 'lucide-react'

interface SupportTicket {
  id: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: Date
  updated_at: Date
  responses: SupportResponse[]
}

interface SupportResponse {
  id: string
  message: string
  from: 'user' | 'support'
  timestamp: Date
}

interface SupportSystemProps {
  telegramId?: number
}

export const SupportSystem: React.FC<SupportSystemProps> = ({ telegramId }) => {
  const [activeTab, setActiveTab] = useState<'new' | 'tickets' | 'faq'>('new')
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'medium' as const
  })
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')

  const faqItems = [
    {
      question: 'Как получить VIP доступ?',
      answer: 'Для получения VIP доступа необходимо произвести оплату через бота и отправить скриншот подтверждения.'
    },
    {
      question: 'Сколько действует VIP доступ?',
      answer: 'VIP доступ действует 30 дней с момента подтверждения оплаты.'
    },
    {
      question: 'Можно ли вернуть деньги?',
      answer: 'Возврат средств возможен в течение 24 часов после оплаты при наличии веских оснований.'
    },
    {
      question: 'Что делать если платеж не подтвердился?',
      answer: 'Обратитесь в поддержку с скриншотом оплаты и номером транзакции.'
    },
    {
      question: 'Как продлить VIP доступ?',
      answer: 'За 3 дня до истечения доступа вы получите уведомление с возможностью продления.'
    }
  ]

  const handleSubmitTicket = async () => {
    if (!newTicket.subject || !newTicket.message) return

    const ticket: SupportTicket = {
      id: Date.now().toString(),
      subject: newTicket.subject,
      message: newTicket.message,
      status: 'open',
      priority: newTicket.priority,
      created_at: new Date(),
      updated_at: new Date(),
      responses: []
    }

    setTickets(prev => [ticket, ...prev])
    setNewTicket({ subject: '', message: '', priority: 'medium' })
    setActiveTab('tickets')

    // In a real app, send to API
    console.log('New support ticket:', ticket)
  }

  const handleSendMessage = async (ticketId: string) => {
    if (!newMessage.trim()) return

    const response: SupportResponse = {
      id: Date.now().toString(),
      message: newMessage,
      from: 'user',
      timestamp: new Date()
    }

    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { 
            ...ticket, 
            responses: [...ticket.responses, response],
            updated_at: new Date(),
            status: 'in_progress'
          }
        : ticket
    ))

    setNewMessage('')

    // Simulate support response
    setTimeout(() => {
      const supportResponse: SupportResponse = {
        id: (Date.now() + 1).toString(),
        message: 'Спасибо за ваше обращение! Мы рассмотрим ваш вопрос в ближайшее время.',
        from: 'support',
        timestamp: new Date()
      }

      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { 
              ...ticket, 
              responses: [...ticket.responses, supportResponse],
              updated_at: new Date()
            }
          : ticket
      ))
    }, 2000)
  }

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'text-blue-400 bg-blue-500/20'
      case 'in_progress': return 'text-yellow-400 bg-yellow-500/20'
      case 'resolved': return 'text-emerald-400 bg-emerald-500/20'
      case 'closed': return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'low': return 'text-emerald-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-red-400'
    }
  }

  const getStatusText = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'Открыт'
      case 'in_progress': return 'В работе'
      case 'resolved': return 'Решен'
      case 'closed': return 'Закрыт'
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          Поддержка
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Ответ в течение 2 часов</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex space-x-4 mb-6 border-b border-gray-600">
        {[
          { id: 'new', label: 'Новое обращение' },
          { id: 'tickets', label: `Мои обращения (${tickets.length})` },
          { id: 'faq', label: 'FAQ' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2 px-1 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* New Ticket Tab */}
      {activeTab === 'new' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Тема обращения</label>
            <input
              type="text"
              value={newTicket.subject}
              onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Кратко опишите проблему"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Приоритет</label>
            <select
              value={newTicket.priority}
              onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Описание проблемы</label>
            <textarea
              value={newTicket.message}
              onChange={(e) => setNewTicket(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Подробно опишите вашу проблему или вопрос"
              rows={6}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white resize-none"
            />
          </div>

          <button
            onClick={handleSubmitTicket}
            disabled={!newTicket.subject || !newTicket.message}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Отправить обращение
          </button>

          {/* Quick Contact */}
          <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <h4 className="font-medium text-blue-400 mb-3">Быстрая связь</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-400" />
                <span>Telegram: @support_bot</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>Email: support@vip-club.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>Телефон: +7 (999) 123-45-67</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>У вас пока нет обращений</p>
              <button
                onClick={() => setActiveTab('new')}
                className="mt-4 text-emerald-400 hover:text-emerald-300"
              >
                Создать первое обращение
              </button>
            </div>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{ticket.subject}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </span>
                    <span className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-300 mb-3">{ticket.message}</p>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>Создано: {ticket.created_at.toLocaleString()}</span>
                  <span>Обновлено: {ticket.updated_at.toLocaleString()}</span>
                </div>

                {ticket.responses.length > 0 && (
                  <div className="border-t border-gray-600 pt-3 mb-3">
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {ticket.responses.map(response => (
                        <div
                          key={response.id}
                          className={`p-2 rounded text-sm ${
                            response.from === 'user' 
                              ? 'bg-emerald-500/20 ml-4' 
                              : 'bg-blue-500/20 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">
                              {response.from === 'user' ? 'Вы' : 'Поддержка'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {response.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p>{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ticket.status !== 'closed' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedTicket === ticket.id ? newMessage : ''}
                      onChange={(e) => {
                        setSelectedTicket(ticket.id)
                        setNewMessage(e.target.value)
                      }}
                      placeholder="Написать сообщение..."
                      className="flex-1 bg-gray-600 border border-gray-500 rounded px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => handleSendMessage(ticket.id)}
                      disabled={!newMessage.trim() || selectedTicket !== ticket.id}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-black px-4 py-2 rounded flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h4 className="text-lg font-semibold mb-2">Часто задаваемые вопросы</h4>
            <p className="text-gray-400">Возможно, ответ на ваш вопрос уже есть здесь</p>
          </div>

          {faqItems.map((item, index) => (
            <details key={index} className="bg-gray-700/50 rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-700/70 rounded-lg">
                <span className="font-medium">{item.question}</span>
              </summary>
              <div className="px-4 pb-4 text-gray-300">
                {item.answer}
              </div>
            </details>
          ))}

          <div className="mt-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-medium text-emerald-400">Не нашли ответ?</span>
            </div>
            <p className="text-sm text-gray-300 mb-3">
              Если ваш вопрос не освещен в FAQ, создайте новое обращение в поддержку.
            </p>
            <button
              onClick={() => setActiveTab('new')}
              className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-lg text-sm"
            >
              Создать обращение
            </button>
          </div>
        </div>
      )}
    </div>
  )
}