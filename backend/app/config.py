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

settings = Settings()