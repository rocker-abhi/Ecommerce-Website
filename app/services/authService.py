from app.exceptions.auth import (
    InvalidCredentialsError,
    UserAlreadyExist,
    UserIsDeactivated,
    UserNotFoundError,
)
from app.models.user import UserModel
from app.repository.userRepository import UserRepository
from app.utils.jwt_utility import JwtHelper


class AuthService:
    def __init__(self):
        self.user_repository = UserRepository()

    def login(self, email, password):

        user = self.user_repository.get_by_email(email)
        if not user:
            raise UserNotFoundError()

        if not user.check_password(password):
            raise InvalidCredentialsError()

        if not user.is_active:
            raise UserIsDeactivated()

        token = JwtHelper.create_access_token(user.id)
        refresh_token = JwtHelper.create_refresh_token(user.id)
        self.user_repository.updateRefreshToken(user.id, refresh_token)

        return {"access_token": token, "refresh_token": refresh_token}

    def create_user(self, name, age, password, email, user_type):
        user = self.user_repository.get_by_email(email)
        if user:
            raise UserAlreadyExist()

        new_user = UserModel(name=name, age=age, email=email, userType=user_type)
        new_user.hash_password(password)
        new_user.activate_user(status=True)
        user = self.user_repository.create_user(new_user)
        return user

    def logout(self, user_id):
        self.user_repository.delete_refresh_token(user_id)

    def refresh_token(self, refresh_token_str):
        from app.exceptions.middleware_exceptions import InvalidTokenError

        try:
            payload = JwtHelper.decode_refresh_token(refresh_token_str)
        except Exception:
            raise InvalidTokenError()

        user_id = payload.get("sub")
        if not user_id:
            raise InvalidTokenError()

        db_token = self.user_repository.get_refresh_token_by_user_id(user_id)
        if not db_token or db_token.token != refresh_token_str:
            raise InvalidTokenError()

        token = JwtHelper.create_access_token(user_id)
        new_refresh_token = JwtHelper.create_refresh_token(user_id)
        self.user_repository.updateRefreshToken(user_id, new_refresh_token)

        return {"access_token": token, "refresh_token": new_refresh_token}
