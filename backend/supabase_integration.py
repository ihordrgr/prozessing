import os
import asyncio
from typing import Optional, Dict, Any
import aiohttp
import json
from datetime import datetime, timedelta

class SupabaseClient:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL", "https://fiyquobbzkbyjjxfyyta.supabase.co")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.anon_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not self.service_key:
            raise ValueError("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
        
        self.headers = {
            "apikey": self.service_key or self.anon_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json"
        }
    
    async def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to Supabase API"""
        url = f"{self.url}/rest/v1/{endpoint}"
        
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=method,
                url=url,
                headers=self.headers,
                json=data
            ) as response:
                if response.status >= 400:
                    error_text = await response.text()
                    raise Exception(f"Supabase API error: {response.status} - {error_text}")
                
                return await response.json()
    
    async def _rpc(self, function_name: str, params: Dict[str, Any]) -> Any:
        """Call Supabase RPC function"""
        url = f"{self.url}/rest/v1/rpc/{function_name}"
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url=url,
                headers=self.headers,
                json=params
            ) as response:
                if response.status >= 400:
                    error_text = await response.text()
                    raise Exception(f"Supabase RPC error: {response.status} - {error_text}")
                
                return await response.json()
    
    async def get_user_profile(self, telegram_id: int) -> Optional[Dict[str, Any]]:
        """Get user profile by telegram ID"""
        try:
            result = await self._request(
                "GET", 
                f"profiles?telegram_id=eq.{telegram_id}&select=*"
            )
            return result[0] if result else None
        except Exception:
            return None
    
    async def create_or_update_profile(self, telegram_id: int, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update user profile"""
        profile_data = {
            "telegram_id": telegram_id,
            **user_data
        }
        
        # Try to update first, then insert if not exists
        try:
            result = await self._request(
                "POST",
                "profiles",
                profile_data
            )
            return result[0] if result else profile_data
        except Exception:
            # If insert fails, try update
            result = await self._request(
                "PATCH",
                f"profiles?telegram_id=eq.{telegram_id}",
                user_data
            )
            return result[0] if result else profile_data
    
    async def create_payment(self, telegram_id: int, amount: float = 500.0, payment_method: str = "manual") -> Dict[str, Any]:
        """Create payment record"""
        payment_data = {
            "telegram_id": telegram_id,
            "amount": amount,
            "currency": "RUB",
            "payment_method": payment_method,
            "status": "pending"
        }
        
        result = await self._request("POST", "payments", payment_data)
        return result[0] if result else payment_data
    
    async def update_payment_screenshot(self, payment_id: str, screenshot_url: str) -> Dict[str, Any]:
        """Update payment with screenshot URL"""
        update_data = {"screenshot_url": screenshot_url}
        
        result = await self._request(
            "PATCH",
            f"payments?id=eq.{payment_id}",
            update_data
        )
        return result[0] if result else {}
    
    async def verify_payment(self, payment_id: str, verified: bool = True) -> Dict[str, Any]:
        """Verify payment and grant access"""
        return await self._rpc("verify_payment_and_grant_access", {
            "payment_id": payment_id,
            "verified": verified
        })
    
    async def check_vip_access(self, telegram_id: int) -> Dict[str, Any]:
        """Check if user has VIP access"""
        return await self._rpc("check_vip_access", {
            "user_telegram_id": telegram_id
        })
    
    async def log_user_action(self, telegram_id: int, action: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
        """Log user action"""
        action_data = {
            "telegram_id": telegram_id,
            "action": action,
            "details": details or {}
        }
        
        result = await self._request("POST", "user_actions", action_data)
        return result[0] if result else action_data
    
    async def get_user_payments(self, telegram_id: int) -> list:
        """Get user payments"""
        result = await self._request(
            "GET",
            f"payments?telegram_id=eq.{telegram_id}&order=created_at.desc"
        )
        return result
    
    async def upload_file_to_storage(self, bucket: str, file_path: str, file_data: bytes) -> str:
        """Upload file to Supabase Storage"""
        url = f"{self.url}/storage/v1/object/{bucket}/{file_path}"
        
        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url=url,
                headers=headers,
                data=file_data
            ) as response:
                if response.status >= 400:
                    error_text = await response.text()
                    raise Exception(f"Storage upload error: {response.status} - {error_text}")
                
                # Return public URL
                return f"{self.url}/storage/v1/object/public/{bucket}/{file_path}"

# Global instance
supabase_client = SupabaseClient()