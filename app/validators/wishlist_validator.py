from marshmallow import Schema, fields


class WishlistItemSchema(Schema):
    id = fields.Str(required=True)
    name = fields.Str(required=True)
    price = fields.Float(required=True)
    description = fields.Str(required=False, allow_none=True)
    image_url = fields.Str(required=False, allow_none=True)
    sku = fields.Str(required=False, allow_none=True)
    stock = fields.Int(required=False, allow_none=True)


class WishlistDataSchema(Schema):
    id = fields.Str(required=True)
    user_id = fields.Str(required=True)
    items = fields.List(fields.Nested(WishlistItemSchema), required=True)


class WishlistResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.Nested(WishlistDataSchema, required=True)
