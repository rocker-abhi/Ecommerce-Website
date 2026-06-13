# importing library
import logging

from flask import current_app, g, jsonify, make_response, request

from app.middleware.jwt_middleware import jwt_required
from app.services.authService import AuthService
from app.validators.create_user_validator import (
    RequestResponseCreateUserSchema,
    ResponseCreateUserSchema,
)
from app.validators.login_validator import RequestLoginSchema, ResponseLoginSchema
from app.validators.logout_validator import RequestLogoutSchema, ResponseLogoutSchema
from app.validators.refresh_token_validatory import (
    RequestRefreshTokenSchema,
    ResponseRefreshTokenSchema,
)
from app.validators.me_validator import RequestMeSchema, ResponseMeSchema

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
    response_payload = response_schema.dump(
        {"success": True, "message": "Login successful", "data": tokens_data}
    )

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
    address = data.get("address")

    user = auth_service.create_user(name, age, password, email, user_type, address)
    response_schema = ResponseCreateUserSchema()
    response_payload = response_schema.dump(
        {"success": True, "message": "User created successfully", "data": user}
    )

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
    auth_service.logout(user_id)

    response_schema = ResponseLogoutSchema()
    response_payload = response_schema.dump(
        {"success": True, "message": "Logged out successfully", "data": {}}
    )

    response = make_response(jsonify(response_payload))
    response.success = True
    return response


def refresh_token():
    schema = RequestRefreshTokenSchema()
    data = schema.load(request.get_json())
    refresh_token_str = data.get("refresh_token")

    tokens_data = auth_service.refresh_token(refresh_token_str)
    response_schema = ResponseRefreshTokenSchema()
    response_payload = response_schema.dump(
        {
            "success": True,
            "message": "Token refreshed successfully",
            "data": tokens_data,
        }
    )

    response = make_response(jsonify(response_payload))
    response.success = True
    return response


@jwt_required
def auth_me():
    RequestMeSchema().load(request.get_json(silent=True) or {})
    user_id = g.user_id
    user = auth_service.get_user_by_id(user_id)

    response_schema = ResponseMeSchema()
    response_payload = response_schema.dump(
        {"success": True, "message": "User retrieved successfully", "data": user}
    )

    response = make_response(jsonify(response_payload))
    response.success = True
    return response


@jwt_required
def update_profile():
    user_id = g.user_id
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    age = data.get("age")
    profile_picture_url = data.get("profile_picture_url")

    user = auth_service.get_user_by_id(user_id)
    if name:
        user.name = name
    if email:
        user.email = email
    if age is not None:
        user.age = int(age)
    if profile_picture_url is not None:
        user.profile_picture_url = profile_picture_url

    g.db.commit()
    
    response_payload = {
        "success": True,
        "message": "Profile updated successfully",
        "data": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "age": user.age,
            "profile_picture_url": user.profile_picture_url,
            "userType": user.userType
        }
    }
    return make_response(jsonify(response_payload))


@jwt_required
def reset_password():
    user_id = g.user_id
    data = request.get_json() or {}
    password = data.get("password")
    confirm_password = data.get("confirm_password")

    if not password:
        return make_response(jsonify({"success": False, "message": "Password is required"}), 400)
    if password != confirm_password:
        return make_response(jsonify({"success": False, "message": "Passwords do not match"}), 400)

    user = auth_service.get_user_by_id(user_id)
    user.set_password(password)
    g.db.commit()

    return make_response(jsonify({
        "success": True,
        "message": "Password reset successfully"
    }))
