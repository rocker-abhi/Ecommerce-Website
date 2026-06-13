from marshmallow import Schema, fields, validate


class OrderCreateSchema(Schema):
    address_id = fields.UUID(
        required=True,
        error_messages={
            "required": "Address selection is required for checkout.",
            "invalid": "Address ID format is invalid.",
        },
    )
    payment_method = fields.Str(
        required=False,
        load_default="COD",
        validate=validate.OneOf(["COD", "CARD", "UPI", "NETBANKING"], error="Payment method is not supported."),
    )


class OrderItemResponseSchema(Schema):
    product_id = fields.Str(required=False, allow_none=True)
    product_name = fields.Str(required=True)
    product_image = fields.Str(required=False, allow_none=True)
    quantity = fields.Int(required=True)
    unit_price = fields.Float(required=True)
    subtotal = fields.Float(required=True)


class OrderPaymentResponseSchema(Schema):
    status = fields.Str(required=False, allow_none=True)
    method = fields.Str(required=False, allow_none=True)
    transaction_id = fields.Str(required=False, allow_none=True)


class OrderDetailResponseSchema(Schema):
    id = fields.Str(required=True)
    status = fields.Str(required=True)
    total_amount = fields.Float(required=True)
    created_at = fields.Str(required=False, allow_none=True)
    items = fields.List(fields.Nested(OrderItemResponseSchema), required=True)
    payment = fields.Nested(OrderPaymentResponseSchema, required=False, allow_none=True)


class OrderHistoryResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.List(fields.Nested(OrderDetailResponseSchema), required=True)


class OrderCreateDataResponseSchema(Schema):
    id = fields.Str(required=True)
    total_amount = fields.Float(required=True)
    status = fields.Str(required=True)
    payment_status = fields.Str(required=True)
    transaction_id = fields.Str(required=True)


class OrderCreateResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.Nested(OrderCreateDataResponseSchema, required=True)

