from flask import request, g, jsonify
import logging
from app.routes.auth_routes.validators.login_validator import RequestLoginSchema
from flask import current_app
from marshmallow import ValidationError

logger = logging.getLogger(__name__)

def login():
    try:
        print(f'request id : {g.request_id}')
        data = request.get_json()
        schema = RequestLoginSchema()
        validated_data = schema.load(data)

        if current_app.config["current_env"] == "development":
            logger.info(f"Received login request with data: {validated_data}")

        return jsonify({"message": "Login successful", "data": validated_data}), 200

    except ValidationError as ve:
        logger.warning(f"Validation error: {ve.messages}")
        return jsonify({"error": "Validation failed", "details": ve.messages}), 400

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "An error occurred while processing the request"}), 500
