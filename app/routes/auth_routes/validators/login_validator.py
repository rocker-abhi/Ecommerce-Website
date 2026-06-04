from marshmallow import Schema, fields, validate, ValidationError, validates


class RequestLoginSchema(Schema):

    username = fields.Str(
        required=True,
        validate=validate.Length(
            min=3,
            max=50,
            error="Username must be between 3 and 50 characters."
        ),
        error_messages={
            "required": "Username is required."
        }
    )

    password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(
            min=6,
            max=10,
            error="Password must be between 6 and 10 characters."
        ),
        error_messages={
            "required": "Password is required."
        }
    )

    @validates("username")
    def validate_username(self, value, **kwargs):
        if " " in value:
            raise ValidationError("Username cannot contain spaces.")

    @validates("password")
    def validate_password(self, value, **kwargs):
        if " " in value:
            raise ValidationError("Password cannot contain spaces.")


if __name__ == "__main__":
    from flask import jsonify
    schema = RequestLoginSchema()
    result = schema.load({"username": "admin", "password": "admin@123"})
    print(schema.dump(result))