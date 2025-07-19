import asyncio
import logging
from datetime import datetime, timedelta
import os
import re
from typing import Optional, Dict, Any

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage

from supabase_client import SupabaseClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize bot and dispatcher
BOT_TOKEN = os.getenv("BOT_TOKEN")
bot = Bot(token=BOT_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# Initialize Supabase client
supabase_client = SupabaseClient()

# FSM States
class PaymentStates(StatesGroup):
    waiting_for_screenshot = State()

# Utility functions
def generate_access_link(payment_id: str, user_id: int) -> str:
    """Generate unique access link for VIP chat"""
    import secrets
    token = secrets.token_urlsafe(32)
    # In real implementation, save this token to database
    return f"https://t.me/+{token}"

def is_payment_expired(created_at: str, hours_limit: int = 24) -> bool:
    """Check if payment is expired"""
    try:
        created_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        expiry_time = created_time + timedelta(hours=hours_limit)
        return datetime.now() > expiry_time
    except Exception as e:
        logger.error(f"Error checking payment expiry: {e}")
        return True

def validate_screenshot_text(text: str) -> Dict[str, Any]:
    """Basic validation of screenshot text for payment confirmation"""
    validation_result = {
        "is_valid": False,
        "found_amount": False,
        "found_success": False,
        "found_date": False,
        "confidence": 0
    }
    
    if not text:
        return validation_result
    
    text_lower = text.lower()
    
    # Check for amount (500 rubles)
    amount_patterns = [r'500', r'пятьсот', r'five hundred']
    for pattern in amount_patterns:
        if re.search(pattern, text_lower):
            validation_result["found_amount"] = True
            break
    
    # Check for success status
    success_patterns = [r'успешно', r'выполнено', r'завершено', r'success', r'completed', r'paid']
    for pattern in success_patterns:
        if re.search(pattern, text_lower):
            validation_result["found_success"] = True
            break
    
    # Check for recent date (simple check)
    date_patterns = [r'\d{1,2}[./]\d{1,2}[./]\d{2,4}', r'\d{1,2}:\d{2}']
    for pattern in date_patterns:
        if re.search(pattern, text):
            validation_result["found_date"] = True
            break
    
    # Calculate confidence
    confidence = 0
    if validation_result["found_amount"]:
        confidence += 40
    if validation_result["found_success"]:
        confidence += 40
    if validation_result["found_date"]:
        confidence += 20
    
    validation_result["confidence"] = confidence
    validation_result["is_valid"] = confidence >= 60
    
    return validation_result

async def process_screenshot_automatically(screenshot_url: str, payment_id: str) -> Dict[str, Any]:
    """Process screenshot automatically using OCR or AI"""
    try:
        # Here you would implement actual OCR/AI processing
        # For now, we'll simulate the process
        
        # Placeholder for OCR text extraction
        extracted_text = "Платеж выполнен успешно 500 рублей 15:30 25.12.2024"
        
        validation = validate_screenshot_text(extracted_text)
        
        result = {
            "success": validation["is_valid"],
            "confidence": validation["confidence"],
            "extracted_text": extracted_text,
            "validation_details": validation
        }
        
        # Update payment status based on validation
        if validation["is_valid"]:
            await supabase_client.update_payment_status(
                payment_id=payment_id,
                status="auto_verified",
                verification_details=result
            )
        else:
            await supabase_client.update_payment_status(
                payment_id=payment_id,
                status="needs_manual_review",
                verification_details=result
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing screenshot automatically: {e}")
        return {"success": False, "error": str(e)}

async def notify_moderators(payment_id: str, user_id: int, screenshot_url: str):
    """Notify moderators about new payment for manual review"""
    try:
        # Get moderator chat IDs from environment or database
        moderator_chat_ids = os.getenv("MODERATOR_CHAT_IDS", "").split(",")
        
        if not moderator_chat_ids or moderator_chat_ids == [""]:
            logger.warning("No moderator chat IDs configured")
            return
        
        message_text = (
            f"🔔 <b>Новый платеж на проверку</b>\n\n"
            f"🆔 <b>Payment ID:</b> <code>{payment_id}</code>\n"
            f"👤 <b>User ID:</b> <code>{user_id}</code>\n\n"
            f"📸 <b>Скриншот:</b> {screenshot_url}\n\n"
            f"⏰ <b>Время:</b> {datetime.now().strftime('%d.%m.%Y %H:%M')}"
        )
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text="✅ Подтвердить", callback_data=f"mod_approve:{payment_id}"),
                InlineKeyboardButton(text="❌ Отклонить", callback_data=f"mod_reject:{payment_id}")
            ],
            [InlineKeyboardButton(text="📝 Детали", callback_data=f"mod_details:{payment_id}")]
        ])
        
        for chat_id in moderator_chat_ids:
            if chat_id.strip():
                try:
                    await bot.send_message(
                        chat_id=int(chat_id.strip()),
                        text=message_text,
                        reply_markup=keyboard
                    )
                except Exception as e:
                    logger.error(f"Failed to notify moderator {chat_id}: {e}")
                    
    except Exception as e:
        logger.error(f"Error notifying moderators: {e}")

# Bot handlers
@dp.message(Command("start"))
async def start_handler(message: types.Message):
    """Handle /start command"""
    user = message.from_user
    
    # Log user action
    await supabase_client.log_user_action(
        telegram_id=user.id,
        action="bot_start",
        details={"username": user.username, "first_name": user.first_name}
    )
    
    welcome_text = (
        f"👋 Привет, {user.first_name}!\n\n"
        "🎯 Добро пожаловать в VIP бот!\n\n"
        "💎 Получите доступ к эксклюзивному контенту всего за 500 рублей.\n\n"
        "🔥 Что вас ждет:\n"
        "• Закрытый VIP чат\n"
        "• Эксклюзивные материалы\n"
        "• Прямое общение с экспертами\n"
        "• Приоритетная поддержка\n\n"
        "💳 Готовы присоединиться?"
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💳 Оплатить доступ (500₽)", callback_data="pay")],
        [InlineKeyboardButton(text="ℹ️ Подробнее", callback_data="info")]
    ])
    
    await message.answer(welcome_text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "pay")
async def handle_payment(callback_query: CallbackQuery):
    """Handle payment initiation"""
    user = callback_query.from_user
    
    try:
        # Create payment record
        payment_data = await supabase_client.create_payment(
            telegram_id=user.id,
            amount=500,
            currency="RUB"
        )
        
        payment_id = payment_data.get("payment_id")
        
        payment_text = (
            "💳 <b>Оплата VIP доступа</b>\n\n"
            "💰 <b>Сумма:</b> 500 рублей\n"
            f"🆔 <b>ID платежа:</b> <code>{payment_id}</code>\n\n"
            "📱 <b>Способы оплаты:</b>\n"
            "• СберБанк: <code>+7 (XXX) XXX-XX-XX</code>\n"
            "• Тинькофф: <code>+7 (XXX) XXX-XX-XX</code>\n"
            "• ЮMoney: <code>XXXXXXXXXXXXXX</code>\n\n"
            "📸 <b>После оплаты:</b>\n"
            "1. Сделайте скриншот подтверждения\n"
            "2. Нажмите 'Я оплатил'\n"
            "3. Отправьте скриншот в чат\n\n"
            "⏰ <b>Время на оплату:</b> 24 часа"
        )
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="✅ Я оплатил", callback_data=f"payment_done:{payment_id}")],
            [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
        ])
        
        await callback_query.message.edit_text(payment_text, reply_markup=keyboard)
        
    except Exception as e:
        logger.error(f"Error creating payment: {e}")
        await callback_query.message.edit_text(
            "❌ Ошибка при создании платежа. Попробуйте позже.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
            ])
        )

@dp.callback_query(lambda c: c.data.startswith("payment_done:"))
async def handle_payment_verification(callback_query: CallbackQuery):
    """Handle payment verification"""
    user = callback_query.from_user
    payment_id = callback_query.data.split(":")[1]
    
    try:
        if payment_id:
            # Check payment status first
            payment_status = await supabase_client.get_payment_status(payment_id)
            
            if not payment_status:
                await callback_query.message.edit_text(
                    "❌ <b>Платеж не найден</b>\n\n"
                    "Возможно, платеж был удален или ID неверный.",
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                        [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
                    ])
                )
                return
            
            current_status = payment_status.get('status')
            
            # Check if payment is expired
            if is_payment_expired(payment_status.get('created_at', '')):
                await supabase_client.update_payment_status(payment_id, 'expired')
                current_status = 'expired'
            
            # Handle different payment statuses
            if current_status == 'verified' or current_status == 'auto_verified':
                # Payment already verified
                access_link = payment_status.get('access_link')
                if not access_link:
                    # Generate new access link
                    access_link = generate_access_link(payment_id, user.id)
                    expires_at = (datetime.now() + timedelta(days=30)).isoformat()
                    
                    await supabase_client.update_payment_status(
                        payment_id=payment_id,
                        status='verified',
                        access_link=access_link,
                        expires_at=expires_at
                    )
                else:
                    expires_at = payment_status.get('expires_at')
                
                success_text = (
                    "✅ <b>Оплата уже подтверждена!</b>\n\n"
                    "🎉 У вас есть VIP доступ.\n\n"
                    f"🔗 <b>Ваша ссылка для входа:</b>\n{access_link}\n\n"
                    f"📅 <b>Действует до:</b> {expires_at}\n\n"
                    "💎 Добро пожаловать в VIP клуб!"
                )
                
                keyboard = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="🎯 Войти в VIP чат", url=access_link)],
                    [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
                ])
                
                await callback_query.message.edit_text(success_text, reply_markup=keyboard)
                return
            
            elif current_status == 'rejected':
                # Payment was rejected
                rejection_reason = payment_status.get('rejection_reason', 'Неизвестная причина')
                
                await callback_query.message.edit_text(
                    f"❌ <b>Платеж отклонен</b>\n\n"
                    f"📝 <b>Причина:</b> {rejection_reason}\n\n"
                    "Пожалуйста, попробуйте оплатить снова или обратитесь в поддержку.",
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                        [InlineKeyboardButton(text="💳 Новый платеж", callback_data="pay")],
                        [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
                    ])
                )
                return
            
            elif current_status == 'pending':
                # Check if screenshot was uploaded
                if payment_status.get('screenshot_url'):
                    await callback_query.message.edit_text(
                        "⏳ <b>Платеж на проверке</b>\n\n"
                        "📸 Скриншот получен и передан на проверку модераторам.\n\n"
                        "⏰ Обычно проверка занимает до 30 минут.\n\n"
                        "Мы уведомим вас о результате.",
                        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                            [InlineKeyboardButton(text="🔄 Проверить снова", callback_data=f"payment_done:{payment_id}")],
                            [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
                        ])
                    )
                else:
                    # Request screenshot
                    await callback_query.message.edit_text(
                        "📸 <b>Нужен скриншот оплаты</b>\n\n"
                        "Пожалуйста, отправьте скриншот подтверждения оплаты в этот чат.\n\n"
                        "💡 Скриншот должен содержать:\n"
                        "• Сумму платежа (500 рублей)\n"
                        "• Дату и время\n"
                        "• Статус 'Успешно' или 'Выполнено'",
                        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                            [InlineKeyboardButton(text="🔄 Проверить снова", callback_data=f"payment_done:{payment_id}")],
                            [InlineKeyboardButton(text="🔙 Назад", callback_data="pay")]
                        ])
                    )
                    
                    # Set state to wait for screenshot
                    from aiogram.fsm.context import FSMContext
                    state = FSMContext(storage=storage, key=types.StorageKey(bot_id=bot.id, chat_id=callback_query.message.chat.id, user_id=user.id))
                    await state.set_state(PaymentStates.waiting_for_screenshot)
                    await state.update_data(payment_id=payment_id)
                return
            
            elif current_status == 'expired':
                await callback_query.message.edit_text(
                    "⏰ <b>Платеж истек</b>\n\n"
                    "Время на оплату истекло. Пожалуйста, создайте новый платеж.",
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                        [InlineKeyboardButton(text="💳 Новый платеж", callback_data="pay")],
                        [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
                    ])
                )
                return
            
            else:
                # Unknown status
                await callback_query.message.edit_text(
                    f"❓ <b>Неизвестный статус платежа:</b> {current_status}\n\n"
                    "Обратитесь в поддержку для решения проблемы.",
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                        [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
                    ])
                )
                
    except Exception as e:
        logger.error(f"Error verifying payment: {e}")
        await callback_query.message.edit_text(
            "❌ <b>Ошибка при проверке платежа</b>\n\n"
            "Произошла техническая ошибка. Попробуйте позже или обратитесь в поддержку.\n\n"
            f"🆔 <b>ID платежа:</b> <code>{payment_id}</code>",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔄 Попробовать снова", callback_data=f"payment_done:{payment_id}")],
                [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
            ])
        )

@dp.message(PaymentStates.waiting_for_screenshot)
async def handle_screenshot_upload(message: types.Message, state: FSMContext):
    """Handle screenshot upload from user"""
    try:
        data = await state.get_data()
        payment_id = data.get('payment_id')
        
        if not payment_id:
            await message.answer("❌ Ошибка: ID платежа не найден. Начните процесс заново.")
            await state.clear()
            return
        
        if message.photo:
            # Get the largest photo
            photo = message.photo[-1]
            
            # Download photo
            file_info = await bot.get_file(photo.file_id)
            file_url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_info.file_path}"
            
            # Save screenshot URL to database
            await supabase_client.update_payment_screenshot(payment_id, file_url)
            
            # Try automatic processing first
            auto_result = await process_screenshot_automatically(file_url, payment_id)
            
            if auto_result.get("success") and auto_result.get("confidence", 0) >= 80:
                # High confidence - auto approve
                access_link = generate_access_link(payment_id, message.from_user.id)
                expires_at = (datetime.now() + timedelta(days=30)).isoformat()
                
                await supabase_client.update_payment_status(
                    payment_id=payment_id,
                    status='verified',
                    access_link=access_link,
                    expires_at=expires_at
                )
                
                success_text = (
                    "✅ <b>Оплата автоматически подтверждена!</b>\n\n"
                    "🎉 Поздравляем! Вы получили VIP доступ.\n\n"
                    f"🔗 <b>Ваша ссылка для входа:</b>\n{access_link}\n\n"
                    f"📅 <b>Действует до:</b> {expires_at}\n\n"
                    "💎 Добро пожаловать в VIP клуб!"
                )
                
                keyboard = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="🎯 Войти в VIP чат", url=access_link)],
                    [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
                ])
                
                await message.answer(success_text, reply_markup=keyboard)
                
                # Log successful verification
                await supabase_client.log_user_action(
                    telegram_id=message.from_user.id,
                    action="payment_auto_verified",
                    details={"payment_id": payment_id, "confidence": auto_result.get("confidence")}
                )
                
            else:
                # Low confidence or failed - send to manual review
                await supabase_client.update_payment_status(payment_id, 'needs_manual_review')
                
                await message.answer(
                    "📸 <b>Скриншот получен!</b>\n\n"
                    "⏳ Ваш платеж отправлен на проверку модераторам.\n\n"
                    "⏰ Обычно проверка занимает до 30 минут.\n\n"
                    "Мы уведомим вас о результате.",
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                        [InlineKeyboardButton(text="🔄 Проверить статус", callback_data=f"payment_done:{payment_id}")],
                        [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
                    ])
                )
                
                # Notify moderators
                await notify_moderators(payment_id, message.from_user.id, file_url)
            
            await state.clear()
            
        else:
            await message.answer(
                "❌ Пожалуйста, отправьте изображение (скриншот) подтверждения оплаты.",
                reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="🔙 Отмена", callback_data="back_to_start")]
                ])
            )
            
    except Exception as e:
        logger.error(f"Error handling screenshot upload: {e}")
        await message.answer(
            "❌ Ошибка при обработке скриншота. Попробуйте еще раз.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
            ])
        )
        await state.clear()

# Moderator handlers
@dp.callback_query(lambda c: c.data.startswith("mod_approve:"))
async def handle_moderator_approve(callback_query: CallbackQuery):
    """Handle moderator approval"""
    payment_id = callback_query.data.split(":")[1]
    
    try:
        # Get payment info
        payment_info = await supabase_client.get_payment_status(payment_id)
        if not payment_info:
            await callback_query.answer("❌ Платеж не найден")
            return
        
        user_id = payment_info.get('telegram_id')
        
        # Generate access link
        access_link = generate_access_link(payment_id, user_id)
        expires_at = (datetime.now() + timedelta(days=30)).isoformat()
        
        # Update payment status
        await supabase_client.update_payment_status(
            payment_id=payment_id,
            status='verified',
            access_link=access_link,
            expires_at=expires_at
        )
        
        # Notify user
        success_text = (
            "✅ <b>Оплата подтверждена!</b>\n\n"
            "🎉 Поздравляем! Вы получили VIP доступ.\n\n"
            f"🔗 <b>Ваша ссылка для входа:</b>\n{access_link}\n\n"
            f"📅 <b>Действует до:</b> {expires_at}\n\n"
            "💎 Добро пожаловать в VIP клуб!"
        )
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🎯 Войти в VIP чат", url=access_link)]
        ])
        
        await bot.send_message(user_id, success_text, reply_markup=keyboard)
        
        # Update moderator message
        await callback_query.message.edit_text(
            f"✅ <b>Платеж {payment_id} подтвержден</b>\n\n"
            f"👤 Пользователь {user_id} получил доступ.\n"
            f"⏰ {datetime.now().strftime('%d.%m.%Y %H:%M')}"
        )
        
        await callback_query.answer("✅ Платеж подтвержден")
        
    except Exception as e:
        logger.error(f"Error approving payment: {e}")
        await callback_query.answer("❌ Ошибка при подтверждении")

@dp.callback_query(lambda c: c.data.startswith("mod_reject:"))
async def handle_moderator_reject(callback_query: CallbackQuery):
    """Handle moderator rejection"""
    payment_id = callback_query.data.split(":")[1]
    
    try:
        # Get payment info
        payment_info = await supabase_client.get_payment_status(payment_id)
        if not payment_info:
            await callback_query.answer("❌ Платеж не найден")
            return
        
        user_id = payment_info.get('telegram_id')
        
        # Update payment status
        await supabase_client.update_payment_status(
            payment_id=payment_id,
            status='rejected',
            rejection_reason='Скриншот не прошел проверку'
        )
        
        # Notify user
        await bot.send_message(
            user_id,
            "❌ <b>Платеж отклонен</b>\n\n"
            "📝 <b>Причина:</b> Скриншот не прошел проверку\n\n"
            "Пожалуйста, попробуйте оплатить снова или обратитесь в поддержку.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="💳 Новый платеж", callback_data="pay")]
            ])
        )
        
        # Update moderator message
        await callback_query.message.edit_text(
            f"❌ <b>Платеж {payment_id} отклонен</b>\n\n"
            f"👤 Пользователь {user_id} уведомлен.\n"
            f"⏰ {datetime.now().strftime('%d.%m.%Y %H:%M')}"
        )
        
        await callback_query.answer("❌ Платеж отклонен")
        
    except Exception as e:
        logger.error(f"Error rejecting payment: {e}")
        await callback_query.answer("❌ Ошибка при отклонении")

@dp.callback_query(lambda c: c.data == "back_to_start")
async def handle_back_to_start(callback_query: CallbackQuery):
    """Handle back to start"""
    user = callback_query.from_user
    
    welcome_text = (
        f"👋 Привет, {user.first_name}!\n\n"
        "🎯 Добро пожаловать в VIP бот!\n\n"
        "💎 Получите доступ к эксклюзивному контенту всего за 500 рублей.\n\n"
        "🔥 Что вас ждет:\n"
        "• Закрытый VIP чат\n"
        "• Эксклюзивные материалы\n"
        "• Прямое общение с экспертами\n"
        "• Приоритетная поддержка\n\n"
        "💳 Готовы присоединиться?"
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💳 Оплатить доступ (500₽)", callback_data="pay")],
        [InlineKeyboardButton(text="ℹ️ Подробнее", callback_data="info")]
    ])
    
    await callback_query.message.edit_text(welcome_text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "info")
async def handle_info(callback_query: CallbackQuery):
    """Handle info request"""
    info_text = (
        "ℹ️ <b>Подробная информация</b>\n\n"
        "💎 <b>VIP доступ включает:</b>\n"
        "• Закрытый Telegram чат с экспертами\n"
        "• Эксклюзивные материалы и гайды\n"
        "• Ежедневные аналитические обзоры\n"
        "• Приоритетная техническая поддержка\n"
        "• Доступ к архиву материалов\n\n"
        "💰 <b>Стоимость:</b> 500 рублей\n"
        "⏰ <b>Срок действия:</b> 30 дней\n"
        "🔄 <b>Продление:</b> автоматическое\n\n"
        "📞 <b>Поддержка:</b> @support_username"
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💳 Оплатить доступ", callback_data="pay")],
        [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
    ])
    
    await callback_query.message.edit_text(info_text, reply_markup=keyboard)

async def main():
    """Main function to start the bot"""
    try:
        logger.info("Starting bot...")
        await dp.start_polling(bot)
    except Exception as e:
        logger.error(f"Error starting bot: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())