from dotenv import load_dotenv
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME")

    DATABASE_URL =(f"mysql+pymysql://"f"{DB_USER}:{DB_PASSWORD}"f"@{DB_HOST}:{DB_PORT}"f"/{DB_NAME}")

    JWT_SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_ALGORITHM = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

    EMAIL_VERIFICATION_EXPIRE_MINUTES = int(os.getenv("EMAIL_VERIFICATION_EXPIRE_MINUTES", 60))

    MAIL_USERNAME=os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD")
    MAIL_FROM=os.getenv("MAIL_FROM")
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587))
    MAIL_SERVER=os.getenv("MAIL_SERVER")
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Study Connect")

    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True") == "True"
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False") == "True"

    ALLOWED_EMAIL_DOMAINS=os.getenv("ALLOWED_EMAIL_DOMAINS", "").split(",")

    FRONTEND_URL=os.getenv("FRONTEND_URL")

settings = Settings()