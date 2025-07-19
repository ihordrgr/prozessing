import React from 'react';
import { Crown, Star, Shield, Zap, ArrowRight, ExternalLink, Settings, Users, Bell } from 'lucide-react';
import { PaymentForm } from './components/PaymentForm';
import { VipDashboard } from './components/VipDashboard';
import { AdminPanel } from './components/AdminPanel';
import { NotificationSystem } from './components/NotificationSystem';
import { SecuritySystem } from './components/SecuritySystem';
import { SupportSystem } from './components/SupportSystem';

function App() {
  const [showPaymentForm, setShowPaymentForm] = React.useState(false);
  const [showDashboard, setShowDashboard] = React.useState(false);
  const [showAdminPanel, setShowAdminPanel] = React.useState(false);
  const [showSecurity, setShowSecurity] = React.useState(false);
  const [showSupport, setShowSupport] = React.useState(false);
  const [telegramId, setTelegramId] = React.useState<number | undefined>();
  const [isAdmin, setIsAdmin] = React.useState(false);

  // Get Telegram ID from URL params or WebApp
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tgId = urlParams.get('telegram_id');
    
    if (tgId) {
      setTelegramId(parseInt(tgId));
    } else if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      setTelegramId(window.Telegram.WebApp.initDataUnsafe.user.id);
    } else {
      // For development/testing purposes, you can set a test telegram ID
      // Remove this in production
      setTelegramId(123456789);
      
      // Check if user is admin (in production, check against database)
      const adminIds = [123456789, 987654321]; // Add your admin telegram IDs
      setIsAdmin(adminIds.includes(123456789));
    }
  }, []);

  const handlePaymentSuccess = (accessLink: string) => {
    setShowPaymentForm(false);
    // Could redirect to access link or show success message
    window.open(accessLink, '_blank');
  };

  const resetView = () => {
    setShowPaymentForm(false);
    setShowDashboard(false);
    setShowAdminPanel(false);
    setShowSecurity(false);
    setShowSupport(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-yellow-900/10 via-transparent to-transparent"></div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        
        {/* Navigation Bar */}
        <div className="absolute top-4 right-4 flex gap-2">
          <NotificationSystem telegramId={telegramId} />
          {telegramId && (
            <>
            <button
              onClick={() => {
                resetView();
                setShowDashboard(true);
              }}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
              title="Личный кабинет"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                resetView();
                setShowSecurity(true);
              }}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
              title="Безопасность"
            >
              <Shield className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                resetView();
                setShowSupport(true);
              }}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
              title="Поддержка"
            >
              <Bell className="w-5 h-5" />
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  resetView();
                  setShowAdminPanel(true);
                }}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 p-2 rounded-lg transition-colors"
                title="Админ-панель"
              >
                <Users className="w-5 h-5" />
              </button>
            )}
            </>
          )}
        </div>

        {/* Admin Panel */}
        {showAdminPanel && isAdmin ? (
          <div className="w-full max-w-7xl">
            <div className="mb-6 text-center">
              <button
                onClick={resetView}
                className="text-emerald-400 hover:text-emerald-300 mb-4"
              >
                ← Вернуться на главную
              </button>
            </div>
            <AdminPanel />
          </div>
        ) : showDashboard && telegramId ? (
          /* User Dashboard */
          <div className="w-full max-w-6xl">
            <div className="mb-6 text-center">
              <button
                onClick={resetView}
                className="text-emerald-400 hover:text-emerald-300 mb-4"
              >
                ← Вернуться на главную
              </button>
              <h1 className="text-3xl font-bold">Личный кабинет</h1>
            </div>
            <VipDashboard telegramId={telegramId} />
          </div>
        ) : showSecurity && telegramId ? (
          /* Security System */
          <div className="w-full max-w-4xl">
            <div className="mb-6 text-center">
              <button
                onClick={resetView}
                className="text-emerald-400 hover:text-emerald-300 mb-4"
              >
                ← Вернуться на главную
              </button>
              <h1 className="text-3xl font-bold">Безопасность</h1>
            </div>
            <SecuritySystem telegramId={telegramId} />
          </div>
        ) : showSupport && telegramId ? (
          /* Support System */
          <div className="w-full max-w-4xl">
            <div className="mb-6 text-center">
              <button
                onClick={resetView}
                className="text-emerald-400 hover:text-emerald-300 mb-4"
              >
                ← Вернуться на главную
              </button>
              <h1 className="text-3xl font-bold">Поддержка</h1>
            </div>
            <SupportSystem telegramId={telegramId} />
          </div>
        ) : showPaymentForm ? (
          /* Payment Form */
          <div className="w-full max-w-2xl">
            <div className="mb-6 text-center">
              <button
                onClick={resetView}
                className="text-emerald-400 hover:text-emerald-300 mb-4"
              >
                ← Вернуться на главную
              </button>
            </div>
            <PaymentForm 
              telegramId={telegramId} 
              onPaymentSuccess={handlePaymentSuccess}
            />
          </div>
        ) : (
          /* Main Landing Page */
          <>
        
        {/* Header Section */}
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Crown className="w-16 h-16 text-yellow-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-yellow-400 via-emerald-400 to-yellow-400 bg-clip-text text-transparent animate-pulse">
            🔥 VIP ДОСТУП
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-bold text-gray-300 mb-4">
            К ЧАСТНЫМ МАТЕРИАЛАМ
          </h2>
          
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Получите эксклюзивный доступ к закрытому разделу с премиум-контентом. 
            Ограниченное количество мест для VIP-участников.
          </p>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-emerald-400/50 transition-all duration-300 group">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center">Эксклюзивный контент</h3>
            <p className="text-gray-400 text-center">Доступ к закрытым материалам и приватным чатам</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-yellow-400/50 transition-all duration-300 group">
            <div className="flex items-center justify-center mb-4">
              <Star className="w-12 h-12 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center">VIP статус</h3>
            <p className="text-gray-400 text-center">Особые привилегии и первоочередной доступ</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-emerald-400/50 transition-all duration-300 group">
            <div className="flex items-center justify-center mb-4">
              <Zap className="w-12 h-12 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center">Мгновенная активация</h3>
            <p className="text-gray-400 text-center">Доступ предоставляется сразу после оплаты</p>
          </div>
        </div>

        {/* Main CTA Section */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/20 max-w-2xl mx-auto mb-8 shadow-2xl">
          <div className="text-center">
            <div className="mb-6">
              <span className="inline-block bg-gradient-to-r from-emerald-400 to-yellow-400 text-black px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                Ограниченное предложение
              </span>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Оплата необходима для получения
            </h3>
            <h4 className="text-xl md:text-2xl font-semibold text-emerald-400 mb-8">
              личного доступа к закрытому разделу
            </h4>
            
            {/* Payment Button */}
            <button 
              onClick={() => {
                resetView();
                setShowPaymentForm(true);
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-black font-bold py-4 px-8 rounded-2xl text-lg md:text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-3 group"
            >
                <span>💳</span>
                Оплатить доступ
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center max-w-xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h5 className="text-lg font-semibold mb-3 text-yellow-400">Инструкция:</h5>
            <ol className="text-left space-y-2 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="bg-emerald-500 text-black w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Нажмите кнопку "Оплатить доступ"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-emerald-500 text-black w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Следуйте инструкциям в Telegram боте</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-emerald-500 text-black w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Отправьте скриншот оплаты в бот</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-emerald-500 text-black w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                <span>Получите мгновенный доступ к VIP разделу</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2025 VIP Клуб Доступа. Все права защищены.</p>
          <p className="mt-2">Безопасная оплата через проверенные сервисы</p>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export default App;