from fastapi import FastAPI
from .middleware.cors import setup_cors

from sqlalchemy import text
from app.database import engine
from contextlib import asynccontextmanager

# Tests if MySQL connection works
def test_database_connection():

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        
        print("Database connection succesful!")

    except Exception as e:
        print("Database connection failed")
        print(e)


# Runs once when FastAPI starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    
    #Startup logic
    test_database_connection()

    yield

    #Shutdown logic
    print("Shutting down Study Connect API...")

app = FastAPI(lifespan=lifespan)

# Middleware
setup_cors(app)

@app.get("/")
def home():
    return {"message": "Study Connect API Running"}