from marshmallow import Schema, fields


class RequestRefreshTokenSchema(Schema):
    refresh_token = fields.Str(required=True)


class ResponseRefreshTokenSchema(Schema):
    access_token = fields.Str(required=True)
    refresh_token = fields.Str(required=True)
