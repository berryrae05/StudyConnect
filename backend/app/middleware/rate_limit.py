
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

def setup_rate_limiting(app):

    # slowapi uses app.state.limiter to find the limiter instance
    app.state.limiter = limiter

    # Register the handler so rate-limit violations return a clean JSON 429
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)