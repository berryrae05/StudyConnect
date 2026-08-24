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

async def send_verification_email(email: str, token: str) -> bool:
    
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
    
async def send_password_reset_email(email: str, token: str) -> bool:

    reset_link = (
        f"{settings.FRONTEND_URL}/reset-password?token={token}"
    )
    message = MessageSchema(
        subject="Reset Your Study Connect Password",
        recipients=[email],
        body=f"""
Hello,

We recieved a request to reset you Study Connect password.

Click the link below to choose a new password (valid for 15 minutes):

{reset_link}

If you didn't request a password reset, you can safely ignore this email.
Your password will not change.

Study Connect Team
""",
        subtype="plain",
    )
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        return True
    except Exception as e:
        print(e)
        return False

# Someone joined your group
async def send_join_notification(
        creator_email: str,
        creator_name: str,
        joiner_name: str,
        module_code: str,
        spots_remaining: int,
        group_id: int,
) -> bool:

    group_link = f"{settings.FRONTEND_URL}/groups/{group_id}"

    spots_line = (
        "Your group is now full."
        if spots_remaining == 0
        else f"{spots_remaining} spot(s) remaining"
    )

    message = MessageSchema(
        subject=f"New member joined your {module_code} study group.",
        recipients=[creator_email],
        body=f"""
Hello {creator_name},

{joiner_name} has joined your {module_code} study group.

{spots_line}
View your group: {group_link}
Study Connect Team
""",
        subtype="plain",
    )
    fm = FastMail(conf)
    try: 
        await fm.send_message(message)
        return True
    except Exception as e:
        print(e)
        return False

# Someone left your group
async def send_leave_notification(
        creator_email: str,
        creator_name: str,
        leaver_name: str,
        module_code: str,
        group_id: int,
) -> bool:
    group_link = f"{settings.FRONTEND_URL}/groups/{group_id}"

    message = MessageSchema(
        subject=f"A member left your {module_code} study group",
        recipients=[creator_email],
        body=f"""
Hello {creator_name},

{leaver_name} has left your {module_code} study group.
A spot is now available.

View your group: {group_link}

Study Connect Team
""", 
        subtype="plain",
    )
    fm = FastMail(conf)
    try: 
        await fm.send_message(message)
        return True
    except Exception as e:
        print(e)
        return False

# Session cancelled (group deleted)
async def send_cancellation_notification(
        member_email: str,
        member_name: str,
        module_code: str,
        location: str | None,
        session_date: str | None,
        group_id: int,
) -> bool:

    when_where = ""

    if session_date:
        when_where += f"Session date: {session_date}\n"
    if location:
        when_where += f"Venue: {location}\n"

    message = MessageSchema(
        subject=f"Study group cancelled: {module_code}",
        recipients=[member_email],
        body=f"""
Hello {member_name},

The {module_code} study group you joined has been cancelled by its creator.
{when_where}
If you still need a study group for this module, you can find others on Study Connect.

Study Connect Team
""",
        subtype="plain",
    )
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        return True
    except Exception as e:
        print(e)
        return False

# Group nearly full
async def send_nearly_full_notification(
        creator_email: str,
        creator_name: str,
        module_code: str,
        current_count: int,
        max_members: int,
        group_id: int,
) -> bool:

    # Sent to the group creator when the group reached 80%. Only sent once
    group_link = f"{settings.FRONTEND_URL}/groups/{group_id}"

    message = MessageSchema(
        subject=f"Your {module_code} study group is almost full",
        recipients=[creator_email],
        body=f"""
Hello {creator_name},

Your {module_code} study group is almost full: {current_count}/{max_members} members.

If you would like to increase the maximum number of participants,
you can edit your group here: {group_link}

Study Connect Team
""",
        subtype="plain",
    )
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        return True
    except Exception as e:
        print(e)
        return False

# Session reminder (24h before)
async def send_session_reminder(
   email: str,
   name: str,
   module_code: str,
   location: str | None,
   session_date: str,
   group_id: int,     
) -> bool:
    group_link = f"{settings.FRONTEND_URL}/groups/{group_id}"
    location_line =f"Venue: {location}" if location else "Venue: Not Specified"

    message = MessageSchema(
        subject=f"Reminder: {module_code} study session tomorrow",
        recipients=[email],
        body=f"""
Hello {name},
This is a reminder that your {module_code} study session is schedules for tomorrow.

{location_line}
Date and time: {session_date}

View group detail: {group_link}

Study Connect Team
""",
        subtype="plain",
    )
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        return True
    except Exception as e:
        print(e)
        return False