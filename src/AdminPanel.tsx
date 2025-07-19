import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  Settings, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  CheckCircle,
  XCircle,
  X,
  Loader,
  Save,
  Trash2,
  Crown,
  UserMinus,
  AlertTriangle
} from 'lucide-react';

// Types
interface User {
  id: string;
  telegram_id: string;
  username?: string;
  full_name?: string;
  vip_access: boolean;
  access_expires_at?: string;
  created_at: string;
  total_payments: number;
}

interface Payment {
  id: string;
  telegram_id: string;
  username?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'verified' | 'rejected';
  screenshot_url?: string;
  created_at: string;
  verified_at?: string;
}

interface Settings {
  vipPrice: number;
  vipDuration: number;
  notifications: {
    newPayments: boolean;
    vipExpiration: boolean;
    dailyReports: boolean;
  };
}

interface ConfirmDialogState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

// Mock API functions
const dbFunctions = {
  getUsers: async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      {
        id: '1',
        telegram_id: '123456789',
        username: 'user1',
        full_name: 'Иван Иванов',
        vip_access: true,
        access_expires_at: '2024-02-15T10:00:00Z',
        created_at: '2024-01-01T10:00:00Z',
        total_payments: 3
      },
      {
        id: '2',
        telegram_id: '987654321',
        username: 'user2',
        full_name: 'Петр Петров',
        vip_access: false,
        created_at: '2024-01-05T15:30:00Z',
        total_payments: 1
      }
    ];
  },

  getPayments: async (): Promise<Payment[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return [
      {
        id: '1',
        telegram_id: '123456789',
        username: 'user1',
        amount: 500,
        currency: '₽',
        status: 'pending',
        screenshot_url: 'https://example.com/screenshot1.jpg',
        created_at: '2024-01-10T12:00:00Z'
      },
      {
        id: '2',
        telegram_id: '987654321',
        username: 'user2',
        amount: 500,
        currency: '₽',
        status: 'verified',
        screenshot_url: 'https://example.com/screenshot2.jpg',
        created_at: '2024-01-08T14:30:00Z',
        verified_at: '2024-01-08T16:00:00Z'
      }
    ];
  },

  approvePayment: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
  },

  rejectPayment: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
  },

  grantVip: async (userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
  },

  revokeVip: async (userId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
  },

  saveSettings: async (settings: Settings): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  },

  resetSessions: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
  },

  clearLogs: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
};

// Error Alert Component
const ErrorAlert: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <AlertTriangle className="w-5 h-5 text-red-400" />
      <span className="text-red-400">{message}</span>
    </div>
    <button onClick={onClose} className="text-red-400 hover:text-red-300">
      <X className="w-4 h-4" />
    </button>
  </div>
);

// Loading Overlay Component
const LoadingOverlay: React.FC = () => (
  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
    <div className="bg-gray-800 rounded-lg p-6 flex items-center gap-3">
      <Loader className="w-6 h-6 animate-spin text-emerald-400" />
      <span className="text-white">Загрузка...</span>
    </div>
  </div>
);

// Confirm Dialog Component
const ConfirmDialog: React.FC<{ 
  state: ConfirmDialogState; 
  onClose: () => void; 
  onConfirm: () => void; 
}> = ({ state, onClose, onConfirm }) => {
  if (!state.show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">{state.title}</h3>
        <p className="text-gray-300 mb-6">{state.message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
};

// Pagination Component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex items-center justify-between px-6 py-3 bg-gray-700">
    <div className="text-sm text-gray-400">
      Страница {currentPage} из {totalPages}
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="px-3 py-1 bg-gray-600 rounded text-sm">
        {currentPage}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default function AdminPanel() {
  // Main state
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'settings'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<Settings>({
    vipPrice: 500,
    vipDuration: 30,
    notifications: {
      newPayments: true,
      vipExpiration: true,
      dailyReports: false
    }
  });

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search, filter, sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Settings state
  const [settingsChanged, setSettingsChanged] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, paymentsData] = await Promise.all([
        dbFunctions.getUsers(),
        dbFunctions.getPayments()
      ]);
      setUsers(usersData);
      setPayments(paymentsData);
    } catch (err) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filterByDate = (dateString: string) => {
    if (dateFilter === 'all') return true;
    
    const date = new Date(dateString);
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= monthAgo;
      default:
        return true;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.telegram_id.includes(searchTerm);
    
    const matchesDate = filterByDate(user.created_at);
    
    return matchesSearch && matchesDate;
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.telegram_id.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesDate = filterByDate(payment.created_at);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort function
  const sortData = <T extends Record<string, any>>(data: T[], field: string): T[] => {
    return [...data].sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];
      
      if (field === 'created_at' || field === 'access_expires_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Pagination
  const sortedUsers = sortData(filteredUsers, sortField);
  const sortedPayments = sortData(filteredPayments, sortField);
  
  const totalUsersPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const totalPaymentsPages = Math.ceil(sortedPayments.length / itemsPerPage);
  
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const paginatedPayments = sortedPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Action handlers
  const handlePaymentAction = async (paymentId: string, action: 'approve' | 'reject') => {
    const actionKey = `payment_${paymentId}_${action}`;
    setActionLoading(actionKey);
    setError(null);
    
    try {
      if (action === 'approve') {
        await dbFunctions.approvePayment(paymentId);
      } else {
        await dbFunctions.rejectPayment(paymentId);
      }
      await loadData();
    } catch (err) {
      setError(`Ошибка ${action === 'approve' ? 'одобрения' : 'отклонения'} платежа`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVipAction = async (userId: string, action: 'grant' | 'revoke') => {
    const actionKey = `user_${userId}_${action}`;
    setActionLoading(actionKey);
    setError(null);
    
    try {
      if (action === 'grant') {
        await dbFunctions.grantVip(userId);
      } else {
        await dbFunctions.revokeVip(userId);
      }
      await loadData();
    } catch (err) {
      setError(`Ошибка ${action === 'grant' ? 'выдачи' : 'отзыва'} VIP`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveSettings = async () => {
    setActionLoading('save_settings');
    setError(null);
    
    try {
      await dbFunctions.saveSettings(settings);
      setSettingsChanged(false);
    } catch (err) {
      setError('Ошибка сохранения настроек');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetSessions = () => {
    setConfirmDialog({
      show: true,
      title: 'Сброс всех сессий',
      message: 'Это действие отключит всех пользователей от системы. Продолжить?',
      onConfirm: async () => {
        setActionLoading('reset_sessions');
        setError(null);
        
        try {
          await dbFunctions.resetSessions();
        } catch (err) {
          setError('Ошибка сброса сессий');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleClearLogs = () => {
    setConfirmDialog({
      show: true,
      title: 'Очистка логов',
      message: 'Это действие безвозвратно удалит все логи старше 30 дней. Продолжить?',
      onConfirm: async () => {
        setActionLoading('clear_logs');
        setError(null);
        
        try {
          await dbFunctions.clearLogs();
        } catch (err) {
          setError('Ошибка очистки логов');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const exportData = (type: 'users' | 'payments') => {
    const data = type === 'users' ? filteredUsers : filteredPayments;
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {loading && <LoadingOverlay />}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Панель администратора</h1>
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <ErrorAlert 
            message={error} 
            onClose={() => setError(null)} 
          />
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-lg">
          {[
            { id: 'users', label: 'Пользователи', icon: Users },
            { id: 'payments', label: 'Платежи', icon: CreditCard },
            { id: 'settings', label: 'Настройки', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {!loading && (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Управление пользователями</h2>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Поиск пользователей..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white w-64"
                      />
                    </div>
                    <select
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="all">Все даты</option>
                      <option value="today">Сегодня</option>
                      <option value="week">Неделя</option>
                      <option value="month">Месяц</option>
                    </select>
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
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('username')}
                            className="flex items-center gap-1 hover:text-emerald-400"
                          >
                            Пользователь
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('vip_access')}
                            className="flex items-center gap-1 hover:text-emerald-400"
                          >
                            VIP статус
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('access_expires_at')}
                            className="flex items-center gap-1 hover:text-emerald-400"
                          >
                            VIP истекает
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('created_at')}
                            className="flex items-center gap-1 hover:text-emerald-400"
                          >
                            Дата регистрации
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map(user => (
                        <tr key={user.id} className="border-b border-gray-700">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium">@{user.username || user.telegram_id}</p>
                              <p className="text-sm text-gray-400">{user.full_name}</p>
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
                            {user.access_expires_at ? (
                              <div>
                                <div>{new Date(user.access_expires_at).toLocaleDateString()}</div>
                                <div className="text-xs">{new Date(user.access_expires_at).toLocaleTimeString()}</div>
                              </div>
                            ) : (
                              'Не активен'
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            <div>
                              <div>{new Date(user.created_at).toLocaleDateString()}</div>
                              <div className="text-xs">{new Date(user.created_at).toLocaleTimeString()}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1 rounded text-xs flex items-center gap-1"
                                title="Подробная информация"
                              >
                                <Info className="w-3 h-3" />
                                Детали
                              </button>
                              {user.vip_access ? (
                                <button
                                  onClick={() => handleVipAction(user.id, 'revoke')}
                                  disabled={actionLoading === `user_${user.id}_revoke`}
                                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded text-xs flex items-center gap-1"
                                >
                                  {actionLoading === `user_${user.id}_revoke` ? (
                                    <Loader className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <UserMinus className="w-3 h-3" />
                                  )}
                                  Отозвать VIP
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleVipAction(user.id, 'grant')}
                                  disabled={actionLoading === `user_${user.id}_grant`}
                                  className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1 rounded text-xs flex items-center gap-1"
                                >
                                  {actionLoading === `user_${user.id}_grant` ? (
                                    <Loader className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Crown className="w-3 h-3" />
                                  )}
                                  Выдать VIP
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalUsersPages}
                    onPageChange={setCurrentPage}
                  />
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
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Поиск платежей..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white w-64"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="all">Все статусы</option>
                      <option value="pending">Ожидает</option>
                      <option value="verified">Подтверждено</option>
                      <option value="rejected">Отклонено</option>
                    </select>
                    <select
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="all">Все даты</option>
                      <option value="today">Сегодня</option>
                      <option value="week">Неделя</option>
                      <option value="month">Месяц</option>
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
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('username')}
                            className="flex items-center gap-1 hover:text-emerald-400"
                          >
                            Пользователь
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('amount')}
                            className="flex items-center gap-1 hover:text-emerald-400"
                          >
                            Сумма
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('status')}
                            className="flex items-center gap-1 hover:text-emerald-400"
                          >
                            Статус
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">Скриншот</th>
                        <th className="px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('created_at')}
                            className="flex items-center gap-1 hover:text-emerald-400"
                          >
                            Дата
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPayments.map(payment => (
                        <tr key={payment.id} className="border-b border-gray-700">
                          <td className="px-6 py-4">
                            <p className="font-medium">@{payment.username || payment.telegram_id}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium">{payment.amount.toLocaleString()} {payment.currency}</p>
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
                                title="Открыть скриншот"
                              >
                                <Eye className="w-4 h-4" />
                                Просмотр
                              </a>
                            ) : (
                              <span className="text-gray-400">Нет</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            <div>
                              <div>{new Date(payment.created_at).toLocaleDateString()}</div>
                              <div className="text-xs">{new Date(payment.created_at).toLocaleTimeString()}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedPayment(payment)}
                                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1 rounded text-xs flex items-center gap-1"
                                title="Подробная информация"
                              >
                                <Info className="w-3 h-3" />
                                Детали
                              </button>
                              {payment.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handlePaymentAction(payment.id, 'approve')}
                                    disabled={actionLoading === `payment_${payment.id}_approve`}
                                    className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1 rounded text-xs flex items-center gap-1"
                                  >
                                    {actionLoading === `payment_${payment.id}_approve` ? (
                                      <Loader className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3" />
                                    )}
                                    Одобрить
                                  </button>
                                  <button
                                    onClick={() => handlePaymentAction(payment.id, 'reject')}
                                    disabled={actionLoading === `payment_${payment.id}_reject`}
                                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded text-xs flex items-center gap-1"
                                  >
                                    {actionLoading === `payment_${payment.id}_reject` ? (
                                      <Loader className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <XCircle className="w-3 h-3" />
                                    )}
                                    Отклонить
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPaymentsPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Настройки системы</h2>
                  {settingsChanged && (
                    <button
                      onClick={handleSaveSettings}
                      disabled={actionLoading === 'save_settings'}
                      className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      {actionLoading === 'save_settings' ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Сохранить изменения
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Настройки платежей</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Стоимость VIP доступа (₽)</label>
                        <input
                          type="number"
                          value={settings.vipPrice}
                          onChange={(e) => {
                            setSettings({ ...settings, vipPrice: Number(e.target.value) });
                            setSettingsChanged(true);
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Срок действия VIP (дней)</label>
                        <input
                          type="number"
                          value={settings.vipDuration}
                          onChange={(e) => {
                            setSettings({ ...settings, vipDuration: Number(e.target.value) });
                            setSettingsChanged(true);
                          }}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Уведомления</h3>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={settings.notifications.newPayments}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                newPayments: e.target.checked
                              }
                            });
                            setSettingsChanged(true);
                          }}
                          className="mr-2" 
                        />
                        <span>Уведомления о новых платежах</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={settings.notifications.vipExpiration}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                vipExpiration: e.target.checked
                              }
                            });
                            setSettingsChanged(true);
                          }}
                          className="mr-2" 
                        />
                        <span>Уведомления об истечении VIP</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={settings.notifications.dailyReports}
                          onChange={(e) => {
                            setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                dailyReports: e.target.checked
                              }
                            });
                            setSettingsChanged(true);
                          }}
                          className="mr-2" 
                        />
                        <span>Ежедневные отчеты</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Безопасность</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={handleResetSessions}
                        disabled={actionLoading === 'reset_sessions'}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        {actionLoading === 'reset_sessions' ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Сбросить все сессии
                      </button>
                      <span className="text-sm text-gray-400">Отключит всех пользователей</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={handleClearLogs}
                        disabled={actionLoading === 'clear_logs'}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        {actionLoading === 'clear_logs' ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Очистить логи (старше 30 дней)
                      </button>
                      <span className="text-sm text-gray-400">Безвозвратно удалит старые логи</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Детали пользователя</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Telegram ID</p>
                  <p className="font-medium">{selectedUser.telegram_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Username</p>
                  <p className="font-medium">@{selectedUser.username || 'Не указан'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Полное имя</p>
                  <p className="font-medium">{selectedUser.full_name || 'Не указано'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">VIP статус</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedUser.vip_access ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedUser.vip_access ? 'VIP' : 'Обычный'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Дата регистрации</p>
                  <p className="font-medium">{new Date(selectedUser.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">VIP истекает</p>
                  <p className="font-medium">
                    {selectedUser.access_expires_at 
                      ? new Date(selectedUser.access_expires_at).toLocaleString() 
                      : 'Не активен'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Всего платежей</p>
                  <p className="font-medium">{selectedUser.total_payments}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Детали платежа</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">ID платежа</p>
                  <p className="font-medium font-mono text-sm">{selectedPayment.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Пользователь</p>
                  <p className="font-medium">@{selectedPayment.username || selectedPayment.telegram_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Сумма</p>
                  <p className="font-medium text-lg">{selectedPayment.amount.toLocaleString()} {selectedPayment.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Статус</p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedPayment.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                    selectedPayment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedPayment.status === 'verified' ? 'Подтверждено' :
                     selectedPayment.status === 'pending' ? 'Ожидает проверки' : 'Отклонено'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Дата создания</p>
                  <p className="font-medium">{new Date(selectedPayment.created_at).toLocaleString()}</p>
                </div>
                {selectedPayment.verified_at && (
                  <div>
                    <p className="text-sm text-gray-400">Дата проверки</p>
                    <p className="font-medium">{new Date(selectedPayment.verified_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              {selectedPayment.screenshot_url && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Скриншот платежа</p>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <a
                      href={selectedPayment.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Открыть скриншот в новой вкладке
                    </a>
                  </div>
                </div>
              )}

              {selectedPayment.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => {
                      handlePaymentAction(selectedPayment.id, 'approve');
                      setSelectedPayment(null);
                    }}
                    disabled={actionLoading?.includes('payment_')}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Одобрить платеж
                  </button>
                  <button
                    onClick={() => {
                      handlePaymentAction(selectedPayment.id, 'reject');
                      setSelectedPayment(null);
                    }}
                    disabled={actionLoading?.includes('payment_')}
                    className="flex-1 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Отклонить платеж
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog 
        state={confirmDialog}
        onClose={() => setConfirmDialog({ ...confirmDialog, show: false })}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, show: false });
        }}
      />
    </div>
  );
}