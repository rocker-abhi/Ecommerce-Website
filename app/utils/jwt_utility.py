import jwt
from datetime import datetime, timedelta


_jwtSecret = None
_access_token_expire_minutes = 15
_refresh_token_expire_days = 7

class JwtHelper :
    @staticmethod
    def load_jwt_secret(secret) :
        global _jwtSecret
        if _jwtSecret is None:
            _jwtSecret = secret

    @staticmethod
    def create_access_token(user_id) :
        global _jwtSecret

        if not _jwtSecret :
            raise Exception("JWT secret is not loaded. Please call load_jwt_secret() before creating tokens.")

        payload = {
        "sub":str(user_id),
        "type":"access",
        "exp":datetime.utcnow() + timedelta(minutes=_access_token_expire_minutes)
    }
        return jwt.encode(payload,_jwtSecret,algorithm="HS256")

    @staticmethod
    def create_refresh_token(user_id) :
        global _jwtSecret

        if not _jwtSecret:
            raise Exception("JWT secret is not loaded. Please call load_jwt_secret() before creating tokens.")

        payload = {
            "sub":str(user_id),
            "type":"refresh",
            "exp":datetime.utcnow() + timedelta(days=_refresh_token_expire_days)
        }
        return jwt.encode(payload,_jwtSecret,algorithm="HS256")
