from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    secret_key: str = "dev-insecure-secret-key-do-not-use-in-production"
    session_expire_minutes: int = 60
    seed_demo_users: bool = True
    cookie_samesite: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.environment.lower() == "production":
            if (
                not self.secret_key
                or "dev-insecure" in self.secret_key
                or len(self.secret_key) < 32
            ):
                raise ValueError(
                    "Production requires a secure SECRET_KEY with minimum 32 characters."
                )
        return self


settings = Settings()