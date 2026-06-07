from app.exceptions.base import AppException

class InvalidCredentialsError(AppException):
    def  __init__(self):
        super().__init__(
            message="Invalid credentials provided",
            error_code="INVALID_CREDENTIALS",
            status_code=401
        )

class UserNotFoundError(AppException):
    def __init__(self):
        super().__init__(
            message="User not found",
            error_code="USER_NOT_FOUND",
            status_code=404
        )
