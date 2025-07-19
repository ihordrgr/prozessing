import React, { useState, useEffect } from 'react'
import { 
  Users, 
  CreditCard, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Settings,
  BarChart3,
  Download,
  Search,
  Filter
} from 'lucide-react'
import { dbFunctions } from '../lib/supabase'

interface AdminStats {
  totalUsers: number
  vipUsers: number
  pendingPayments: number
  totalRevenue: number
  todayPayments: number
}

interface AdminUser {
  id: string
  telegram_id: number
  username?: string
  full_name?: string
  vip_access: boolean
  access_expires_at?: string
  created_at: string
  total_payments: number
}

interface AdminPayment {
  id: string
  telegram_id: number
  username?: string
  amount: number
  currency: string
  status: string
  screenshot_url?: string
  created_at: string
  verified_at?: string
}

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'payments' | 'settings'>('dashboard')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadAdminData()
  }, [activeTab])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'dashboard') {
        const adminStats = await dbFunctions.getAdminStats()
        setStats(adminStats)
      } else if (activeTab === 'users') {
        const adminUsers = await dbFunctions.getAdminUsers()
        setUsers(adminUsers)
      } else if (activeTab === 'payments') {
        const adminPayments = await dbFunctions.getAdminPayments()
        setPayments(adminPayments)
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentAction = async (paymentId: string, action: 'approve' | 'reject') => {
    try {
      await dbFunctions.adminUpdatePayment(paymentId, action === 'approve')
      loadAdminData()
    } catch (error) {
      console.error('Error updating payment:', error)
    }
  }

  const handleUserAction = async (userId: string, action: 'grant' | 'revoke') => {
    try {
      await dbFunctions.adminUpdateUserAccess(userId, action === 'grant')
      loadAdminData()
    } catch (error) {
      console.error('Error updating user access:', error)
    }
  }

  const exportData = async (type: 'users' | 'payments') => {
    try {
      const data = type === 'users' ? users : payments
      const csv = convertToCSV(data)
      downloadCSV(csv, `${type}_export_${new Date().toISOString().split('T')[0]}.csv`)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const convertToCSV = (data: any[]) => {
    if (!data.length) return ''
    
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    )
    
    return [headers, ...rows].join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.telegram_id.toString().includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredUsers = users.filter(user => {
    return user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.telegram_id.toString().includes(searchTerm)
  })

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-emerald-400" />
            Админ-панель VIP системы
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Последнее обновление: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'dashboard', label: 'Дашборд', icon: BarChart3 },
            { id: 'users', label: 'Пользователи', icon: Users },
            { id: 'payments', label: 'Платежи', icon: CreditCard },
            { id: 'settings', label: 'Настройки', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Всего пользователей</p>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">VIP пользователи</p>
                      <p className="text-2xl font-bold text-emerald-400">{stats.vipUsers}</p>
                    </div>
                    <Shield className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Ожидают проверки</p>
                      <p className="text-2xl font-bold text-yellow-400">{stats.pendingPayments}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Общий доход</p>
                      <p className="text-2xl font-bold text-green-400">{stats.totalRevenue} ₽</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-green-400" />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Платежи сегодня</p>
                      <p className="text-2xl font-bold">{stats.todayPayments}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Последняя активность</h3>
              <div className="space-y-3">
                {payments.slice(0, 5).map(payment => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-700">
                    <div>
                      <p className="font-medium">@{payment.username || payment.telegram_id}</p>
                      <p className="text-sm text-gray-400">{payment.amount} {payment.currency}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        payment.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                        payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {payment.status}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Управление пользователями</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск пользователей..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white"
                  />
                </div>
                <button
                  onClick={() => exportData('users')}
                  className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Экспорт
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">Пользователь</th>
                    <th className="px-6 py-3 text-left">VIP статус</th>
                    <th className="px-6 py-3 text-left">Истекает</th>
                    <th className="px-6 py-3 text-left">Платежи</th>
                    <th className="px-6 py-3 text-left">Регистрация</th>
                    <th className="px-6 py-3 text-left">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-gray-700">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{user.full_name || `User ${user.telegram_id}`}</p>
                          <p className="text-sm text-gray-400">@{user.username || user.telegram_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.vip_access ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {user.vip_access ? 'VIP' : 'Обычный'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {user.access_expires_at ? new Date(user.access_expires_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">{user.total_payments}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUserAction(user.id, user.vip_access ? 'revoke' : 'grant')}
                            className={`px-3 py-1 rounded text-xs ${
                              user.vip_access 
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            }`}
                          >
                            {user.vip_access ? 'Отозвать' : 'Предоставить'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Управление платежами</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск платежей..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="all">Все статусы</option>
                  <option value="pending">Ожидает</option>
                  <option value="verified">Подтверждено</option>
                  <option value="rejected">Отклонено</option>
                </select>
                <button
                  onClick={() => exportData('payments')}
                  className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Экспорт
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">Пользователь</th>
                    <th className="px-6 py-3 text-left">Сумма</th>
                    <th className="px-6 py-3 text-left">Статус</th>
                    <th className="px-6 py-3 text-left">Скриншот</th>
                    <th className="px-6 py-3 text-left">Дата</th>
                    <th className="px-6 py-3 text-left">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(payment => (
                    <tr key={payment.id} className="border-b border-gray-700">
                      <td className="px-6 py-4">
                        <p className="font-medium">@{payment.username || payment.telegram_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{payment.amount} {payment.currency}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          payment.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                          payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {payment.status === 'verified' ? 'Подтверждено' :
                           payment.status === 'pending' ? 'Ожидает' : 'Отклонено'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {payment.screenshot_url ? (
                          <a
                            href={payment.screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Просмотр
                          </a>
                        ) : (
                          <span className="text-gray-400">Нет</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {payment.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePaymentAction(payment.id, 'approve')}
                              className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1 rounded text-xs flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Одобрить
                            </button>
                            <button
                              onClick={() => handlePaymentAction(payment.id, 'reject')}
                              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded text-xs flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              Отклонить
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Настройки системы</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Настройки платежей</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Стоимость VIP доступа (₽)</label>
                    <input
                      type="number"
                      defaultValue="500"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Срок действия VIP (дней)</label>
                    <input
                      type="number"
                      defaultValue="30"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Уведомления</h3>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span>Уведомления о новых платежах</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span>Уведомления об истечении VIP</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span>Ежедневные отчеты</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Безопасность</h3>
              <div className="space-y-4">
                <button className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg">
                  Сбросить все сессии
                </button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg ml-4">
                  Очистить логи (старше 30 дней)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}