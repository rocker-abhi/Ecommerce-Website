# importing library
from flask import request, g, jsonify, make_response
import logging
from flask import current_app
from app.validators.login_validator import RequestLoginSchema, ResponseLoginSchema
from app.services.authService import AuthService

logger = logging.getLogger(__name__)

auth_service = AuthService()

def login():

    logger.debug(f"request id: {getattr(g, 'request_id', '-')}")

    request_schema = RequestLoginSchema()
    data = request.get_json()
    validated_data = request_schema.load(data)
    email = validated_data.get("email")
    password = validated_data.get("password")

    tokens_data = auth_service.login(email, password)
    response_schema = ResponseLoginSchema()
    response_schema.validate(tokens_data)
    response_data = response_schema.dump(tokens_data)

    response_payload = {
        "success": True,
        "message": "Login successful",
        "data": response_data
    }

    if current_app.config["current_env"] == "development":
        logger.info(f"Received login request with data: {response_payload}")

    response = make_response(jsonify(response_payload))
    response.success = True
    return response


