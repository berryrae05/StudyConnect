from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(

        # Reads from .env in backend/.env
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # database
    DB_HOST: str
    DB_PORT: int = 3306
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # EMAIL Token lifetimes
    EMAIL_VERIFICATION_EXPIRE_MINUTES: int = 60
    PASSWORD_RESET_EXPIRE_MINUTES: int = 15

    # Mail
    MAIL_USERNAME:  str = ""
    MAIL_PASSWORD:  str = ""
    MAIL_FROM:      str = ""
    MAIL_PORT:      int = 587
    MAIL_SERVER:    str = ""
    MAIL_FROM_NAME: str = "Study Connect"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS:  bool = False
    
    # App
    FRONTEND_URL: str = "http://localhost:5173"

    # environment
    ENVIRONMENT: str = "development"

    # security
    ENABLE_HSTS: bool = False

    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15

    # Email domain restriction
    ALLOWED_EMAIL_DOMAINS: str = ""

    @property
    def allowed_email_domains(self) -> str:

        if not self.ALLOWED_EMAIL_DOMAINS.strip():
            return []
        return [
            d.strip().lower()
            for d in self.ALLOWED_EMAIL_DOMAINS.split(",")
            if d.strip()
        ]

settings = Settings()

