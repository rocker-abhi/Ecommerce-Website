from marshmallow import Schema, fields


class RequestLogoutSchema(Schema):
    user_id = fields.Str(required=True, allow_none=False)
    access_token = fields.Str(required=False, allow_none=True)


class ResponseLogoutSchema(Schema):
    success = fields.Boolean(required=True, allow_none=False)
    message = fields.Str(required=True, allow_none=False)
    data = fields.Dict()
