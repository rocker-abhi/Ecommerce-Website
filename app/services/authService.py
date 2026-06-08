from flask import jsonify

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
        return {"success": True, "message": "Logged out successfully", "data": {}}
