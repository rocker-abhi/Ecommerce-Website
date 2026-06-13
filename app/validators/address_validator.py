from marshmallow import Schema, fields, validate


class AddressCreateSchema(Schema):
    address_line_1 = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=255, error="Address Line 1 must be between 1 and 255 characters."),
        error_messages={"required": "Address Line 1 is required."},
    )
    address_line_2 = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=255, error="Address Line 2 cannot exceed 255 characters."),
    )
    city = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=100, error="City must be between 1 and 100 characters."),
        error_messages={"required": "City is required."},
    )
    state = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=100, error="State must be between 1 and 100 characters."),
        error_messages={"required": "State is required."},
    )
    zip_code = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=20, error="Zip code must be between 1 and 20 characters."),
        error_messages={"required": "Zip code is required."},
    )
    country = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=100, error="Country must be between 1 and 100 characters."),
        error_messages={"required": "Country is required."},
    )


class AddressUpdateSchema(Schema):
    address_line_1 = fields.Str(
        required=False,
        validate=validate.Length(min=1, max=255, error="Address Line 1 must be between 1 and 255 characters."),
    )
    address_line_2 = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=255, error="Address Line 2 cannot exceed 255 characters."),
    )
    city = fields.Str(
        required=False,
        validate=validate.Length(min=1, max=100, error="City must be between 1 and 100 characters."),
    )
    state = fields.Str(
        required=False,
        validate=validate.Length(min=1, max=100, error="State must be between 1 and 100 characters."),
    )
    zip_code = fields.Str(
        required=False,
        validate=validate.Length(min=1, max=20, error="Zip code must be between 1 and 20 characters."),
    )
    country = fields.Str(
        required=False,
        validate=validate.Length(min=1, max=100, error="Country must be between 1 and 100 characters."),
    )


class AddressDetailResponseSchema(Schema):
    id = fields.Str(required=True)
    address_line_1 = fields.Str(required=True)
    address_line_2 = fields.Str(required=False, allow_none=True)
    city = fields.Str(required=True)
    state = fields.Str(required=True)
    zip_code = fields.Str(required=True)
    country = fields.Str(required=True)
    is_active = fields.Boolean(required=True)


class AddressResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.Nested(AddressDetailResponseSchema, required=True)


class AddressListResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.List(fields.Nested(AddressDetailResponseSchema), required=True)


class AddressDeleteResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)


