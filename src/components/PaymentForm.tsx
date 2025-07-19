import React, { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase, dbFunctions } from '../lib/supabase'

interface PaymentFormProps {
  telegramId?: number
  onPaymentSuccess?: (accessLink: string) => void
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ 
  telegramId, 
  onPaymentSuccess 
}) => {
  const [step, setStep] = useState<'payment' | 'screenshot' | 'verification' | 'success'>('payment')
  const [paymentId, setPaymentId] = useState<string>('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [accessLink, setAccessLink] = useState<string>('')

  const handlePaymentStart = async () => {
    if (!telegramId) {
      setError('Telegram ID не найден')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create payment record
      const payment = await dbFunctions.createPayment(telegramId, 500, 'manual')
      setPaymentId(payment.id)
      
      // Log action
      await dbFunctions.logUserAction(telegramId, 'payment_started', {
        payment_id: payment.id,
        amount: 500
      })

      setStep('screenshot')
    } catch (err) {
      setError('Ошибка при создании платежа')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, загрузите изображение')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Размер файла не должен превышать 10MB')
        return
      }

      setScreenshot(file)
      setError('')
    }
  }

  const handleScreenshotSubmit = async () => {
    if (!screenshot || !paymentId || !telegramId) {
      setError('Необходимо загрузить скриншот')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Upload screenshot to Supabase Storage
      const { url } = await dbFunctions.uploadScreenshot(screenshot, telegramId)
      
      // Update payment with screenshot URL
      await dbFunctions.updatePaymentScreenshot(paymentId, url)
      
      // Log action
      await dbFunctions.logUserAction(telegramId, 'screenshot_uploaded', {
        payment_id: paymentId,
        screenshot_url: url
      })

      setStep('verification')
      
      // Simulate verification process (in real app, this would be done by admin/AI)
      setTimeout(async () => {
        try {
          const result = await dbFunctions.verifyPayment(paymentId, true)
          
          if (result.success) {
            setAccessLink(result.access_link)
            setStep('success')
            onPaymentSuccess?.(result.access_link)
          } else {
            setError('Платеж не был подтвержден')
            setStep('screenshot')
          }
        } catch (err) {
          setError('Ошибка при проверке платежа')
          setStep('screenshot')
        }
      }, 3000)

    } catch (err) {
      setError('Ошибка при загрузке скриншота')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const renderPaymentStep = () => (
    <div className="text-center">
      <h3 className="text-2xl font-bold mb-4">Оплата VIP доступа</h3>
      <div className="bg-white/10 rounded-lg p-6 mb-6">
        <div className="text-3xl font-bold text-emerald-400 mb-2">500 ₽</div>
        <p className="text-gray-300">Доступ на 30 дней</p>
      </div>
      
      <div className="text-left mb-6 space-y-3">
        <h4 className="font-semibold text-yellow-400">Способы оплаты:</h4>
        <ul className="space-y-2 text-gray-300">
          <li>• Банковская карта</li>
          <li>• СБП (Система быстрых платежей)</li>
          <li>• Криптовалюта</li>
          <li>• Электронные кошельки</li>
        </ul>
      </div>

      <button
        onClick={handlePaymentStart}
        disabled={loading}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : (
          'Я произвел оплату'
        )}
      </button>
    </div>
  )

  const renderScreenshotStep = () => (
    <div className="text-center">
      <h3 className="text-2xl font-bold mb-4">Загрузите скриншот оплаты</h3>
      <p className="text-gray-300 mb-6">
        Пожалуйста, загрузите четкий скриншот подтверждения оплаты
      </p>

      <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleScreenshotUpload}
          className="hidden"
          id="screenshot-upload"
        />
        <label
          htmlFor="screenshot-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <span className="text-gray-300">
            {screenshot ? screenshot.name : 'Нажмите для выбора файла'}
          </span>
        </label>
      </div>

      {screenshot && (
        <button
          onClick={handleScreenshotSubmit}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            'Отправить скриншот'
          )}
        </button>
      )}
    </div>
  )

  const renderVerificationStep = () => (
    <div className="text-center">
      <Loader2 className="w-16 h-16 animate-spin text-emerald-400 mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-4">Проверяем оплату</h3>
      <p className="text-gray-300">
        Пожалуйста, подождите. Проверка займет несколько минут...
      </p>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="text-center">
      <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-4 text-emerald-400">Оплата подтверждена!</h3>
      <p className="text-gray-300 mb-6">
        Поздравляем! Вы получили VIP доступ на 30 дней.
      </p>
      
      <div className="bg-white/10 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400 mb-2">Ваша ссылка для входа:</p>
        <a
          href={accessLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 break-all"
        >
          {accessLink}
        </a>
      </div>

      <p className="text-yellow-400 text-sm">
        💎 Добро пожаловать в VIP клуб!
      </p>
    </div>
  )

  return (
    <div className="max-w-md mx-auto bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {step === 'payment' && renderPaymentStep()}
      {step === 'screenshot' && renderScreenshotStep()}
      {step === 'verification' && renderVerificationStep()}
      {step === 'success' && renderSuccessStep()}
    </div>
  )
}