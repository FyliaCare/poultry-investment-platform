from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Poultry Investment Platform"
    API_V1_STR: str = "/api/v1"
    JWT_SECRET: str
    DATABASE_URL: str
    ADMIN_EMAIL: str = "admin@example.com"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

settings = Settings()
