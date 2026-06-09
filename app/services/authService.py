from app.exceptions.auth import (
    InvalidCredentialsError,
    UserAlreadyExist,
    UserIsDeactivated,
    UserNotFoundError,
)
from app.models.user import UserModel
from app.repository.userRepository import UserRepository
from app.utils.jwt_utility import JwtHelper


class AuthService:
    def __init__(self):
        self.user_repository = UserRepository()

    def login(self, email, password):

        user = self.user_repository.get_by_email(email)
        if not user:
            raise UserNotFoundError()

        if not user.check_password(password):
            raise InvalidCredentialsError()

        if not user.is_active:
            raise UserIsDeactivated()

        token = JwtHelper.create_access_token(user.id)
        refresh_token = JwtHelper.create_refresh_token(user.id)
        self.user_repository.updateRefreshToken(user.id, refresh_token)

        return {"access_token": token, "refresh_token": refresh_token}

    def create_user(self, name, age, password, email, user_type, address_data=None):
        user = self.user_repository.get_by_email(email)
        if user:
            raise UserAlreadyExist()

        from app.models.addresses import AddressModel
        from app.models.user import UserModel

        addresses = []
        if address_data and any(address_data.values()):
            address = AddressModel(
                address_line_1=address_data.get("address_line_1") or "Not Specified",
                address_line_2=address_data.get("address_line_2"),
                city=address_data.get("city") or "Not Specified",
                state=address_data.get("state") or "Not Specified",
                zip_code=address_data.get("zip_code") or "000000",
                country=address_data.get("country") or "Not Specified",
                is_active=True
            )
            addresses.append(address)

        # Map frontend userType role names to database group names
        # 'buyer' -> 'customer'
        # 'seller' -> 'seller'
        # 'admin' -> 'admin'
        group_name = "customer"
        if user_type:
            user_type_lower = user_type.lower()
            if user_type_lower == "buyer":
                group_name = "customer"
            elif user_type_lower in ["admin", "seller"]:
                group_name = user_type_lower
            else:
                group_name = user_type_lower

        group = self.user_repository.get_group_by_name(group_name)
        is_admin_flag = (group_name == "admin")

        new_user = UserModel(
            name=name,
            age=age,
            email=email,
            is_active=True,
            is_admin=is_admin_flag,
            addresses=addresses
        )
        new_user.set_password(password)

        if group:
            new_user.groups.append(group)

        user = self.user_repository.create_user(new_user)
        return user

    def logout(self, user_id):
        self.user_repository.delete_refresh_token(user_id)

    def refresh_token(self, refresh_token_str):
        from app.exceptions.middleware_exceptions import InvalidTokenError

        try:
            payload = JwtHelper.decode_refresh_token(refresh_token_str)
        except Exception:
            raise InvalidTokenError()

        user_id = payload.get("sub")
        if not user_id:
            raise InvalidTokenError()

        db_token = self.user_repository.get_refresh_token_by_user_id(user_id)
        if not db_token or db_token.token != refresh_token_str:
            raise InvalidTokenError()

        token = JwtHelper.create_access_token(user_id)
        new_refresh_token = JwtHelper.create_refresh_token(user_id)
        self.user_repository.updateRefreshToken(user_id, new_refresh_token)

        return {"access_token": token, "refresh_token": new_refresh_token}
