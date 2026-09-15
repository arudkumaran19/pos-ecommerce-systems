from app.core.security import hash_password, verify_password, hash_token, generate_session_token

def test_argon2id_password_hashing():
    raw = "MySuperSecretP@ssword123"
    hashed = hash_password(raw)
    
    # Must use argon2id identifier
    assert "$argon2id$" in hashed
    
    # Verification must succeed for correct password
    assert verify_password(raw, hashed) is True
    
    # Verification must fail for wrong password
    assert verify_password("WrongPassword123", hashed) is False

def test_sha256_token_hashing():
    token = generate_session_token()
    hashed = hash_token(token)
    assert len(hashed) == 64
    # Deterministic
    assert hash_token(token) == hashed
