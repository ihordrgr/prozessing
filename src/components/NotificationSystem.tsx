import React, { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationSystemProps {
  telegramId?: number
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ telegramId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Load notifications from localStorage or API
    loadNotifications()
    
    // Set up real-time notifications if needed
    const interval = setInterval(checkForNewNotifications, 30000) // Check every 30 seconds
    
    // Listen for custom notification events
    const handleAddNotification = (event: CustomEvent) => {
      addNotification(event.detail)
    }
    
    window.addEventListener('addNotification', handleAddNotification as EventListener)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('addNotification', handleAddNotification as EventListener)
    }
  }, [telegramId])

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length
    setUnreadCount(unread)
  }, [notifications])

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const loadNotifications = () => {
    // In a real app, this would load from API
    const savedNotifications = localStorage.getItem(`notifications_${telegramId || 'default'}`)
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }))
      // Sort by timestamp (newest first)
      const sorted = parsed.sort((a: Notification, b: Notification) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      )
      setNotifications(sorted)
    }
  }

  const saveNotifications = (newNotifications: Notification[]) => {
    localStorage.setItem(`notifications_${telegramId || 'default'}`, JSON.stringify(newNotifications))
  }

  const checkForNewNotifications = async () => {
    // In a real app, this would check API for new notifications
    // For demo, we'll simulate some notifications
    if (Math.random() > 0.95) { // 5% chance of new notification
      const demoNotifications = [
        {
          type: 'info' as const,
          title: 'Системное уведомление',
          message: 'Проверьте статус вашего VIP доступа',
        },
        {
          type: 'warning' as const,
          title: 'VIP доступ истекает',
          message: 'Ваш VIP доступ истекает через 3 дня',
          action: {
            label: 'Продлить',
            onClick: () => {
              window.location.hash = '#payment'
              setIsOpen(false)
            }
          }
        },
        {
          type: 'success' as const,
          title: 'Платеж подтвержден',
          message: 'Ваш VIP доступ успешно продлен на 30 дней',
        }
      ]
      
      const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)]
      addNotification(randomNotification)
    }
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    }

    const updatedNotifications = [newNotification, ...notifications]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50) // Keep only last 50
    
    setNotifications(updatedNotifications)
    saveNotifications(updatedNotifications)

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id
      })
    }
  }

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    )
    setNotifications(updatedNotifications)
    saveNotifications(updatedNotifications)
  }

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updatedNotifications)
    saveNotifications(updatedNotifications)
  }

  const removeNotification = (id: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== id)
    setNotifications(updatedNotifications)
    saveNotifications(updatedNotifications)
  }

  const clearAllNotifications = () => {
    setNotifications([])
    saveNotifications([])
  }

  const handlePanelOpen = () => {
    setIsOpen(!isOpen)
    // Auto-mark all as read when opening panel
    if (!isOpen && unreadCount > 0) {
      setTimeout(() => {
        markAllAsRead()
      }, 1000) // Delay to show the unread state briefly
    }
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
      case 'error': return <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
      default: return <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
    }
  }

  const getBorderColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'border-l-emerald-400'
      case 'warning': return 'border-l-yellow-400'
      case 'error': return 'border-l-red-400'
      default: return 'border-l-blue-400'
    }
  }

  const getBackgroundColor = (type: Notification['type'], isUnread: boolean) => {
    if (!isUnread) return ''
    
    switch (type) {
      case 'success': return 'bg-emerald-500/5'
      case 'warning': return 'bg-yellow-500/5'
      case 'error': return 'bg-red-500/5'
      default: return 'bg-blue-500/5'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Только что'
    if (minutes < 60) return `${minutes} мин назад`
    if (hours < 24) return `${hours} ч назад`
    if (days < 7) return `${days} дн назад`
    
    return timestamp.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={handlePanelOpen}
        className="relative p-2 text-gray-400 hover:text-white transition-all duration-200 hover:bg-gray-700/50 rounded-lg"
        title="Уведомления"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 lg:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute right-0 top-full mt-2 w-full max-w-sm lg:w-96 bg-gray-800/95 backdrop-blur-lg border border-gray-700 rounded-xl shadow-2xl z-50 max-h-[80vh] lg:max-h-96 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">Уведомления</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 rounded hover:bg-emerald-500/10"
                      >
                        Прочитать все
                      </button>
                    )}
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                    >
                      Очистить
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 lg:max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium mb-1">Нет уведомлений</p>
                  <p className="text-xs opacity-75">Здесь будут отображаться ваши уведомления</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-700/50 border-l-4 transition-all duration-200 hover:bg-gray-700/30 ${getBorderColor(notification.type)} ${
                      !notification.read ? `${getBackgroundColor(notification.type, true)} bg-gray-700/20` : ''
                    } ${index === notifications.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm text-white leading-tight">
                            {notification.title}
                          </h4>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-gray-600/50 flex-shrink-0"
                            title="Удалить уведомление"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-300 mt-1 leading-relaxed line-clamp-3">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-3 gap-2">
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {notification.action && (
                              <button
                                onClick={() => {
                                  notification.action!.onClick()
                                  markAsRead(notification.id)
                                }}
                                className="text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 px-2 py-1 rounded transition-all duration-200"
                              >
                                {notification.action.label}
                              </button>
                            )}
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 px-2 py-1 rounded transition-all duration-200"
                              >
                                Прочитано
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Animations */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb {
          background-color: #4b5563;
          border-radius: 4px;
        }
        
        .scrollbar-track-gray-800::-webkit-scrollbar-track {
          background-color: #1f2937;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
      `}</style>
    </div>
  )
}

// Hook for adding notifications from other components
export const useNotifications = (telegramId?: number) => {
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const event = new CustomEvent('addNotification', { detail: notification })
    window.dispatchEvent(event)
  }

  const addPaymentNotification = (status: 'success' | 'pending' | 'failed', amount: number) => {
    const notifications = {
      success: {
        type: 'success' as const,
        title: 'Платеж подтвержден!',
        message: `Ваш платеж на сумму ${amount} ₽ успешно обработан. VIP доступ активирован на 30 дней.`,
        action: {
          label: 'Перейти в VIP',
          onClick: () => {
            window.location.hash = '#vip-access'
          }
        }
      },
      pending: {
        type: 'warning' as const,
        title: 'Платеж на проверке',
        message: `Ваш платеж на сумму ${amount} ₽ отправлен на проверку. Ожидайте подтверждения в течение 5 минут.`
      },
      failed: {
        type: 'error' as const,
        title: 'Ошибка платежа',
        message: `Не удалось обработать платеж на сумму ${amount} ₽. Проверьте данные карты или обратитесь в поддержку.`,
        action: {
          label: 'Попробовать снова',
          onClick: () => {
            window.location.hash = '#payment'
          }
        }
      }
    }

    addNotification(notifications[status])
  }

  const addAccessNotification = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt)
    const daysLeft = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    
    addNotification({
      type: daysLeft <= 3 ? 'warning' : 'info',
      title: daysLeft <= 3 ? 'VIP доступ скоро истекает!' : 'Напоминание о VIP доступе',
      message: `Ваш VIP доступ истекает ${expirationDate.toLocaleDateString('ru-RU')} (через ${daysLeft} дн.). Продлите подписку, чтобы не потерять доступ к эксклюзивному контенту.`,
      action: {
        label: 'Продлить доступ',
        onClick: () => {
          window.location.hash = '#payment'
        }
      }
    })
  }

  const addSystemNotification = (title: string, message: string, type: Notification['type'] = 'info') => {
    addNotification({
      type,
      title,
      message
    })
  }

  const addWelcomeNotification = () => {
    addNotification({
      type: 'success',
      title: 'Добро пожаловать в VIP Club!',
      message: 'Спасибо за регистрацию! Изучите возможности системы и получите VIP доступ для полного функционала.',
      action: {
        label: 'Получить VIP',
        onClick: () => {
          window.location.hash = '#payment'
        }
      }
    })
  }

  return {
    addNotification,
    addPaymentNotification,
    addAccessNotification,
    addSystemNotification,
    addWelcomeNotification
  }
}