from marshmallow import Schema, fields, validate


class ProductRequestSchema(Schema):
    name = fields.Str(
        required=True,
        validate=validate.Length(
            min=1, max=255, error="Name must be between 1 and 255 characters."
        ),
    )
    price = fields.Float(
        required=True,
        validate=validate.Range(min=0.01, error="Price must be a positive number."),
    )
    description = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=1000, error="Description cannot exceed 1000 characters."
        ),
    )
    category = fields.Str(
        required=True,
        validate=validate.Length(min=1, error="Category name is required."),
    )
    subcategory = fields.Str(
        required=True,
        validate=validate.Length(min=1, error="Subcategory name is required."),
    )
    image_url = fields.Str(required=False, allow_none=True)


class ProductResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.Dict(required=True)


class ProductDeleteResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)

