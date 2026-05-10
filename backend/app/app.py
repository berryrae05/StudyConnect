from fastapi import FastAPI
from .middleware.cors import setup_cors

app = FastAPI()

# Middleware
setup_cors(app)

@app.get("/")
def home():
    return {"message": "Study Connect API Running"}