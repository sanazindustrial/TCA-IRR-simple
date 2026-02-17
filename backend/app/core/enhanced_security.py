"""
Enhanced Security Features
- Account Lockout
- Token Blacklisting
- Password Policy Enforcement
- Session Management
- Failed Login Tracking
"""

import logging
import hashlib
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Set, Tuple
from collections import defaultdict
import re
import asyncpg

logger = logging.getLogger(__name__)


class PasswordPolicy:
    """Password policy enforcement"""
    
    MIN_LENGTH = 8
    MAX_LENGTH = 128
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGIT = True
    REQUIRE_SPECIAL = True
    SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
    
    # Common passwords to reject
    COMMON_PASSWORDS = {
        "password", "123456", "12345678", "qwerty", "abc123",
        "password1", "password123", "admin", "letmein", "welcome",
        "monkey", "dragon", "master", "login", "passw0rd"
    }
    
    @classmethod
    def validate(cls, password: str, username: str = None, email: str = None) -> Tuple[bool, list]:
        """
        Validate password against policy
        
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        # Length check
        if len(password) < cls.MIN_LENGTH:
            errors.append(f"Password must be at least {cls.MIN_LENGTH} characters")
        if len(password) > cls.MAX_LENGTH:
            errors.append(f"Password must not exceed {cls.MAX_LENGTH} characters")
        
        # Complexity checks
        if cls.REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        if cls.REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        if cls.REQUIRE_DIGIT and not re.search(r'\d', password):
            errors.append("Password must contain at least one digit")
        
        if cls.REQUIRE_SPECIAL and not any(c in cls.SPECIAL_CHARS for c in password):
            errors.append(f"Password must contain at least one special character ({cls.SPECIAL_CHARS})")
        
        # Common password check
        if password.lower() in cls.COMMON_PASSWORDS:
            errors.append("Password is too common. Please choose a stronger password")
        
        # Username/email similarity check
        if username and username.lower() in password.lower():
            errors.append("Password cannot contain your username")
        
        if email:
            email_local = email.split('@')[0].lower()
            if len(email_local) > 3 and email_local in password.lower():
                errors.append("Password cannot contain your email address")
        
        return len(errors) == 0, errors


class AccountLockout:
    """
    Account lockout after failed login attempts.
    Uses in-memory storage for development, should use Redis in production.
    """
    
    MAX_FAILED_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 15
    RESET_COUNT_AFTER_MINUTES = 30
    
    def __init__(self):
        # Format: {username: {"attempts": int, "first_attempt": datetime, "locked_until": datetime}}
        self._failed_attempts: Dict[str, Dict] = {}
        self._lock = asyncio.Lock()
    
    async def record_failed_attempt(self, username: str, ip_address: str = None) -> Tuple[bool, int]:
        """
        Record a failed login attempt
        
        Returns:
            Tuple of (is_locked, remaining_attempts)
        """
        async with self._lock:
            now = datetime.utcnow()
            
            if username not in self._failed_attempts:
                self._failed_attempts[username] = {
                    "attempts": 0,
                    "first_attempt": now,
                    "locked_until": None,
                    "ip_addresses": set()
                }
            
            user_data = self._failed_attempts[username]
            
            # Check if we should reset the counter
            if user_data["first_attempt"]:
                time_since_first = (now - user_data["first_attempt"]).total_seconds() / 60
                if time_since_first > self.RESET_COUNT_AFTER_MINUTES:
                    user_data["attempts"] = 0
                    user_data["first_attempt"] = now
                    user_data["ip_addresses"] = set()
            
            # Increment attempt count
            user_data["attempts"] += 1
            if ip_address:
                user_data["ip_addresses"].add(ip_address)
            
            remaining = self.MAX_FAILED_ATTEMPTS - user_data["attempts"]
            
            # Check if we should lock the account
            if user_data["attempts"] >= self.MAX_FAILED_ATTEMPTS:
                user_data["locked_until"] = now + timedelta(minutes=self.LOCKOUT_DURATION_MINUTES)
                logger.warning(
                    f"Account locked for user '{username}' after {user_data['attempts']} failed attempts. "
                    f"IPs: {user_data['ip_addresses']}"
                )
                return True, 0
            
            return False, max(0, remaining)
    
    async def is_locked(self, username: str) -> Tuple[bool, Optional[int]]:
        """
        Check if account is locked
        
        Returns:
            Tuple of (is_locked, minutes_remaining)
        """
        async with self._lock:
            if username not in self._failed_attempts:
                return False, None
            
            user_data = self._failed_attempts[username]
            locked_until = user_data.get("locked_until")
            
            if locked_until is None:
                return False, None
            
            now = datetime.utcnow()
            if now >= locked_until:
                # Lockout expired, clear the data
                self._failed_attempts.pop(username, None)
                return False, None
            
            remaining_seconds = (locked_until - now).total_seconds()
            remaining_minutes = int(remaining_seconds / 60) + 1
            
            return True, remaining_minutes
    
    async def clear_failed_attempts(self, username: str):
        """Clear failed attempts after successful login"""
        async with self._lock:
            self._failed_attempts.pop(username, None)
    
    async def unlock_account(self, username: str):
        """Manually unlock an account (admin action)"""
        await self.clear_failed_attempts(username)
        logger.info(f"Account unlocked for user '{username}'")


class TokenBlacklist:
    """
    Token blacklist for logout and revocation.
    Uses in-memory storage for development, should use Redis in production.
    """
    
    def __init__(self):
        self._blacklisted_tokens: Set[str] = set()
        self._token_timestamps: Dict[str, datetime] = {}
        self._lock = asyncio.Lock()
        # Clean old tokens periodically
        self._cleanup_interval_seconds = 3600  # 1 hour
    
    def _hash_token(self, token: str) -> str:
        """Hash token for storage (don't store raw tokens)"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    async def blacklist_token(self, token: str, expires_at: datetime = None):
        """Add token to blacklist"""
        async with self._lock:
            token_hash = self._hash_token(token)
            self._blacklisted_tokens.add(token_hash)
            self._token_timestamps[token_hash] = expires_at or (datetime.utcnow() + timedelta(days=1))
    
    async def is_blacklisted(self, token: str) -> bool:
        """Check if token is blacklisted"""
        async with self._lock:
            token_hash = self._hash_token(token)
            return token_hash in self._blacklisted_tokens
    
    async def cleanup_expired(self):
        """Remove expired tokens from blacklist"""
        async with self._lock:
            now = datetime.utcnow()
            expired = [
                token_hash for token_hash, expires_at in self._token_timestamps.items()
                if expires_at and now >= expires_at
            ]
            for token_hash in expired:
                self._blacklisted_tokens.discard(token_hash)
                self._token_timestamps.pop(token_hash, None)
            
            if expired:
                logger.info(f"Cleaned up {len(expired)} expired blacklisted tokens")


class SessionManager:
    """
    Manages user sessions for concurrent login limiting.
    Uses in-memory storage for development, should use Redis in production.
    """
    
    MAX_SESSIONS_PER_USER = 3
    SESSION_TIMEOUT_MINUTES = 30
    
    def __init__(self):
        # Format: {user_id: [{session_id, created_at, last_activity, ip_address, user_agent}]}
        self._sessions: Dict[int, list] = defaultdict(list)
        self._lock = asyncio.Lock()
    
    async def create_session(
        self,
        user_id: int,
        session_id: str,
        ip_address: str = None,
        user_agent: str = None
    ) -> bool:
        """
        Create a new session for user
        
        Returns:
            True if session created, False if limit exceeded
        """
        async with self._lock:
            # Clean expired sessions first
            await self._cleanup_user_sessions(user_id)
            
            user_sessions = self._sessions[user_id]
            
            # Check session limit
            if len(user_sessions) >= self.MAX_SESSIONS_PER_USER:
                # Remove oldest session
                user_sessions.sort(key=lambda s: s["last_activity"])
                removed = user_sessions.pop(0)
                logger.info(f"Removed oldest session for user {user_id} due to session limit")
            
            # Add new session
            user_sessions.append({
                "session_id": session_id,
                "created_at": datetime.utcnow(),
                "last_activity": datetime.utcnow(),
                "ip_address": ip_address,
                "user_agent": user_agent
            })
            
            return True
    
    async def validate_session(self, user_id: int, session_id: str) -> bool:
        """Check if session is valid and update last activity"""
        async with self._lock:
            user_sessions = self._sessions.get(user_id, [])
            
            for session in user_sessions:
                if session["session_id"] == session_id:
                    # Check timeout
                    timeout = timedelta(minutes=self.SESSION_TIMEOUT_MINUTES)
                    if datetime.utcnow() - session["last_activity"] > timeout:
                        user_sessions.remove(session)
                        return False
                    
                    # Update last activity
                    session["last_activity"] = datetime.utcnow()
                    return True
            
            return False
    
    async def end_session(self, user_id: int, session_id: str):
        """End a specific session"""
        async with self._lock:
            user_sessions = self._sessions.get(user_id, [])
            self._sessions[user_id] = [
                s for s in user_sessions if s["session_id"] != session_id
            ]
    
    async def end_all_sessions(self, user_id: int):
        """End all sessions for a user"""
        async with self._lock:
            self._sessions.pop(user_id, None)
    
    async def get_user_sessions(self, user_id: int) -> list:
        """Get all active sessions for a user"""
        async with self._lock:
            await self._cleanup_user_sessions(user_id)
            return list(self._sessions.get(user_id, []))
    
    async def _cleanup_user_sessions(self, user_id: int):
        """Remove expired sessions for a user"""
        timeout = timedelta(minutes=self.SESSION_TIMEOUT_MINUTES)
        now = datetime.utcnow()
        
        user_sessions = self._sessions.get(user_id, [])
        self._sessions[user_id] = [
            s for s in user_sessions 
            if now - s["last_activity"] <= timeout
        ]


# Singleton instances
account_lockout = AccountLockout()
token_blacklist = TokenBlacklist()
session_manager = SessionManager()
