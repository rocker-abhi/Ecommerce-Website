from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Instantiate the shared rate limiter with remote address keying
limiter = Limiter(key_func=get_remote_address)
