from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./cafeteria.db"
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    FRONTEND_PUBLIC_URL: str = "http://localhost:5173"
    SECRET_KEY: str = "dev-secret-key-change-in-prod"
    MAX_IMAGE_SIZE_MB: int = 5
    BROWSING_TIMEOUT_MINUTES: int = 15
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        extra = "allow"

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return []
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

settings = Settings()
