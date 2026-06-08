from marshmallow import Schema, fields


class RequestRefreshTokenSchema(Schema):
    refresh_token = fields.Str(required=True)


class RefreshTokenDataSchema(Schema):
    access_token = fields.Str(required=True)
    refresh_token = fields.Str(required=True)


class ResponseRefreshTokenSchema(Schema):
    success = fields.Boolean(required=True, allow_none=False)
    message = fields.Str(required=True, allow_none=False)
    data = fields.Nested(RefreshTokenDataSchema, required=True)
