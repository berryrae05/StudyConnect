""" Handles email sending logic for account verification"""

from fastapi_mail import(
    FastMail,
    MessageSchema,
    ConnectionConfig
)

from app.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

async def send_verification_email(email: str, token: str):
    
    verification_link= (
        f"{settings.FRONTEND_URL}"
        f"/auth/verify-email"
        f"?token={token}"
    )

    message = MessageSchema(
        subject="Verify Your Study Connect Account",
        recipients=[email],
        body=f"""
Hello, 

Thank you for registering for Study Connect.

Please verify your email by clicking the link below:

{verification_link}

If you did not create this account,
please ignore this email.

Study Connect Team 
            """, subtype="plain"
    )

    fm = FastMail(conf)

    try:
        await fm.send_message(message)
        return True

    except Exception as e:
        print(e)
        return False