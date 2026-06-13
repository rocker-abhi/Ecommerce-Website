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
    from app.validators.user_management_validator import UpdateProfileRequestSchema, UpdateProfileResponseSchema
    user_id = g.user_id
    schema = UpdateProfileRequestSchema()
    data = schema.load(request.get_json() or {})
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
    
    response_schema = UpdateProfileResponseSchema()
    response_payload = response_schema.dump({
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
    })
    return make_response(jsonify(response_payload))


@jwt_required
def reset_password():
    from app.validators.user_management_validator import ResetPasswordRequestSchema, ResetPasswordResponseSchema
    user_id = g.user_id
    schema = ResetPasswordRequestSchema()
    data = schema.load(request.get_json() or {})
    password = data.get("password")

    user = auth_service.get_user_by_id(user_id)
    user.set_password(password)
    g.db.commit()

    response_schema = ResetPasswordResponseSchema()
    response_payload = response_schema.dump({
        "success": True,
        "message": "Password reset successfully"
    })
    return make_response(jsonify(response_payload))


@jwt_required
def list_users():
    from app.validators.user_management_validator import ListUsersResponseSchema
    requesting_user = auth_service.get_user_by_id(g.user_id)
    if not requesting_user or not requesting_user.is_admin:
        return make_response(jsonify({"success": False, "message": "Admin privileges required"}), 403)

    from app.models.user import UserModel
    users = g.db.query(UserModel).all()
    serialized = []
    for u in users:
        serialized.append({
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "age": u.age,
            "is_active": u.is_active,
            "is_admin": u.is_admin,
            "userType": u.userType
        })
    response_schema = ListUsersResponseSchema()
    response_payload = response_schema.dump({
        "success": True,
        "message": "Users retrieved successfully",
        "data": serialized
    })
    return make_response(jsonify(response_payload))


@jwt_required
def toggle_user_status(user_id):
    from app.validators.user_management_validator import ToggleUserStatusRequestSchema, ToggleUserStatusResponseSchema
    requesting_user = auth_service.get_user_by_id(g.user_id)
    if not requesting_user or not requesting_user.is_admin:
        return make_response(jsonify({"success": False, "message": "Admin privileges required"}), 403)

    from app.models.user import UserModel
    user = g.db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        return make_response(jsonify({"success": False, "message": "User not found"}), 404)

    schema = ToggleUserStatusRequestSchema()
    data = schema.load(request.get_json() or {})
    if "is_active" in data:
        user.is_active = bool(data["is_active"])
    if "is_admin" in data:
        user.is_admin = bool(data["is_admin"])
    if "name" in data:
        user.name = str(data["name"])
    if "email" in data:
        user.email = str(data["email"])
    if "age" in data:
        user.age = int(data["age"])

    g.db.commit()
    response_schema = ToggleUserStatusResponseSchema()
    response_payload = response_schema.dump({
        "success": True,
        "message": "User status updated successfully",
        "data": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "age": user.age,
            "is_active": user.is_active,
            "is_admin": user.is_admin,
            "userType": user.userType
        }
    })
    return make_response(jsonify(response_payload))


@jwt_required
def delete_user(user_id):
    from app.validators.user_management_validator import DeleteUserResponseSchema
    requesting_user = auth_service.get_user_by_id(g.user_id)
    if not requesting_user or not requesting_user.is_admin:
        return make_response(jsonify({"success": False, "message": "Admin privileges required"}), 403)

    from app.models.user import UserModel
    user = g.db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        return make_response(jsonify({"success": False, "message": "User not found"}), 404)

    if user.id == g.user_id:
        return make_response(jsonify({"success": False, "message": "Cannot delete your own admin account"}), 400)

    g.db.delete(user)
    g.db.commit()
    response_schema = DeleteUserResponseSchema()
    response_payload = response_schema.dump({
        "success": True,
        "message": "User deleted successfully"
    })
    return make_response(jsonify(response_payload))


