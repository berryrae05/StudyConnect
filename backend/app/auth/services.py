"""Simple Authentication without Email Verification"""

from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi import HTTPException, status

from app.users.model import User
from app.users.schema import UserCreate, UserLogin

# Password hashing configuration
# bcrypt hashes passwords securely before storing them in the database
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Converts a plain text password into a secure hashed password.
def hash_password(password:str) -> str:
    return pwd_context.hash(password)

# Compares a plain text password with the hashed password stored in the database.
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password,hashed_password)

# Registers a new user
def register_user(user_data: UserCreate, db: Session):

    """
    Future improvements:
    - Institutional email validation
    - Email verification
    - Strong password validation
    """

    # Check if email already exists
    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user object
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password=hash_password(user_data.password),
        gender=user_data.gender
    )

    # Save to database
    db.add(new_user)
    db.commit()

    # Refresh gets latest DB values
    # (id, timestamps, defaults)
    db.refresh(new_user)

    return new_user

# Logs a user into the system.
def login_user(user_data: UserLogin, db: Session):

    # Find user by email
    user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    # Email not found
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Wrong password
    if not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Login success
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role
        }
    }