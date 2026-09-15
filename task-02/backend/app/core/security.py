import hashlib
import secrets
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHash

# OWASP-recommended Argon2id configuration
_hasher = PasswordHasher(
    time_cost=3,        # 3 iterations
    memory_cost=65536,  # 64 MiB
    parallelism=4,      # 4 threads
    hash_len=32,
    salt_len=16
)

def hash_password(password: str) -> str:
    """Hash password using Argon2id."""
    return _hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2id hash."""
    try:
        return _hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHash):
        return False

def generate_session_token() -> str:
    """Generate 256-bit cryptographically secure session token."""
    return secrets.token_urlsafe(32)

def hash_token(token: str) -> str:
    """Hash an opaque token using SHA-256 for safe database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def generate_csrf_token() -> str:
    """Generate cryptographically secure CSRF token."""
    return secrets.token_urlsafe(32)

def compute_payload_hash(payload_str: str) -> str:
    """Compute SHA-256 hash of a serialized payload for idempotency verification."""
    return hashlib.sha256(payload_str.encode("utf-8")).hexdigest()
