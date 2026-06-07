import logging
from flask import jsonify
from app.exceptions.base import AppException
from marshmallow import ValidationError

logger = logging.getLogger(__name__)

def register_exception_handlers(app):

    @app.errorhandler(AppException)
    def handle_app_exception(error):

        logger.warning(
            f"{error.error_code}: {error.message}"
        )

        response = {
            "success": False,
            "message": error.message,
            "error_code": error.error_code
        }

        if error.details:
            response["details"] = error.details

        return jsonify(response), error.status_code

    @app.errorhandler(Exception)
    def handle_unexpected_exception(error):

        logger.exception(
            "Unhandled exception occurred",
            exc_info=error
        )

        return jsonify({
            "success": False,
            "message": "Internal Server Error",
            "error_code": "INTERNAL_SERVER_ERROR"
        }), 500

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):

        logger.exception(
            f"Validation error: {error.messages}"
        )
        return jsonify({
            "success": False,
            "message": "Validation failed",
            "error_code": "VALIDATION_ERROR",
            "errors": error.messages
        }), 400