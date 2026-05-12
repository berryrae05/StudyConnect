from app.database import SessionLocal

def get_db():

    # Creates a database session and closes it after request ends

    db = SessionLocal()
    try:
        yield db

    finally:
        db.close()