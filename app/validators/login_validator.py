from marshmallow import Schema, fields, validate, ValidationError, validates


class RequestLoginSchema(Schema):

    email = fields.Email(
        required=True,
        error_messages={
            "required": "Email is required.",
            "invalid": "Email format is invalid."
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


    @validates("password")
    def validate_password(self, value, **kwargs):
        if " " in value:
            raise ValidationError("Password cannot contain spaces.")


if __name__ == "__main__":
    from flask import jsonify
    schema = RequestLoginSchema()
    result = schema.load({"email": "admin@example.com", "password": "admin@123"})
    print(schema.dump(result))