import React, { useState, useEffect } from 'react'
import { Shield, AlertTriangle, Lock, Eye, EyeOff, Key, Clock } from 'lucide-react'

interface SecurityEvent {
  id: string
  type: 'login' | 'payment' | 'access' | 'suspicious'
  description: string
  timestamp: Date
  ip?: string
  userAgent?: string
  risk: 'low' | 'medium' | 'high'
}

interface SecuritySystemProps {
  telegramId?: number
}

export const SecuritySystem: React.FC<SecuritySystemProps> = ({ telegramId }) => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high'>('medium')

  useEffect(() => {
    loadSecurityEvents()
    monitorSecurity()
  }, [telegramId])

  const loadSecurityEvents = () => {
    // In a real app, load from API
    const events: SecurityEvent[] = [
      {
        id: '1',
        type: 'login',
        description: 'Успешный вход в систему',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        risk: 'low'
      },
      {
        id: '2',
        type: 'payment',
        description: 'Попытка оплаты VIP доступа',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        ip: '192.168.1.1',
        risk: 'low'
      },
      {
        id: '3',
        type: 'suspicious',
        description: 'Множественные попытки доступа',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        ip: '10.0.0.1',
        risk: 'high'
      }
    ]
    setSecurityEvents(events)
  }

  const monitorSecurity = () => {
    // Monitor for suspicious activity
    const checkSecurity = () => {
      // Check for multiple failed attempts
      const recentEvents = securityEvents.filter(
        event => Date.now() - event.timestamp.getTime() < 1000 * 60 * 60 // Last hour
      )
      
      const suspiciousEvents = recentEvents.filter(event => event.risk === 'high')
      
      if (suspiciousEvents.length > 3) {
        setSecurityLevel('high')
        addSecurityEvent({
          type: 'suspicious',
          description: 'Обнаружена подозрительная активность',
          risk: 'high'
        })
      }
    }

    const interval = setInterval(checkSecurity, 60000) // Check every minute
    return () => clearInterval(interval)
  }

  const addSecurityEvent = (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
    const newEvent: SecurityEvent = {
      ...event,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setSecurityEvents(prev => [newEvent, ...prev].slice(0, 100)) // Keep last 100 events
  }

  const getRiskColor = (risk: SecurityEvent['risk']) => {
    switch (risk) {
      case 'low': return 'text-emerald-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-red-400'
    }
  }

  const getRiskBg = (risk: SecurityEvent['risk']) => {
    switch (risk) {
      case 'low': return 'bg-emerald-500/20'
      case 'medium': return 'bg-yellow-500/20'
      case 'high': return 'bg-red-500/20'
    }
  }

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login': return <Key className="w-4 h-4" />
      case 'payment': return <Shield className="w-4 h-4" />
      case 'access': return <Lock className="w-4 h-4" />
      case 'suspicious': return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getSecurityLevelColor = () => {
    switch (securityLevel) {
      case 'low': return 'text-emerald-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-red-400'
    }
  }

  const getSecurityLevelText = () => {
    switch (securityLevel) {
      case 'low': return 'Низкий'
      case 'medium': return 'Средний'
      case 'high': return 'Высокий'
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Безопасность
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Уровень риска:</span>
          <span className={`font-semibold ${getSecurityLevelColor()}`}>
            {getSecurityLevelText()}
          </span>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-5 h-5 text-blue-400" />
            <span className="font-medium">Аутентификация</span>
          </div>
          <p className="text-sm text-gray-400">Telegram ID верифицирован</p>
          <p className="text-emerald-400 text-sm mt-1">✓ Безопасно</p>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <span className="font-medium">Шифрование</span>
          </div>
          <p className="text-sm text-gray-400">Данные защищены</p>
          <p className="text-emerald-400 text-sm mt-1">✓ AES-256</p>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className="font-medium">Сессия</span>
          </div>
          <p className="text-sm text-gray-400">Активна 2 часа</p>
          <p className="text-yellow-400 text-sm mt-1">⚠ Истекает скоро</p>
        </div>
      </div>

      {/* Security Events */}
      <div>
        <h4 className="font-semibold mb-4">Журнал безопасности</h4>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {securityEvents.map(event => (
            <div
              key={event.id}
              className={`p-3 rounded-lg border-l-4 ${
                event.risk === 'high' ? 'border-l-red-400 bg-red-500/10' :
                event.risk === 'medium' ? 'border-l-yellow-400 bg-yellow-500/10' :
                'border-l-emerald-400 bg-emerald-500/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getEventIcon(event.type)}
                  <span className="font-medium text-sm">{event.description}</span>
                  <span className={`px-2 py-1 rounded text-xs ${getRiskBg(event.risk)} ${getRiskColor(event.risk)}`}>
                    {event.risk}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => setShowDetails(showDetails === event.id ? null : event.id)}
                    className="text-gray-400 hover:text-white"
                  >
                    {showDetails === event.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              {showDetails === event.id && (
                <div className="mt-3 pt-3 border-t border-gray-600 text-sm text-gray-300">
                  {event.ip && <p>IP: {event.ip}</p>}
                  {event.userAgent && <p>User Agent: {event.userAgent.substring(0, 50)}...</p>}
                  <p>Время: {event.timestamp.toLocaleString()}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security Actions */}
      <div className="mt-6 pt-6 border-t border-gray-600">
        <h4 className="font-semibold mb-4">Действия безопасности</h4>
        <div className="flex flex-wrap gap-3">
          <button className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-2 rounded-lg text-sm">
            Сменить пароль
          </button>
          <button className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 px-3 py-2 rounded-lg text-sm">
            Завершить все сессии
          </button>
          <button className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-2 rounded-lg text-sm">
            Включить 2FA
          </button>
          <button className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-2 rounded-lg text-sm">
            Заблокировать подозрительные IP
          </button>
        </div>
      </div>

      {/* Security Tips */}
      <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <h5 className="font-medium text-blue-400 mb-2">💡 Советы по безопасности</h5>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Не делитесь ссылками доступа с другими</li>
          <li>• Регулярно проверяйте журнал активности</li>
          <li>• Используйте только официальные каналы для оплаты</li>
          <li>• Сообщайте о подозрительной активности</li>
        </ul>
      </div>
    </div>
  )
}