from marshmallow import Schema, fields, validate


class UpdateProfileRequestSchema(Schema):
    name = fields.Str(
        required=False,
        validate=validate.Length(min=1, max=100, error="Name must be between 1 and 100 characters."),
    )
    email = fields.Email(
        required=False,
        error_messages={"invalid": "Invalid email address format."},
    )
    age = fields.Int(
        required=False,
        validate=validate.Range(min=19, max=99, error="Age must be between 19 and 99."),
    )
    profile_picture_url = fields.Str(
        required=False,
        allow_none=True,
    )


class UpdateProfileResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.Dict(required=True)


class ResetPasswordRequestSchema(Schema):
    password = fields.Str(
        required=True,
        validate=validate.Length(min=6, max=100, error="Password must be at least 6 characters."),
        error_messages={"required": "Password is required."},
    )
    confirm_password = fields.Str(
        required=True,
        validate=validate.Length(min=6, max=100, error="Confirm password must be at least 6 characters."),
        error_messages={"required": "Confirm password is required."},
    )


class ResetPasswordResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)


class UserDetailSchema(Schema):
    id = fields.Str(required=True)
    name = fields.Str(required=True)
    email = fields.Email(required=True)
    age = fields.Int(required=True)
    is_active = fields.Boolean(required=True)
    is_admin = fields.Boolean(required=True)
    userType = fields.Str(required=True)


class ListUsersResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.List(fields.Nested(UserDetailSchema), required=True)


class ToggleUserStatusRequestSchema(Schema):
    is_active = fields.Boolean(required=False)
    is_admin = fields.Boolean(required=False)
    name = fields.Str(
        required=False,
        validate=validate.Length(min=1, max=100, error="Name must be between 1 and 100 characters."),
    )
    email = fields.Email(
        required=False,
        error_messages={"invalid": "Invalid email address format."},
    )
    age = fields.Int(
        required=False,
        validate=validate.Range(min=19, max=99, error="Age must be between 19 and 99."),
    )


class ToggleUserStatusResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.Nested(UserDetailSchema, required=True)


class DeleteUserResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
