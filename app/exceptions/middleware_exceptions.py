from app.exceptions.base import AppException


class NoAuthorizationHeader(AppException):
    def __init__(self):
        super().__init__(
            message="No authorization header provided",
            error_code="NO_AUTHORIZATION_HEADER",
            status_code=401,
        )


class InvalidTokenError(AppException):
    def __init__(self):
        super().__init__(
            message="Invalid token provided",
            error_code="INVALID_TOKEN",
            status_code=401,
        )


class InvalidAuthrozaionHeader(AppException):
    def __init__(self):
        super().__init__(
            message="Authorization header is invalid",
            error_code="INVALID_AUTHORIZATION_HEADER",
            status_code=401,
        )


class PermissionDenied(AppException):
    def __init__(self):
        super().__init__(
            message="Permission denied",
            error_code="PERMISSION_DENIED",
            status_code=403,
        )
