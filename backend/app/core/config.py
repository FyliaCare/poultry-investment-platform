from pydantic import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Poultry Investment Platform"
    API_V1_STR: str = "/api/v1"
    JWT_SECRET: str
    DATABASE_URL: str
    ADMIN_EMAIL: str = "admin@example.com"
    class Config:
        env_file = "../../.env"

settings = Settings()
