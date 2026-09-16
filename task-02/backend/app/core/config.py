from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/task02_ecommerce"
    
    # Security
    SESSION_SECRET: str = "task02-super-secret-random-key-with-high-entropy-64-chars-long-minimum-length"
    SESSION_COOKIE_NAME: str = "task02_session"
    SESSION_COOKIE_SECURE: bool = False
    SESSION_COOKIE_SAMESITE: str = "lax"
    SESSION_MAX_AGE_SECONDS: int = 604800  # 7 days
    
    # Commerce & Concurrency
    RESERVATION_TTL_SECONDS: int = 300  # 5 minutes default
    SWEEPER_INTERVAL_SECONDS: int = 15
    
    # Media Storage
    MEDIA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "media", "avatars")
    MAX_UPLOAD_SIZE_BYTES: int = 2 * 1024 * 1024  # 2 MB
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    
    # Transactional Email (Resend)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "TechLoom <onboarding@resend.dev>"
    FRONTEND_URL: str = "https://pos-ecommerce-systems-zb3q.vercel.app"
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
