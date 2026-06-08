from marshmallow import Schema, ValidationError, fields, validate, validates


class RequestResponseCreateUserSchema(Schema):
    name = fields.Str(
        required=True,
        validate=validate.Length(
            min=1, max=100, error="Name must be between 1 and 100 characters."
        ),
    )
    age = fields.Int(
        required=True,
        validate=validate.Range(min=18, max=80, error="Age must be between 18 and 80"),
    )

    password = fields.Str(
        required=True,
        validate=validate.Length(
            min=6, max=12, error="Password must be between 6 and 12 characters."
        ),
        load_only=True,
    )

    email = fields.Email(
        required=True, error_messages={"required": "Email is required."}
    )

    userType = fields.Str(
        required=True,
        validate=validate.OneOf(
            ["admin", "buyer", "seller"], error="Invalid user type."
        ),
    )

    @validates("password")
    def validate_password(self, value, **kwargs):
        split = value.split(" ")
        if len(split) > 1:
            raise ValidationError("Password cannot contain spaces.")


class ResponseCreateUserSchema(Schema):
    pass
