from marshmallow import Schema, fields, validate


class CartAddSchema(Schema):
    quantity = fields.Int(
        required=False,
        load_default=1,
        validate=validate.Range(min=1, max=100, error="Quantity must be between 1 and 100."),
    )


class CartUpdateSchema(Schema):
    quantity = fields.Int(
        required=True,
        validate=validate.Range(min=1, max=100, error="Quantity must be between 1 and 100."),
        error_messages={"required": "Quantity is required."},
    )


class CartProductSchema(Schema):
    id = fields.Str(required=True)
    name = fields.Str(required=True)
    price = fields.Float(required=True)
    description = fields.Str(required=False, allow_none=True)
    image_url = fields.Str(required=False, allow_none=True)
    sku = fields.Str(required=False, allow_none=True)
    stock = fields.Int(required=False, allow_none=True)


class CartItemSchema(Schema):
    product = fields.Nested(CartProductSchema, required=True)
    quantity = fields.Int(required=True)


class CartDataSchema(Schema):
    id = fields.Str(required=True)
    user_id = fields.Str(required=True)
    items = fields.List(fields.Nested(CartItemSchema), required=True)


class CartResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.Nested(CartDataSchema, required=True)

