import asyncio
import os
from aiogram import Bot, Dispatcher, types, F
from aiogram.client.default import DefaultBotProperties
from aiogram.types import Message, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
import logging
from supabase_integration import supabase_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN environment variable is required")

bot = Bot(
    token=BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher()


@dp.message(CommandStart())
async def cmd_start(message: Message):
    """Handle /start command"""
    user = message.from_user
    
    # Create or update user profile in Supabase
    try:
        await supabase_client.create_or_update_profile(
            telegram_id=user.id,
            user_data={
                "username": user.username,
                "full_name": user.full_name
            }
        )
        
        # Log user start action
        await supabase_client.log_user_action(
            telegram_id=user.id,
            action="bot_started",
            details={"username": user.username}
        )
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
    
    # Check if user already has VIP access
    try:
        access_status = await supabase_client.check_vip_access(user.id)
        if access_status.get("has_access"):
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🎯 Войти в VIP чат", url="https://t.me/your_vip_chat")],
                [InlineKeyboardButton(text="📊 Мой профиль", callback_data="profile")]
            ])
            
            welcome_text = (
                f"🎉 <b>Добро пожаловать, {user.first_name}!</b>\n\n"
                "✅ У вас уже есть VIP доступ!\n\n"
                f"📅 Действует до: {access_status.get('expires_at', 'неизвестно')}\n\n"
                "Используйте кнопки ниже:"
            )
            
            await message.answer(welcome_text, reply_markup=keyboard)
            return
    except Exception as e:
        logger.error(f"Error checking VIP access: {e}")
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💳 Оплатить доступ", callback_data="pay")],
        [InlineKeyboardButton(text="📋 Инструкция", callback_data="instructions")],
        [InlineKeyboardButton(text="📊 Мой профиль", callback_data="profile")]
    ])
    
    welcome_text = (
        f"🔥 <b>Добро пожаловать в VIP Клуб, {user.first_name}!</b>\n\n"
        "Для получения доступа к эксклюзивным материалам "
        "необходимо произвести оплату.\n\n"
        "💎 <b>Что вы получите:</b>\n"
        "• Доступ к закрытому VIP чату\n"
        "• Эксклюзивные материалы\n"
        "• Приоритетная поддержка\n"
        "• Особые привилегии\n\n"
        "Нажмите кнопку ниже для оплаты:"
    )
    
    await message.answer(welcome_text, reply_markup=keyboard)


@dp.callback_query(F.data == "profile")
async def show_profile(callback_query: types.CallbackQuery):
    """Show user profile information"""
    user = callback_query.from_user
    
    try:
        # Get user profile
        profile = await supabase_client.get_user_profile(user.id)
        payments = await supabase_client.get_user_payments(user.id)
        access_status = await supabase_client.check_vip_access(user.id)
        
        profile_text = f"👤 <b>Профиль пользователя</b>\n\n"
        profile_text += f"🆔 ID: {user.id}\n"
        profile_text += f"👤 Имя: {user.full_name or user.first_name}\n"
        
        if user.username:
            profile_text += f"📝 Username: @{user.username}\n"
        
        profile_text += f"\n💎 <b>VIP Статус:</b> "
        if access_status.get("has_access"):
            profile_text += f"✅ Активен\n"
            profile_text += f"📅 До: {access_status.get('expires_at', 'неизвестно')}\n"
        else:
            profile_text += f"❌ Неактивен\n"
            profile_text += f"❓ Причина: {access_status.get('reason', 'Нет доступа')}\n"
        
        profile_text += f"\n💳 <b>Платежей:</b> {len(payments)}\n"
        
        if payments:
            verified_payments = [p for p in payments if p.get('status') == 'verified']
            profile_text += f"✅ Подтверждено: {len(verified_payments)}\n"
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="💳 Оплатить доступ", callback_data="pay")],
            [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
        ])
        
        await callback_query.message.edit_text(profile_text, reply_markup=keyboard)
        
    except Exception as e:
        logger.error(f"Error showing profile: {e}")
        await callback_query.message.edit_text(
            "❌ Ошибка при загрузке профиля. Попробуйте позже.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
            ])
        )


@dp.callback_query(F.data == "instructions")
async def show_instructions(callback_query: types.CallbackQuery):
    """Show payment instructions"""
    instructions_text = (
        "📋 <b>Инструкция по оплате:</b>\n\n"
        "1️⃣ Нажмите кнопку 'Оплатить доступ'\n"
        "2️⃣ Произведите оплату любым удобным способом\n"
        "3️⃣ Сделайте скриншот подтверждения оплаты\n"
        "4️⃣ Отправьте скриншот в этот бот\n"
        "5️⃣ Получите мгновенный доступ к VIP разделу\n\n"
        "💡 <b>Важно:</b> Доступ предоставляется в течение 5 минут после подтверждения оплаты."
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💳 Оплатить доступ", callback_data="pay")],
        [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
    ])
    
    await callback_query.message.edit_text(instructions_text, reply_markup=keyboard)


@dp.callback_query(F.data == "back_to_start")
async def back_to_start(callback_query: types.CallbackQuery):
    """Return to start menu"""
    # Create a fake message object to reuse cmd_start
    fake_message = callback_query.message
    fake_message.from_user = callback_query.from_user
    await cmd_start(fake_message)


@dp.callback_query(F.data == "pay")
async def process_payment(callback_query: types.CallbackQuery):
    """Handle payment process"""
    user = callback_query.from_user
    
    try:
        # Create payment record in Supabase
        payment = await supabase_client.create_payment(
            telegram_id=user.id,
            amount=500.0,
            payment_method="telegram_bot"
        )
        
        # Store payment ID in user session (you might want to use Redis for this)
        # For now, we'll include it in callback data
        payment_id = payment.get('id')
        
        # Log payment initiation
        await supabase_client.log_user_action(
            telegram_id=user.id,
            action="payment_initiated",
            details={"payment_id": payment_id, "amount": 500}
        )
        
    except Exception as e:
        logger.error(f"Error creating payment: {e}")
        await callback_query.message.edit_text(
            "❌ Ошибка при создании платежа. Попробуйте позже.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
            ])
        )
        return
    
    payment_text = (
        "💳 <b>Оплата доступа</b>\n\n"
        "Стоимость VIP доступа: <b>500 рублей</b>\n\n"
        "💰 <b>Способы оплаты:</b>\n"
        "• Банковская карта\n"
        "• СБП (Система быстрых платежей)\n"
        "• Криптовалюта\n"
        "• Электронные кошельки\n\n"
        "После оплаты отправьте скриншот в этот бот для подтверждения.\n\n"
        f"🆔 <b>ID платежа:</b> <code>{payment_id}</code>"
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Я оплатил", callback_data=f"payment_done:{payment_id}")],
        [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
    ])
    
    await callback_query.message.edit_text(payment_text, reply_markup=keyboard)


@dp.callback_query(F.data.startswith("payment_done:"))
async def payment_confirmation(callback_query: types.CallbackQuery):
    """Handle payment confirmation"""
    user = callback_query.from_user
    payment_id = callback_query.data.split(":")[1] if ":" in callback_query.data else None
    
    await callback_query.message.edit_text(
        "⏳ <b>Проверяем оплату...</b>\n\nПодождите несколько секунд..."
    )
    
    # Simulate payment verification delay
    await asyncio.sleep(3)
    
    try:
        if payment_id:
            # Verify payment using Supabase
            result = await supabase_client.verify_payment(payment_id, verified=True)
            
            if result.get("success"):
                access_link = result.get("access_link")
                expires_at = result.get("expires_at")
                
                success_text = (
                    "✅ <b>Оплата подтверждена!</b>\n\n"
                    "🎉 Поздравляем! Вы получили VIP доступ.\n\n"
                    f"🔗 <b>Ваша ссылка для входа:</b>\n{access_link}\n\n"
                    f"📅 <b>Действует до:</b> {expires_at}\n\n"
                    "💎 Добро пожаловать в VIP клуб!"
                )
                await callback_query.message.edit_text(success_text)
                
                # Log successful verification
                await supabase_client.log_user_action(
                    telegram_id=user.id,
                    action="payment_verified",
                    details={"payment_id": payment_id, "access_link": access_link}
                )
                return
        
        # If we get here, payment verification failed
        error_text = (
            "❌ <b>Оплата не найдена</b>\n\n"
            "Пожалуйста, отправьте скриншот оплаты или "
            "обратитесь в поддержку."
        )
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🔄 Проверить снова", callback_data=f"payment_done:{payment_id}")],
            [InlineKeyboardButton(text="🔙 Назад", callback_data="pay")]
        ])
        await callback_query.message.edit_text(error_text, reply_markup=keyboard)
        
    except Exception as e:
        logger.error(f"Error verifying payment: {e}")
        await callback_query.message.edit_text(
            "❌ Ошибка при проверке платежа. Попробуйте позже.",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start")]
            ])
        )


@dp.message(F.photo)
async def handle_payment_screenshot(message: Message):
    """Handle payment screenshot uploads"""
    user = message.from_user
    
    await message.answer(
        "📸 <b>Скриншот получен!</b>\n\n"
        "Проверяем вашу оплату... Это займет несколько минут."
    )
    
    try:
        # Get the largest photo
        photo = message.photo[-1]
        
        # Download photo
        file_info = await bot.get_file(photo.file_id)
        file_data = await bot.download_file(file_info.file_path)
        
        # Upload to Supabase Storage
        file_path = f"screenshots/{user.id}_{photo.file_id}.jpg"
        screenshot_url = await supabase_client.upload_file_to_storage(
            bucket="payment-screenshots",
            file_path=file_path,
            file_data=file_data.read()
        )
        
        # Find the most recent pending payment for this user
        payments = await supabase_client.get_user_payments(user.id)
        pending_payment = next((p for p in payments if p.get('status') == 'pending'), None)
        
        if pending_payment:
            # Update payment with screenshot
            await supabase_client.update_payment_screenshot(
                payment_id=pending_payment['id'],
                screenshot_url=screenshot_url
            )
            
            # Log screenshot upload
            await supabase_client.log_user_action(
                telegram_id=user.id,
                action="screenshot_uploaded",
                details={
                    "payment_id": pending_payment['id'],
                    "screenshot_url": screenshot_url
                }
            )
            
            # Simulate verification process (in real app, this would be manual or AI-based)
            await asyncio.sleep(2)
            
            # Auto-verify for demo (in production, this would be manual review)
            result = await supabase_client.verify_payment(pending_payment['id'], verified=True)
            
            if result.get("success"):
                access_link = result.get("access_link")
                await message.answer(
                    "✅ <b>Оплата подтверждена!</b>\n\n"
                    f"🔗 <b>Ваша ссылка:</b>\n{access_link}\n\n"
                    "💎 Добро пожаловать в VIP клуб!"
                )
            else:
                await message.answer(
                    "❌ <b>Не удалось подтвердить оплату</b>\n\n"
                    "Скриншот сохранен. Наши модераторы проверят его в ближайшее время."
                )
        else:
            await message.answer(
                "❌ <b>Платеж не найден</b>\n\n"
                "Сначала нажмите кнопку 'Оплатить доступ' в меню."
            )
            
    except Exception as e:
        logger.error(f"Error processing screenshot: {e}")
        await message.answer(
            "❌ <b>Ошибка при обработке скриншота</b>\n\n"
            "Попробуйте отправить скриншот еще раз или обратитесь в поддержку."
        )


async def main():
    """Main function to start the bot"""
    logger.info("Starting VIP Access Bot with Supabase integration...")
    try:
        await dp.start_polling(bot)
    except Exception as e:
        logger.error(f"Error starting bot: {e}")
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())