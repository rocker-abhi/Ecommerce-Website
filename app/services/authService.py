from app.repository.userRepository import UserRepository
from app.exceptions.auth import (
    InvalidCredentialsError,
    UserNotFoundError
)

class AuthService :

    def __init__(self):
        self.user_repository = UserRepository()

    def login(self, email, password):

        user = self.user_repository.get_by_email(email)
        if not user:
            raise UserNotFoundError()