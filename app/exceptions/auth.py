from app.exceptions.base import AppException


class InvalidCredentialsError(AppException):
    def __init__(self):
        super().__init__(
            message="Invalid credentials provided",
            error_code="INVALID_CREDENTIALS",
            status_code=401,
        )


class UserNotFoundError(AppException):
    def __init__(self):
        super().__init__(
            message="User not found", error_code="USER_NOT_FOUND", status_code=404
        )


class UserIsDeactivated(AppException):
    def __init__(self):
        super().__init__(
            message="User is Deactivated",
            error_code="USER_IS_DEACTIVATED",
            status_code=403,
        )


class UserAlreadyExist(AppException):
    def __init__(self):
        super().__init__(
            message="User already exists",
            error_code="USER_ALREADY_EXIST",
            status_code=400,
        )
