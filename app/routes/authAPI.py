# importing library
from flask import request, g, jsonify
import logging
from flask import current_app
from app.validators.login_validator import RequestLoginSchema
from marshmallow import ValidationError
from app.services.authService import AuthService

logger = logging.getLogger(__name__)

auth_service = AuthService()

def login():

    logger.debug(f"request id: {getattr(g, 'request_id', '-')}")

    schema = RequestLoginSchema()
    data = request.get_json()
    validated_data = schema.load(data)
    email = validated_data.get("email")
    password = validated_data.get("password")

    auth_service.login(email, password)

    if current_app.config["current_env"] == "development":
        logger.info(f"Received login request with data: {validated_data}")

    return jsonify({"message": "Login successful", "data": validated_data}), 200

    # except ValidationError as ve:
    #     logger.warning(f"Validation error: {ve.messages}")
    #     return jsonify({"error": "Validation failed", "details": ve.messages}), 400
