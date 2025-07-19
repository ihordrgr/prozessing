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
    
    return () => clearInterval(interval)
  }, [telegramId])

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length
    setUnreadCount(unread)
  }, [notifications])

  const loadNotifications = () => {
    // In a real app, this would load from API
    const savedNotifications = localStorage.getItem(`notifications_${telegramId}`)
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }))
      setNotifications(parsed)
    }
  }

  const saveNotifications = (newNotifications: Notification[]) => {
    localStorage.setItem(`notifications_${telegramId}`, JSON.stringify(newNotifications))
  }

  const checkForNewNotifications = async () => {
    // In a real app, this would check API for new notifications
    // For demo, we'll simulate some notifications
    if (Math.random() > 0.9) { // 10% chance of new notification
      addNotification({
        type: 'info',
        title: 'Системное уведомление',
        message: 'Проверьте статус вашего VIP доступа',
      })
    }
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    }

    const updatedNotifications = [newNotification, ...notifications].slice(0, 50) // Keep only last 50
    setNotifications(updatedNotifications)
    saveNotifications(updatedNotifications)

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
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

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />
      default: return <Info className="w-5 h-5 text-blue-400" />
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

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="font-semibold">Уведомления</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Прочитать все
                </button>
              )}
              <button
                onClick={clearAllNotifications}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Очистить
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Нет уведомлений</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-700 border-l-4 ${getBorderColor(notification.type)} ${
                    !notification.read ? 'bg-gray-700/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {notification.timestamp.toLocaleTimeString()}
                        </span>
                        <div className="flex items-center gap-2">
                          {notification.action && (
                            <button
                              onClick={notification.action.onClick}
                              className="text-xs text-emerald-400 hover:text-emerald-300"
                            >
                              {notification.action.label}
                            </button>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-400 hover:text-blue-300"
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
      )}
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
        message: `Ваш платеж на сумму ${amount} ₽ успешно обработан. VIP доступ активирован.`
      },
      pending: {
        type: 'warning' as const,
        title: 'Платеж на проверке',
        message: `Ваш платеж на сумму ${amount} ₽ отправлен на проверку. Ожидайте подтверждения.`
      },
      failed: {
        type: 'error' as const,
        title: 'Ошибка платежа',
        message: `Не удалось обработать платеж на сумму ${amount} ₽. Обратитесь в поддержку.`
      }
    }

    addNotification(notifications[status])
  }

  const addAccessNotification = (expiresAt: string) => {
    addNotification({
      type: 'info',
      title: 'VIP доступ истекает',
      message: `Ваш VIP доступ истекает ${new Date(expiresAt).toLocaleDateString()}. Продлите подписку.`,
      action: {
        label: 'Продлить',
        onClick: () => {
          // Navigate to payment form
          window.location.hash = '#payment'
        }
      }
    })
  }

  return {
    addNotification,
    addPaymentNotification,
    addAccessNotification
  }
}