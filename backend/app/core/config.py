from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database Configuration
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 3306
    DATABASE_USER: str = "root"
    DATABASE_PASSWORD: str = "password"
    DATABASE_NAME: str = "rta_system"

    # JWT Configuration
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "RTA System"

    # File Upload Configuration
    UPLOAD_DIRECTORY: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    # Transaction Limits
    MAX_TRANSACTION_AMOUNT: float = 1000000.0  # ₹10 lakhs
    MIN_TRANSACTION_AMOUNT: float = 100.0  # ₹100

    # Email Configuration
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""  # Set via environment variable
    SMTP_PASSWORD: str = ""  # Set via environment variable
    EMAIL_FROM: str = ""  # Set via environment variable

    # Debug Mode
    DEBUG_MODE: bool = True  # Set to False in production

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()