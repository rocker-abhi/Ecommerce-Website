from marshmallow import Schema, fields, validate


class ReviewRequestSchema(Schema):
    rating = fields.Int(
        required=True,
        validate=validate.Range(min=1, max=5, error="Rating must be an integer between 1 and 5."),
        error_messages={"required": "Rating is required."},
    )
    comment = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=2000, error="Comment cannot exceed 2000 characters."),
    )


class ReviewResponseSchema(Schema):
    success = fields.Boolean(required=True)
    message = fields.Str(required=True)
