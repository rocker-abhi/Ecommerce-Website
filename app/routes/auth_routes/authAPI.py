from flask import request, make_response
from app.utils.logger import configure_logger
import logging
from app.routes.auth_routes.validators.login_validator import  RequestLoginSchema
from flask import current_app
from app.utils.jwt_utility import JwtHelper

logger = logging.getLogger(__name__)

def login():
    try:
        data = request.get_json()
        schema = RequestLoginSchema()
        schema.load(data)
        from uuid import uuid4
        random = str(uuid4())
        print(JwtHelper.create_access_token(random))
        
        if current_app.config["current_env"] == "development":
            logging.info(f"Received login request with data: {schema.dump(data)}")
        response = make_response("data successfully received", 200)
        return response
    except Exception as e :
        logger.error(e)
        return make_response("An error occurred while processing the request", 500)