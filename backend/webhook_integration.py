import asyncio
import json
import hmac
import hashlib
from typing import Dict, Any, Optional
from aiohttp import web, ClientSession
import logging
from supabase_integration import supabase_client

logger = logging.getLogger(__name__)

class WebhookHandler:
    """Handle webhooks from payment providers"""
    
    def __init__(self):
        self.payment_providers = {
            'stripe': self.handle_stripe_webhook,
            'yookassa': self.handle_yookassa_webhook,
            'qiwi': self.handle_qiwi_webhook,
            'tinkoff': self.handle_tinkoff_webhook
        }
    
    async def handle_webhook(self, request: web.Request) -> web.Response:
        """Main webhook handler"""
        try:
            provider = request.match_info.get('provider', '').lower()
            
            if provider not in self.payment_providers:
                return web.json_response({'error': 'Unknown provider'}, status=400)
            
            # Get request body and headers
            body = await request.read()
            headers = dict(request.headers)
            
            # Verify webhook signature
            if not await self.verify_signature(provider, body, headers):
                logger.warning(f"Invalid signature for {provider} webhook")
                return web.json_response({'error': 'Invalid signature'}, status=401)
            
            # Parse JSON payload
            try:
                payload = json.loads(body.decode('utf-8'))
            except json.JSONDecodeError:
                return web.json_response({'error': 'Invalid JSON'}, status=400)
            
            # Handle webhook by provider
            result = await self.payment_providers[provider](payload, headers)
            
            if result.get('success'):
                return web.json_response({'status': 'ok'})
            else:
                return web.json_response({'error': result.get('error', 'Processing failed')}, status=400)
                
        except Exception as e:
            logger.error(f"Webhook processing error: {e}")
            return web.json_response({'error': 'Internal server error'}, status=500)
    
    async def verify_signature(self, provider: str, body: bytes, headers: Dict[str, str]) -> bool:
        """Verify webhook signature based on provider"""
        try:
            if provider == 'stripe':
                return await self.verify_stripe_signature(body, headers)
            elif provider == 'yookassa':
                return await self.verify_yookassa_signature(body, headers)
            elif provider == 'qiwi':
                return await self.verify_qiwi_signature(body, headers)
            elif provider == 'tinkoff':
                return await self.verify_tinkoff_signature(body, headers)
            return False
        except Exception as e:
            logger.error(f"Signature verification error for {provider}: {e}")
            return False
    
    async def verify_stripe_signature(self, body: bytes, headers: Dict[str, str]) -> bool:
        """Verify Stripe webhook signature"""
        signature = headers.get('stripe-signature', '')
        webhook_secret = 'whsec_your_stripe_webhook_secret'  # From environment
        
        try:
            # Parse signature
            sig_elements = {}
            for element in signature.split(','):
                key, value = element.split('=', 1)
                sig_elements[key] = value
            
            timestamp = sig_elements.get('t')
            signature_v1 = sig_elements.get('v1')
            
            if not timestamp or not signature_v1:
                return False
            
            # Create expected signature
            payload = f"{timestamp}.{body.decode('utf-8')}"
            expected_sig = hmac.new(
                webhook_secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature_v1, expected_sig)
            
        except Exception:
            return False
    
    async def verify_yookassa_signature(self, body: bytes, headers: Dict[str, str]) -> bool:
        """Verify YooKassa webhook signature"""
        # YooKassa uses HTTP Basic Auth or IP whitelist
        # Implement based on your YooKassa configuration
        return True  # Placeholder
    
    async def verify_qiwi_signature(self, body: bytes, headers: Dict[str, str]) -> bool:
        """Verify QIWI webhook signature"""
        signature = headers.get('x-api-signature-sha256', '')
        webhook_key = 'your_qiwi_webhook_key'  # From environment
        
        try:
            expected_sig = hmac.new(
                webhook_key.encode('utf-8'),
                body,
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_sig)
        except Exception:
            return False
    
    async def verify_tinkoff_signature(self, body: bytes, headers: Dict[str, str]) -> bool:
        """Verify Tinkoff webhook signature"""
        # Implement Tinkoff signature verification
        return True  # Placeholder
    
    async def handle_stripe_webhook(self, payload: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
        """Handle Stripe webhook events"""
        try:
            event_type = payload.get('type')
            data = payload.get('data', {}).get('object', {})
            
            if event_type == 'payment_intent.succeeded':
                return await self.process_successful_payment('stripe', data)
            elif event_type == 'payment_intent.payment_failed':
                return await self.process_failed_payment('stripe', data)
            
            return {'success': True, 'message': f'Event {event_type} processed'}
            
        except Exception as e:
            logger.error(f"Stripe webhook error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def handle_yookassa_webhook(self, payload: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
        """Handle YooKassa webhook events"""
        try:
            event = payload.get('event')
            payment = payload.get('object', {})
            
            if event == 'payment.succeeded':
                return await self.process_successful_payment('yookassa', payment)
            elif event == 'payment.canceled':
                return await self.process_failed_payment('yookassa', payment)
            
            return {'success': True, 'message': f'Event {event} processed'}
            
        except Exception as e:
            logger.error(f"YooKassa webhook error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def handle_qiwi_webhook(self, payload: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
        """Handle QIWI webhook events"""
        try:
            payment = payload.get('payment', {})
            status = payment.get('status', {}).get('value')
            
            if status == 'SUCCESS':
                return await self.process_successful_payment('qiwi', payment)
            elif status in ['DECLINED', 'REJECTED']:
                return await self.process_failed_payment('qiwi', payment)
            
            return {'success': True, 'message': f'Status {status} processed'}
            
        except Exception as e:
            logger.error(f"QIWI webhook error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def handle_tinkoff_webhook(self, payload: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
        """Handle Tinkoff webhook events"""
        try:
            status = payload.get('Status')
            
            if status == 'CONFIRMED':
                return await self.process_successful_payment('tinkoff', payload)
            elif status in ['REJECTED', 'CANCELED']:
                return await self.process_failed_payment('tinkoff', payload)
            
            return {'success': True, 'message': f'Status {status} processed'}
            
        except Exception as e:
            logger.error(f"Tinkoff webhook error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def process_successful_payment(self, provider: str, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process successful payment"""
        try:
            # Extract payment information based on provider
            payment_info = self.extract_payment_info(provider, payment_data)
            
            if not payment_info:
                return {'success': False, 'error': 'Could not extract payment info'}
            
            # Find corresponding payment in database
            payment_record = await self.find_payment_record(payment_info)
            
            if not payment_record:
                # Create new payment record for external payments
                payment_record = await supabase_client.create_payment(
                    telegram_id=payment_info.get('telegram_id', 0),
                    amount=payment_info['amount'],
                    payment_method=provider
                )
            
            # Verify and grant access
            result = await supabase_client.verify_payment(payment_record['id'], verified=True)
            
            # Send notification to user
            await self.notify_user_payment_success(payment_info, result)
            
            # Log successful processing
            await supabase_client.log_user_action(
                telegram_id=payment_info.get('telegram_id', 0),
                action='webhook_payment_processed',
                details={
                    'provider': provider,
                    'payment_id': payment_record['id'],
                    'amount': payment_info['amount']
                }
            )
            
            return {'success': True, 'payment_id': payment_record['id']}
            
        except Exception as e:
            logger.error(f"Payment processing error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def process_failed_payment(self, provider: str, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process failed payment"""
        try:
            payment_info = self.extract_payment_info(provider, payment_data)
            
            if payment_info:
                # Update payment status if exists
                payment_record = await self.find_payment_record(payment_info)
                if payment_record:
                    await supabase_client.update_payment_status(payment_record['id'], 'rejected')
                
                # Notify user about failure
                await self.notify_user_payment_failure(payment_info)
            
            return {'success': True, 'message': 'Failed payment processed'}
            
        except Exception as e:
            logger.error(f"Failed payment processing error: {e}")
            return {'success': False, 'error': str(e)}
    
    def extract_payment_info(self, provider: str, payment_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract standardized payment info from provider-specific data"""
        try:
            if provider == 'stripe':
                return {
                    'external_id': payment_data.get('id'),
                    'amount': payment_data.get('amount', 0) / 100,  # Stripe uses cents
                    'currency': payment_data.get('currency', 'rub').upper(),
                    'telegram_id': self.extract_telegram_id_from_metadata(payment_data.get('metadata', {}))
                }
            elif provider == 'yookassa':
                return {
                    'external_id': payment_data.get('id'),
                    'amount': float(payment_data.get('amount', {}).get('value', 0)),
                    'currency': payment_data.get('amount', {}).get('currency', 'RUB'),
                    'telegram_id': self.extract_telegram_id_from_metadata(payment_data.get('metadata', {}))
                }
            elif provider == 'qiwi':
                return {
                    'external_id': payment_data.get('paymentId'),
                    'amount': float(payment_data.get('amount', {}).get('value', 0)),
                    'currency': payment_data.get('amount', {}).get('currency', 'RUB'),
                    'telegram_id': self.extract_telegram_id_from_comment(payment_data.get('comment', ''))
                }
            elif provider == 'tinkoff':
                return {
                    'external_id': payment_data.get('PaymentId'),
                    'amount': float(payment_data.get('Amount', 0)) / 100,  # Tinkoff uses kopecks
                    'currency': 'RUB',
                    'telegram_id': self.extract_telegram_id_from_description(payment_data.get('Description', ''))
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting payment info for {provider}: {e}")
            return None
    
    def extract_telegram_id_from_metadata(self, metadata: Dict[str, Any]) -> Optional[int]:
        """Extract Telegram ID from payment metadata"""
        try:
            telegram_id = metadata.get('telegram_id') or metadata.get('user_id')
            return int(telegram_id) if telegram_id else None
        except (ValueError, TypeError):
            return None
    
    def extract_telegram_id_from_comment(self, comment: str) -> Optional[int]:
        """Extract Telegram ID from payment comment"""
        try:
            # Look for patterns like "TG:123456789" or "User:123456789"
            import re
            match = re.search(r'(?:TG|User):(\d+)', comment)
            return int(match.group(1)) if match else None
        except (ValueError, AttributeError):
            return None
    
    def extract_telegram_id_from_description(self, description: str) -> Optional[int]:
        """Extract Telegram ID from payment description"""
        return self.extract_telegram_id_from_comment(description)
    
    async def find_payment_record(self, payment_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find existing payment record in database"""
        try:
            # Try to find by external ID first
            if payment_info.get('external_id'):
                payments = await supabase_client.get_payments_by_external_id(payment_info['external_id'])
                if payments:
                    return payments[0]
            
            # Try to find by telegram_id and amount
            if payment_info.get('telegram_id'):
                payments = await supabase_client.get_user_payments(payment_info['telegram_id'])
                for payment in payments:
                    if (payment.get('amount') == payment_info['amount'] and 
                        payment.get('status') == 'pending'):
                        return payment
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding payment record: {e}")
            return None
    
    async def notify_user_payment_success(self, payment_info: Dict[str, Any], result: Dict[str, Any]):
        """Notify user about successful payment"""
        try:
            telegram_id = payment_info.get('telegram_id')
            if not telegram_id:
                return
            
            # Send notification via bot (implement bot notification method)
            message = (
                f"✅ Платеж подтвержден!\n\n"
                f"Сумма: {payment_info['amount']} {payment_info.get('currency', 'RUB')}\n"
                f"VIP доступ активирован!\n\n"
                f"Ссылка для входа: {result.get('access_link', 'Будет отправлена отдельно')}"
            )
            
            # Here you would send the message via your bot
            logger.info(f"Payment success notification for user {telegram_id}: {message}")
            
        except Exception as e:
            logger.error(f"Error sending success notification: {e}")
    
    async def notify_user_payment_failure(self, payment_info: Dict[str, Any]):
        """Notify user about failed payment"""
        try:
            telegram_id = payment_info.get('telegram_id')
            if not telegram_id:
                return
            
            message = (
                f"❌ Платеж не прошел\n\n"
                f"Сумма: {payment_info['amount']} {payment_info.get('currency', 'RUB')}\n"
                f"Обратитесь в поддержку для решения проблемы."
            )
            
            # Here you would send the message via your bot
            logger.info(f"Payment failure notification for user {telegram_id}: {message}")
            
        except Exception as e:
            logger.error(f"Error sending failure notification: {e}")


# Web application setup
async def create_webhook_app() -> web.Application:
    """Create webhook web application"""
    app = web.Application()
    handler = WebhookHandler()
    
    # Add webhook routes
    app.router.add_post('/webhook/{provider}', handler.handle_webhook)
    
    # Add health check
    async def health_check(request):
        return web.json_response({'status': 'ok', 'service': 'webhook_handler'})
    
    app.router.add_get('/health', health_check)
    
    return app


if __name__ == '__main__':
    # Run webhook server
    app = asyncio.run(create_webhook_app())
    web.run_app(app, host='0.0.0.0', port=8080)