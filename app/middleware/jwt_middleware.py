from functools import wraps

from flask import g, request

from app.exceptions.middleware_exceptions import (
    InvalidAuthrozaionHeader,
    NoAuthorizationHeader,
)
from app.utils.jwt_utility import JwtHelper


def jwt_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):

        # checking auth head
        auth_head = request.headers.get("Authorization")
        if not auth_head:
            raise NoAuthorizationHeader()

        if not auth_head.startswith("Bearer "):
            raise InvalidAuthrozaionHeader

        token = auth_head.split(" ")[1]

        payload = JwtHelper.decode_access_token(token)

        g.user_id = payload["sub"]
        g.jwt_payload = payload

        return func(*args, **kwargs)

    return wrapper


"""
Request
   │
   ▼
Authentication
   │
   ▼
Identity Context
   │
   ▼
Authorization Engine
   │
   ▼
Business Policies
   │
   ▼
Application Logic
"""
