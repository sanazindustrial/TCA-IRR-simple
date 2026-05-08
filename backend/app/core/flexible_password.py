"""
Flexible Password Policy Configuration
Allows dynamic password rules that can be configured per-organization or globally
"""

from typing import Tuple, List, Dict, Any, Optional
from enum import Enum
from dataclasses import dataclass, field
import re
import logging

logger = logging.getLogger(__name__)


class PasswordStrength(str, Enum):
    """Password strength levels"""
    WEAK = "weak"           # Min 6 chars, no complexity
    MODERATE = "moderate"   # Min 8 chars, some complexity
    STRONG = "strong"       # Min 10 chars, full complexity
    ENTERPRISE = "enterprise"  # Min 12 chars, full complexity + history


@dataclass
class FlexiblePasswordPolicy:
    """
    Configurable password policy that can be adjusted per use case.
    
    Usage:
        # Default strong policy
        policy = FlexiblePasswordPolicy()
        
        # Relaxed policy for demos
        demo_policy = FlexiblePasswordPolicy.from_strength(PasswordStrength.MODERATE)
        
        # Custom policy
        custom = FlexiblePasswordPolicy(min_length=12, require_special=False)
    """
    
    # Length requirements
    min_length: int = 8
    max_length: int = 128
    
    # Complexity requirements
    require_uppercase: bool = True
    require_lowercase: bool = True
    require_digit: bool = True
    require_special: bool = True
    
    # Special characters allowed
    special_chars: str = "!@#$%^&*()_+-=[]{}|;':\",./<>?~`"
    
    # Additional security
    check_common_passwords: bool = True
    check_username_similarity: bool = True
    check_email_similarity: bool = True
    check_sequential_chars: bool = True  # Reject "abc", "123"
    check_repeated_chars: bool = True    # Reject "aaa", "111"
    max_repeated_chars: int = 3
    
    # Password history (0 = disabled)
    password_history_count: int = 0
    
    # Password expiry (0 = never)
    password_expiry_days: int = 0
    
    # Common passwords list (can be extended)
    common_passwords: set = field(default_factory=lambda: {
        "password", "123456", "12345678", "qwerty", "abc123",
        "password1", "password123", "admin", "letmein", "welcome",
        "monkey", "dragon", "master", "login", "passw0rd",
        "1234567890", "password!", "iloveyou", "princess", "admin123",
        "trustno1", "sunshine", "football", "baseball", "superman"
    })
    
    @classmethod
    def from_strength(cls, strength: PasswordStrength) -> "FlexiblePasswordPolicy":
        """Create policy from predefined strength level"""
        configs = {
            PasswordStrength.WEAK: {
                "min_length": 6,
                "require_uppercase": False,
                "require_lowercase": True,
                "require_digit": False,
                "require_special": False,
                "check_common_passwords": True,
                "check_sequential_chars": False,
                "check_repeated_chars": False
            },
            PasswordStrength.MODERATE: {
                "min_length": 8,
                "require_uppercase": True,
                "require_lowercase": True,
                "require_digit": True,
                "require_special": False,
                "check_sequential_chars": False
            },
            PasswordStrength.STRONG: {
                "min_length": 10,
                "require_uppercase": True,
                "require_lowercase": True,
                "require_digit": True,
                "require_special": True
            },
            PasswordStrength.ENTERPRISE: {
                "min_length": 12,
                "require_uppercase": True,
                "require_lowercase": True,
                "require_digit": True,
                "require_special": True,
                "password_history_count": 5,
                "password_expiry_days": 90
            }
        }
        return cls(**configs.get(strength, {}))
    
    @classmethod
    def from_dict(cls, config: Dict[str, Any]) -> "FlexiblePasswordPolicy":
        """Create policy from dictionary (e.g., from database or config file)"""
        return cls(**{k: v for k, v in config.items() if k in cls.__dataclass_fields__})
    
    def to_dict(self) -> Dict[str, Any]:
        """Export policy as dictionary for storage"""
        return {
            "min_length": self.min_length,
            "max_length": self.max_length,
            "require_uppercase": self.require_uppercase,
            "require_lowercase": self.require_lowercase,
            "require_digit": self.require_digit,
            "require_special": self.require_special,
            "special_chars": self.special_chars,
            "check_common_passwords": self.check_common_passwords,
            "password_history_count": self.password_history_count,
            "password_expiry_days": self.password_expiry_days
        }
    
    def validate(
        self, 
        password: str, 
        username: str = None, 
        email: str = None,
        password_history: List[str] = None
    ) -> Tuple[bool, List[str], Dict[str, Any]]:
        """
        Validate password against policy
        
        Returns:
            Tuple of (is_valid, error_messages, metadata)
            Metadata includes password strength score and suggestions
        """
        errors = []
        suggestions = []
        strength_score = 0
        
        # Length validation
        if len(password) < self.min_length:
            errors.append(f"Password must be at least {self.min_length} characters")
        else:
            strength_score += 20
            
        if len(password) > self.max_length:
            errors.append(f"Password must not exceed {self.max_length} characters")
        
        # Bonus for longer passwords
        if len(password) >= 12:
            strength_score += 10
        if len(password) >= 16:
            strength_score += 10
        
        # Complexity checks
        has_upper = bool(re.search(r'[A-Z]', password))
        has_lower = bool(re.search(r'[a-z]', password))
        has_digit = bool(re.search(r'\d', password))
        has_special = any(c in self.special_chars for c in password)
        
        if self.require_uppercase and not has_upper:
            errors.append("Password must contain at least one uppercase letter")
        elif has_upper:
            strength_score += 15
            
        if self.require_lowercase and not has_lower:
            errors.append("Password must contain at least one lowercase letter")
        elif has_lower:
            strength_score += 15
            
        if self.require_digit and not has_digit:
            errors.append("Password must contain at least one digit")
        elif has_digit:
            strength_score += 15
            
        if self.require_special and not has_special:
            errors.append(f"Password must contain at least one special character")
            suggestions.append(f"Add one of these: {self.special_chars[:10]}...")
        elif has_special:
            strength_score += 25
        
        # Sequential characters check
        if self.check_sequential_chars:
            sequential_patterns = [
                "abc", "bcd", "cde", "def", "efg", "fgh", "ghi", "hij",
                "ijk", "jkl", "klm", "lmn", "mno", "nop", "opq", "pqr",
                "qrs", "rst", "stu", "tuv", "uvw", "vwx", "wxy", "xyz",
                "012", "123", "234", "345", "456", "567", "678", "789",
                "qwe", "wer", "ert", "rty", "tyu", "yui", "uio", "iop",
                "asd", "sdf", "dfg", "fgh", "ghj", "hjk", "jkl",
                "zxc", "xcv", "cvb", "vbn", "bnm"
            ]
            password_lower = password.lower()
            for pattern in sequential_patterns:
                if pattern in password_lower or pattern[::-1] in password_lower:
                    errors.append("Password contains sequential characters")
                    strength_score -= 10
                    break
        
        # Repeated characters check
        if self.check_repeated_chars:
            for i in range(len(password) - self.max_repeated_chars + 1):
                if len(set(password[i:i + self.max_repeated_chars])) == 1:
                    errors.append(f"Password cannot have {self.max_repeated_chars}+ repeated characters")
                    strength_score -= 10
                    break
        
        # Common password check
        if self.check_common_passwords:
            if password.lower() in self.common_passwords:
                errors.append("Password is too common. Please choose a stronger password")
                strength_score = min(strength_score, 10)
        
        # Username similarity
        if self.check_username_similarity and username:
            if len(username) >= 3 and username.lower() in password.lower():
                errors.append("Password cannot contain your username")
                strength_score -= 20
        
        # Email similarity
        if self.check_email_similarity and email:
            email_local = email.split('@')[0].lower()
            if len(email_local) >= 3 and email_local in password.lower():
                errors.append("Password cannot contain your email address")
                strength_score -= 15
        
        # Password history check
        if self.password_history_count > 0 and password_history:
            # Note: In production, compare hashed passwords
            if password in password_history[:self.password_history_count]:
                errors.append(f"Cannot reuse your last {self.password_history_count} passwords")
        
        # Calculate final strength
        strength_score = max(0, min(100, strength_score))
        
        if strength_score >= 80:
            strength_label = "Strong"
        elif strength_score >= 60:
            strength_label = "Good"
        elif strength_score >= 40:
            strength_label = "Moderate"
        else:
            strength_label = "Weak"
        
        # Add suggestions for improvement
        if not has_upper:
            suggestions.append("Add uppercase letters for extra security")
        if not has_special:
            suggestions.append("Add special characters for extra security")
        if len(password) < 12:
            suggestions.append("Longer passwords are more secure")
        
        metadata = {
            "strength_score": strength_score,
            "strength_label": strength_label,
            "suggestions": suggestions,
            "meets_requirements": len(errors) == 0
        }
        
        return len(errors) == 0, errors, metadata
    
    def get_requirements_text(self) -> List[str]:
        """Get human-readable password requirements"""
        requirements = [f"At least {self.min_length} characters"]
        
        if self.require_uppercase:
            requirements.append("At least one uppercase letter (A-Z)")
        if self.require_lowercase:
            requirements.append("At least one lowercase letter (a-z)")
        if self.require_digit:
            requirements.append("At least one number (0-9)")
        if self.require_special:
            requirements.append(f"At least one special character ({self.special_chars[:10]}...)")
        if self.check_common_passwords:
            requirements.append("Cannot be a commonly used password")
            
        return requirements


# Predefined policies for different use cases
DEFAULT_POLICY = FlexiblePasswordPolicy()
DEMO_POLICY = FlexiblePasswordPolicy.from_strength(PasswordStrength.WEAK)
ENTERPRISE_POLICY = FlexiblePasswordPolicy.from_strength(PasswordStrength.ENTERPRISE)


# Current active policy (can be changed at runtime)
_active_policy: FlexiblePasswordPolicy = DEFAULT_POLICY


def get_password_policy() -> FlexiblePasswordPolicy:
    """Get the current active password policy"""
    return _active_policy


def set_password_policy(policy: FlexiblePasswordPolicy):
    """Set the active password policy"""
    global _active_policy
    _active_policy = policy
    logger.info(f"Password policy updated: min_length={policy.min_length}")


def validate_password(
    password: str, 
    username: str = None, 
    email: str = None
) -> Tuple[bool, List[str], Dict[str, Any]]:
    """Validate password using the active policy"""
    return _active_policy.validate(password, username, email)
