from marshmallow import Schema, fields
from app.validators.create_user_validator import AddressSchema


class RequestMeSchema(Schema):
    # The request is expected to contain no data in the body
    pass


class MeUserDataSchema(Schema):
    id = fields.UUID(required=True)
    name = fields.Str(required=True)
    age = fields.Int(required=True)
    email = fields.Email(required=True)
    profile_picture_url = fields.Str(required=False, allow_none=True)
    userType = fields.Function(lambda obj: obj.userType.value if hasattr(obj.userType, 'value') else obj.userType)
    address = fields.Nested(AddressSchema, required=True)


class ResponseMeSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
    data = fields.Nested(MeUserDataSchema, required=True)
