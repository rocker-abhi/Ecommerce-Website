from datetime import datetime, timedelta
from typing import Dict

import jwt

_jwtSecret = None
_access_token_expire_minutes = 15
_refresh_token_expire_days = 7


class JwtHelper:
    @staticmethod
    def load_jwt_secret(secret):
        global _jwtSecret
        if _jwtSecret is None:
            _jwtSecret = secret

    @staticmethod
    def create_access_token(user_id):
        global _jwtSecret

        if not _jwtSecret:
            raise Exception(
                "JWT secret is not loaded. Please call load_jwt_secret() before creating tokens."
            )

        payload = {
            "sub": str(user_id),
            "type": "access",
            "exp": datetime.utcnow() + timedelta(minutes=_access_token_expire_minutes),
        }
        return jwt.encode(payload, _jwtSecret, algorithm="HS256")

    @staticmethod
    def create_refresh_token(user_id):
        global _jwtSecret

        if not _jwtSecret:
            raise Exception(
                "JWT secret is not loaded. Please call load_jwt_secret() before creating tokens."
            )

        try:
            payload = {
                "sub": str(user_id),
                "type": "refresh",
                "exp": datetime.utcnow() + timedelta(days=_refresh_token_expire_days),
            }
            return jwt.encode(payload, _jwtSecret, algorithm="HS256")
        except Exception as e:
            raise Exception(f"Could not create refresh token: {e}")

    @staticmethod
    def __verify_access_token(token: str) -> bool:
        global _jwtSecret
        if not _jwtSecret:
            raise Exception(
                "JWT secret is not loaded. Please call load_jwt_secret() before creating tokens."
            )
        try:
            payload = jwt.decode(token, _jwtSecret, algorithms=["HS256"])
            if payload["type"] == "access":
                return True
        except jwt.ExpiredSignatureError:
            pass
        except jwt.InvalidTokenError:
            pass
        return False

    @staticmethod
    def __verify_refresh_token(token: str) -> bool:
        global _jwtSecret
        if not _jwtSecret:
            raise Exception(
                "JWT secret is not loaded. Please call load_jwt_secret() before creating tokens."
            )
        try:
            payload = jwt.decode(token, _jwtSecret, algorithms=["HS256"])
            if payload["type"] == "refresh":
                return True
        except jwt.ExpiredSignatureError:
            pass
        except jwt.InvalidTokenError:
            pass
        return False

    @staticmethod
    def decode_access_token(access_token: str) -> Dict:
        try:
            if JwtHelper.__verify_access_token(token=access_token):
                return jwt.decode(access_token, _jwtSecret, algorithms=["HS256"])

            raise Exception("Invalid access token")
        except jwt.ExpiredSignatureError:
            raise Exception("Access token expired")
        except jwt.InvalidTokenError:
            raise Exception("Invalid access token")

    @staticmethod
    def decode_refresh_token(refresh_token: str) -> Dict:
        try:
            if JwtHelper.__verify_refresh_token(token=refresh_token):
                return jwt.decode(refresh_token, _jwtSecret, algorithms=["HS256"])

            raise Exception("Invalid refresh token")
        except jwt.ExpiredSignatureError:
            raise Exception("Refresh token expired")
        except jwt.InvalidTokenError:
            raise Exception("Invalid refresh token")


"""
    LOGIN
      ↓
    Create Access Token (15 min)
    Create Refresh Token (7 days)
      ↓
    Store Refresh Token In DB
      ↓
    Return Both Tokens
    
    --------------------------------
    
    API REQUEST
      ↓
    JWT Middleware
      ↓
    Verify Access Token
      ↓
    Allow Request
    
    --------------------------------
    
    ACCESS TOKEN EXPIRED
      ↓
    401 Token Expired
      ↓
    Frontend Calls /refresh
    
    --------------------------------
    
    REFRESH ENDPOINT
      ↓
    Verify Refresh JWT
      ↓
    Verify Token Exists In DB
      ↓
    Generate New Access Token
      ↓
    Generate New Refresh Token
      ↓
    Delete Old Refresh Token
      ↓
    Insert New Refresh Token
      ↓
    Return New Tokens
    
    --------------------------------
    
    LOGOUT
      ↓
    Delete Refresh Token
      ↓
    User Logged Out
"""
