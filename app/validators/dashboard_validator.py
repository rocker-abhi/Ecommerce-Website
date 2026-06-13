from marshmallow import Schema, fields, validate


class HomepageDashboardQuerySchema(Schema):
    page = fields.Int(
        load_default=1,
        validate=validate.Range(min=1, error="Page must be at least 1."),
    )
    limit = fields.Int(
        load_default=50,
        validate=validate.Range(
            min=1, max=100, error="Limit must be between 1 and 100."
        ),
    )
    search = fields.Str(load_default="")


class HomepageDashboardResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.Dict(required=True)


class SellerDashboardResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.List(fields.Dict(), required=True)


class TrendPointSchema(Schema):
    label = fields.Str(required=True)
    value = fields.Float(required=True)


class AdminDashboardDataSchema(Schema):
    total_products = fields.Int(required=True)
    total_users = fields.Int(required=True)
    total_orders = fields.Int(required=True)
    total_revenue = fields.Float(required=True)
    trends = fields.Dict(
        keys=fields.Str(),
        values=fields.List(fields.Nested(TrendPointSchema)),
        required=True
    )


class AdminDashboardResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.Nested(AdminDashboardDataSchema, required=True)

