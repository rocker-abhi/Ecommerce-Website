from marshmallow import Schema, ValidationError, fields, validate, validates


class RequestLoginSchema(Schema):
    email = fields.Email(
        required=True,
        error_messages={
            "required": "Email is required.",
            "invalid": "Email format is invalid.",
        },
    )

    password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(
            min=6, max=10, error="Password must be between 6 and 10 characters."
        ),
        error_messages={"required": "Password is required."},
    )

    @validates("password")
    def validate_password(self, value, **kwargs):
        if " " in value:
            raise ValidationError("Password cannot contain spaces.")


class ResponseLoginSchema(Schema):
    access_token = fields.Str(required=True)
    refresh_token = fields.Str(required=True)
