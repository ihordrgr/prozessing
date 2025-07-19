import React, { useState, useEffect } from 'react'
import { Crown, Calendar, CreditCard, ExternalLink, Loader2 } from 'lucide-react'
import { dbFunctions, Profile, Payment, AccessLink } from '../lib/supabase'

interface VipDashboardProps {
  telegramId: number
}

export const VipDashboard: React.FC<VipDashboardProps> = ({ telegramId }) => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [accessLinks, setAccessLinks] = useState<AccessLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadUserData()
  }, [telegramId])

  const loadUserData = async () => {
    setLoading(true)
    setError('')

    try {
      // Load user profile
      const userProfile = await dbFunctions.getUserProfile(telegramId)
      setProfile(userProfile)

      // Load payments
      const userPayments = await dbFunctions.getUserPayments(telegramId)
      setPayments(userPayments)

      // Load access links if user has profile
      if (userProfile) {
        const userAccessLinks = await dbFunctions.getUserAccessLinks(userProfile.id)
        setAccessLinks(userAccessLinks)
      }

      // Log dashboard view
      await dbFunctions.logUserAction(telegramId, 'dashboard_viewed', {})

    } catch (err) {
      setError('Ошибка при загрузке данных')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const checkAccess = async () => {
    try {
      const accessStatus = await dbFunctions.checkVipAccess(telegramId)
      
      if (accessStatus.has_access) {
        alert(`У вас есть VIP доступ до ${new Date(accessStatus.expires_at).toLocaleDateString()}`)
      } else {
        alert(`Доступ отсутствует: ${accessStatus.reason}`)
      }
    } catch (err) {
      alert('Ошибка при проверке доступа')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-emerald-400'
      case 'pending': return 'text-yellow-400'
      case 'rejected': return 'text-red-400'
      case 'expired': return 'text-gray-400'
      default: return 'text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Подтверждено'
      case 'pending': return 'Ожидает проверки'
      case 'rejected': return 'Отклонено'
      case 'expired': return 'Истекло'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadUserData}
          className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-lg"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Section */}
      {profile && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <Crown className={`w-8 h-8 ${profile.vip_access ? 'text-yellow-400' : 'text-gray-400'}`} />
            <div>
              <h2 className="text-2xl font-bold">
                {profile.full_name || profile.username || `User ${profile.telegram_id}`}
              </h2>
              <p className={`text-sm ${profile.vip_access ? 'text-emerald-400' : 'text-gray-400'}`}>
                {profile.vip_access ? 'VIP Участник' : 'Обычный пользователь'}
              </p>
            </div>
          </div>

          {profile.vip_access && profile.access_expires_at && (
            <div className="bg-emerald-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-emerald-400">VIP доступ активен</span>
              </div>
              <p className="text-gray-300">
                Действует до: {formatDate(profile.access_expires_at)}
              </p>
            </div>
          )}

          <button
            onClick={checkAccess}
            className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-lg transition-colors"
          >
            Проверить статус доступа
          </button>
        </div>
      )}

      {/* Payments Section */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          История платежей
        </h3>

        {payments.length === 0 ? (
          <p className="text-gray-400">Платежи не найдены</p>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">
                      {payment.amount} {payment.currency}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(payment.status)}`}>
                    {getStatusText(payment.status)}
                  </span>
                </div>
                
                {payment.payment_method && (
                  <p className="text-sm text-gray-300">
                    Способ оплаты: {payment.payment_method}
                  </p>
                )}
                
                {payment.verified_at && (
                  <p className="text-sm text-emerald-400">
                    Подтверждено: {formatDate(payment.verified_at)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Access Links Section */}
      {accessLinks.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ExternalLink className="w-6 h-6" />
            Ссылки доступа
          </h3>

          <div className="space-y-4">
            {accessLinks.map((link) => (
              <div
                key={link.id}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-emerald-400">
                      {link.access_code}
                    </p>
                    <p className="text-sm text-gray-400">
                      Создано: {formatDate(link.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-300">
                      Истекает: {formatDate(link.expires_at)}
                    </p>
                    {link.used_at && (
                      <p className="text-sm text-yellow-400">
                        Использовано: {formatDate(link.used_at)}
                      </p>
                    )}
                  </div>
                </div>
                
                <a
                  href={link.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 text-sm break-all"
                >
                  {link.link_url}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}