
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings

class SecurityHeadersMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Limit referrer information sent to external sites
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Opt out of unused browser APIs
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )

        # production only
        if settings.ENVIRONMENT == "production":

            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data:; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "  
            )

            if settings.ENABLE_HSTS:
                response.headers["Strict-Transport-Security"] = (
                    "max-age=31536000; includeSubDomains"
                )

        return response
    
def setup_security_headers(app):
    app.add_middleware(SecurityHeadersMiddleware)