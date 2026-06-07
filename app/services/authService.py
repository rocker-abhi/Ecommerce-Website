from app.repository.userRepository import UserRepository
from app.exceptions.auth import InvalidCredentialsError, UserNotFoundError, UserIsDeactivated
from app.models.user import UserModel
from app.utils.jwt_utility import JwtHelper
from flask import make_response

class AuthService :

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

        return {
            "access_token":token,
            "refresh_token":refresh_token
        }




