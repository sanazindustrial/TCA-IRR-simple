"""
API Key Manager
Secure management, encryption, and rotation of API keys for external data sources
"""

import os
import logging
import json
import base64
import hashlib
import secrets
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)


class KeyStatus(str, Enum):
    """API key status"""
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    PENDING = "pending"
    ROTATION_PENDING = "rotation_pending"


@dataclass
class APIKeyMetadata:
    """Metadata for an API key"""
    source_id: str
    key_name: str
    status: KeyStatus
    created_at: datetime
    expires_at: Optional[datetime] = None
    last_used: Optional[datetime] = None
    last_rotated: Optional[datetime] = None
    rotation_interval_days: int = 90
    use_count: int = 0
    masked_key: str = ""  # Last 4 chars visible
    notes: str = ""
    
    def to_dict(self) -> Dict:
        return {
            "source_id": self.source_id,
            "key_name": self.key_name,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "last_used": self.last_used.isoformat() if self.last_used else None,
            "last_rotated": self.last_rotated.isoformat() if self.last_rotated else None,
            "rotation_interval_days": self.rotation_interval_days,
            "use_count": self.use_count,
            "masked_key": self.masked_key,
            "notes": self.notes
        }


class APIKeyManager:
    """
    Secure API key management with encryption, rotation, and audit logging.
    
    Features:
    - AES-256 encryption for stored keys
    - Key rotation tracking
    - Expiration monitoring
    - Audit logging
    - Environment variable support
    """
    
    def __init__(
        self,
        encryption_key: Optional[str] = None,
        storage_path: Optional[str] = None
    ):
        """
        Initialize the key manager.
        
        Args:
            encryption_key: Base64-encoded encryption key or None to generate
            storage_path: Path to store encrypted keys (optional, for persistence)
        """
        self._encryption_key = self._setup_encryption(encryption_key)
        self._fernet = Fernet(self._encryption_key)
        self._storage_path = Path(storage_path) if storage_path else None
        
        self._keys: Dict[str, bytes] = {}  # source_id -> encrypted key
        self._metadata: Dict[str, APIKeyMetadata] = {}
        self._audit_log: List[Dict] = []
        
        # Load from storage if available
        if self._storage_path and self._storage_path.exists():
            self._load_from_storage()
    
    def _setup_encryption(self, encryption_key: Optional[str]) -> bytes:
        """Setup or generate encryption key"""
        if encryption_key:
            # Use provided key
            return base64.urlsafe_b64decode(encryption_key)
        
        # Try to get from environment
        env_key = os.environ.get("TCA_KEY_ENCRYPTION_KEY")
        if env_key:
            return base64.urlsafe_b64decode(env_key)
        
        # Generate new key (in production, this should be stored securely)
        return Fernet.generate_key()
    
    def _mask_key(self, key: str) -> str:
        """Mask API key showing only last 4 characters"""
        if len(key) <= 4:
            return "*" * len(key)
        return "*" * (len(key) - 4) + key[-4:]
    
    def _audit(self, action: str, source_id: str, details: str = ""):
        """Log an audit event"""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": action,
            "source_id": source_id,
            "details": details
        }
        self._audit_log.append(event)
        logger.info(f"API Key Audit: {action} for {source_id}")
    
    def store_key(
        self,
        source_id: str,
        api_key: str,
        key_name: str = "default",
        expires_at: Optional[datetime] = None,
        rotation_interval_days: int = 90,
        notes: str = ""
    ) -> bool:
        """
        Store an API key securely.
        
        Args:
            source_id: External source identifier
            api_key: The API key to store
            key_name: Name/label for the key
            expires_at: Optional expiration date
            rotation_interval_days: Days between rotations
            notes: Additional notes
            
        Returns:
            True if stored successfully
        """
        try:
            # Encrypt the key
            encrypted = self._fernet.encrypt(api_key.encode())
            self._keys[source_id] = encrypted
            
            # Store metadata
            now = datetime.utcnow()
            self._metadata[source_id] = APIKeyMetadata(
                source_id=source_id,
                key_name=key_name,
                status=KeyStatus.ACTIVE,
                created_at=now,
                expires_at=expires_at,
                last_rotated=now,
                rotation_interval_days=rotation_interval_days,
                masked_key=self._mask_key(api_key),
                notes=notes
            )
            
            self._audit("key_stored", source_id, f"Key '{key_name}' stored")
            
            # Persist if storage path configured
            if self._storage_path:
                self._save_to_storage()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to store key for {source_id}: {e}")
            return False
    
    def get_key(self, source_id: str) -> Optional[str]:
        """
        Retrieve a decrypted API key.
        
        Args:
            source_id: External source identifier
            
        Returns:
            Decrypted API key or None
        """
        # First check environment variables
        env_var = f"TCA_{source_id.upper()}_API_KEY"
        env_key = os.environ.get(env_var)
        if env_key:
            # Update usage tracking
            if source_id in self._metadata:
                self._metadata[source_id].last_used = datetime.utcnow()
                self._metadata[source_id].use_count += 1
            return env_key
        
        # Check stored keys
        if source_id not in self._keys:
            return None
        
        try:
            # Check status
            metadata = self._metadata.get(source_id)
            if metadata:
                if metadata.status in [KeyStatus.EXPIRED, KeyStatus.REVOKED]:
                    logger.warning(f"Attempted to use {metadata.status.value} key for {source_id}")
                    return None
                
                # Check expiration
                if metadata.expires_at and datetime.utcnow() > metadata.expires_at:
                    metadata.status = KeyStatus.EXPIRED
                    self._audit("key_expired", source_id)
                    return None
                
                # Update usage
                metadata.last_used = datetime.utcnow()
                metadata.use_count += 1
            
            # Decrypt and return
            decrypted = self._fernet.decrypt(self._keys[source_id])
            return decrypted.decode()
            
        except Exception as e:
            logger.error(f"Failed to retrieve key for {source_id}: {e}")
            return None
    
    def rotate_key(self, source_id: str, new_key: str) -> bool:
        """
        Rotate an API key.
        
        Args:
            source_id: External source identifier
            new_key: New API key
            
        Returns:
            True if rotated successfully
        """
        if source_id not in self._metadata:
            logger.warning(f"Cannot rotate key for unknown source: {source_id}")
            return False
        
        try:
            old_metadata = self._metadata[source_id]
            
            # Encrypt new key
            encrypted = self._fernet.encrypt(new_key.encode())
            self._keys[source_id] = encrypted
            
            # Update metadata
            old_metadata.last_rotated = datetime.utcnow()
            old_metadata.masked_key = self._mask_key(new_key)
            old_metadata.status = KeyStatus.ACTIVE
            
            self._audit("key_rotated", source_id)
            
            if self._storage_path:
                self._save_to_storage()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to rotate key for {source_id}: {e}")
            return False
    
    def revoke_key(self, source_id: str) -> bool:
        """Revoke an API key"""
        if source_id in self._metadata:
            self._metadata[source_id].status = KeyStatus.REVOKED
            self._audit("key_revoked", source_id)
            return True
        return False
    
    def delete_key(self, source_id: str) -> bool:
        """Delete an API key completely"""
        if source_id in self._keys:
            del self._keys[source_id]
            if source_id in self._metadata:
                del self._metadata[source_id]
            self._audit("key_deleted", source_id)
            
            if self._storage_path:
                self._save_to_storage()
            return True
        return False
    
    def get_metadata(self, source_id: str) -> Optional[APIKeyMetadata]:
        """Get metadata for a key"""
        return self._metadata.get(source_id)
    
    def get_all_metadata(self) -> Dict[str, APIKeyMetadata]:
        """Get metadata for all keys"""
        return self._metadata.copy()
    
    def list_sources_with_keys(self) -> List[str]:
        """List all sources with stored keys"""
        return list(self._keys.keys())
    
    def check_rotation_needed(self) -> List[str]:
        """Get list of sources needing key rotation"""
        needs_rotation = []
        now = datetime.utcnow()
        
        for source_id, metadata in self._metadata.items():
            if metadata.status != KeyStatus.ACTIVE:
                continue
            
            if metadata.last_rotated:
                days_since_rotation = (now - metadata.last_rotated).days
                if days_since_rotation >= metadata.rotation_interval_days:
                    needs_rotation.append(source_id)
                    metadata.status = KeyStatus.ROTATION_PENDING
        
        return needs_rotation
    
    def check_expiring_keys(self, days_warning: int = 30) -> List[Dict]:
        """Get keys expiring within the warning period"""
        expiring = []
        now = datetime.utcnow()
        warning_date = now + timedelta(days=days_warning)
        
        for source_id, metadata in self._metadata.items():
            if metadata.expires_at and metadata.expires_at <= warning_date:
                days_remaining = (metadata.expires_at - now).days
                expiring.append({
                    "source_id": source_id,
                    "expires_at": metadata.expires_at.isoformat(),
                    "days_remaining": max(0, days_remaining),
                    "status": "expired" if days_remaining < 0 else "expiring"
                })
        
        return expiring
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get dashboard data for API key management"""
        total_keys = len(self._keys)
        active_keys = sum(1 for m in self._metadata.values() if m.status == KeyStatus.ACTIVE)
        expired_keys = sum(1 for m in self._metadata.values() if m.status == KeyStatus.EXPIRED)
        revoked_keys = sum(1 for m in self._metadata.values() if m.status == KeyStatus.REVOKED)
        
        needs_rotation = self.check_rotation_needed()
        expiring = self.check_expiring_keys()
        
        # Group by status
        keys_by_status = {
            "active": [],
            "expired": [],
            "revoked": [],
            "pending": [],
            "rotation_pending": []
        }
        
        for source_id, metadata in self._metadata.items():
            keys_by_status[metadata.status.value].append(metadata.to_dict())
        
        return {
            "summary": {
                "total_keys": total_keys,
                "active": active_keys,
                "expired": expired_keys,
                "revoked": revoked_keys,
                "needs_rotation": len(needs_rotation),
                "expiring_soon": len(expiring)
            },
            "keys_by_status": keys_by_status,
            "needs_rotation": needs_rotation,
            "expiring_keys": expiring,
            "recent_audit": self._audit_log[-20:],
            "last_updated": datetime.utcnow().isoformat()
        }
    
    def get_audit_log(self, limit: int = 100) -> List[Dict]:
        """Get audit log entries"""
        return self._audit_log[-limit:]
    
    def _save_to_storage(self):
        """Save encrypted keys to storage"""
        if not self._storage_path:
            return
        
        try:
            data = {
                "keys": {
                    source_id: base64.b64encode(encrypted).decode()
                    for source_id, encrypted in self._keys.items()
                },
                "metadata": {
                    source_id: metadata.to_dict()
                    for source_id, metadata in self._metadata.items()
                }
            }
            
            self._storage_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self._storage_path, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            logger.error(f"Failed to save keys to storage: {e}")
    
    def _load_from_storage(self):
        """Load encrypted keys from storage"""
        if not self._storage_path or not self._storage_path.exists():
            return
        
        try:
            with open(self._storage_path, 'r') as f:
                data = json.load(f)
            
            # Load encrypted keys
            for source_id, encoded in data.get("keys", {}).items():
                self._keys[source_id] = base64.b64decode(encoded)
            
            # Load metadata
            for source_id, meta_dict in data.get("metadata", {}).items():
                self._metadata[source_id] = APIKeyMetadata(
                    source_id=meta_dict["source_id"],
                    key_name=meta_dict["key_name"],
                    status=KeyStatus(meta_dict["status"]),
                    created_at=datetime.fromisoformat(meta_dict["created_at"]),
                    expires_at=datetime.fromisoformat(meta_dict["expires_at"]) if meta_dict.get("expires_at") else None,
                    last_used=datetime.fromisoformat(meta_dict["last_used"]) if meta_dict.get("last_used") else None,
                    last_rotated=datetime.fromisoformat(meta_dict["last_rotated"]) if meta_dict.get("last_rotated") else None,
                    rotation_interval_days=meta_dict.get("rotation_interval_days", 90),
                    use_count=meta_dict.get("use_count", 0),
                    masked_key=meta_dict.get("masked_key", ""),
                    notes=meta_dict.get("notes", "")
                )
                
            logger.info(f"Loaded {len(self._keys)} keys from storage")
            
        except Exception as e:
            logger.error(f"Failed to load keys from storage: {e}")
    
    def import_from_env(self, source_mappings: Dict[str, str]):
        """
        Import API keys from environment variables.
        
        Args:
            source_mappings: Dict of source_id -> env_var_name
        """
        imported = 0
        for source_id, env_var in source_mappings.items():
            key = os.environ.get(env_var)
            if key:
                self.store_key(
                    source_id=source_id,
                    api_key=key,
                    key_name=f"env:{env_var}",
                    notes=f"Imported from environment variable {env_var}"
                )
                imported += 1
        
        logger.info(f"Imported {imported} keys from environment")
        return imported


# Default environment variable mappings for common sources
DEFAULT_ENV_MAPPINGS = {
    "github": "GITHUB_TOKEN",
    "alpha_vantage": "ALPHA_VANTAGE_API_KEY",
    "fred": "FRED_API_KEY",
    "hugging_face": "HUGGING_FACE_API_KEY",
    "pubmed": "PUBMED_API_KEY",
    "crunchbase": "CRUNCHBASE_API_KEY",
    "similarweb": "SIMILARWEB_API_KEY",
    "reddit": "REDDIT_CLIENT_ID",
    "twitter": "TWITTER_BEARER_TOKEN",
    "news_api": "NEWS_API_KEY",
    "openai": "OPENAI_API_KEY"
}
