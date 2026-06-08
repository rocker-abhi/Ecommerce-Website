# importing library
import logging

from flask import current_app, g, jsonify, make_response, request

from app.middleware.jwt_middleware import jwt_required
from app.services.authService import AuthService
from app.validators.create_user_validator import RequestResponseCreateUserSchema
from app.validators.login_validator import RequestLoginSchema, ResponseLoginSchema
from app.validators.logout_validator import RequestLogoutSchema, ResponseLogoutSchema

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
        "data": response_data,
    }

    if current_app.config["current_env"] == "development":
        logger.info(f"Received login request with data: {response_payload}")

    response = make_response(jsonify(response_payload))
    response.success = True
    return response


def create_user():
    schema = RequestResponseCreateUserSchema()
    data = schema.load(request.get_json())
    name = data.get("name")
    age = data.get("age")
    password = data.get("password")
    email = data.get("email")
    user_type = data.get("userType")

    user = auth_service.create_user(name, age, password, email, user_type)
    print(schema.dump(user))

    response_payload = {
        "success": True,
        "message": "User created successfully",
        "data": schema.dump(user),
    }

    if current_app.config["current_env"] == "development":
        logger.info(f"Received create user request with data: {response_payload}")

    response = make_response(jsonify(response_payload))
    response.success = True
    return response


@jwt_required
def logout():
    schema = RequestLogoutSchema()
    data = schema.load(request.get_json())
    user_id = data.get("user_id")
    response_data = auth_service.logout(user_id)

    response_schema = ResponseLogoutSchema()
    response = make_response(jsonify(response_schema.dump(response_data)))
    response.success = True
    return response
