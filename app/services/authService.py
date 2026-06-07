from app.repository.userRepository import UserRepository


class AuthService :

    def __init__(self):
        self.user_repository = UserRepository()

    def login(self, email, password):

        user = self.user_repository.get_by_email(email)
        if not user:
            raise InvalidCredentialsError("Invalid email or password")