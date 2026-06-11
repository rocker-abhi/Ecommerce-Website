from app.exceptions.base import AppException


class UnsupportedFileType(AppException):
    def __init__(self):
        super().__init__(
            message="Unsupported file type",
            error_code="UNSUPPORTED_FILE_TYPE",
            status_code=400,
        )
