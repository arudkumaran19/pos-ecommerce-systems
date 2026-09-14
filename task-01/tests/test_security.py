import pytest
from fastapi import HTTPException

from app.core.security import (
    MIN_PASSWORD_LENGTH,
    generate_session_token,
    get_cookie_security_options,
    hash_password,
    hash_session_token,
    InMemoryRateLimiter,
    validate_password_strength,
    verify_password,
)


def test_password_hashing_and_verification():
    raw_pwd = "SuperSecurePassword123!"
    hashed = hash_password(raw_pwd)

    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False
    assert verify_password("", hashed) is False


def test_password_strength_validation():
    # Passwords >= 12 chars succeed
    validate_password_strength("ValidLengthPassword123!")

    # Passwords < 12 chars raise 400
    with pytest.raises(HTTPException) as exc_info:
        validate_password_strength("Short1!")
    assert exc_info.value.status_code == 400
    assert f"at least {MIN_PASSWORD_LENGTH} characters" in exc_info.value.detail


def test_session_token_entropy_and_hashing():
    token1 = generate_session_token()
    token2 = generate_session_token()

    assert token1 != token2
    assert len(token1) == 64  # 32 bytes hex-encoded = 64 characters

    hash1 = hash_session_token(token1)
    hash2 = hash_session_token(token2)

    assert len(hash1) == 64
    assert hash1 != token1
    assert hash1 != hash2
    # Deterministic hashing
    assert hash1 == hash_session_token(token1)


def test_cookie_security_options_dev():
    options = get_cookie_security_options()
    assert options["httponly"] is True
    assert options["samesite"] == "lax"
    assert options["path"] == "/"
    assert options["secure"] is False  # In development


def test_rate_limiter_blocks_after_threshold():
    limiter = InMemoryRateLimiter(max_attempts=3, window_seconds=10)
    key = "test_ip_127.0.0.1"

    limiter.check(key)
    limiter.record_failure(key)
    limiter.record_failure(key)
    # 2 failures recorded - still under limit of 3
    limiter.check(key)

    limiter.record_failure(key)
    # 3 failures recorded - check should raise 429
    with pytest.raises(HTTPException) as exc_info:
        limiter.check(key)
    assert exc_info.value.status_code == 429
    assert "Too many failed login attempts" in exc_info.value.detail

    # Reset allows access again
    limiter.reset(key)
    limiter.check(key)
