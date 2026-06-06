# importing libraries
from flask import Flask, g
import dotenv
from app.utils.logger import configure_logger
from app.routes import auth_bp
from app.utils.jwt_utility import JwtHelper
from app.utils.request_hooks import register_request_hook

app = Flask(__name__) # create flask app
register_request_hook(app)
configure_logger("INFO")

current_dev_environment = "development" # setting the current development environment
app.config['current_env'] = current_dev_environment

if current_dev_environment == "development":
    # loading development environment
    dotenv.load_dotenv(".env.dev")
elif current_dev_environment == "production":
    # loading production environment
    dotenv.load_dotenv(".env.prod")
elif current_dev_environment == "staging":
    # loading staging environment
    dotenv.load_dotenv(".env.stage")
else:
    raise RuntimeError(f"Unknown environment {current_dev_environment}")

from app.config import get_config
from app.utils.database import DatabaseHelper

if __name__ == '__main__':
    current_env_config = get_config(current_dev_environment) # getting the configuration of the current environment

    # Initialize shared database instance (called once at startup)
    DatabaseHelper.init_database(current_env_config.DATABASE_URI)
    JwtHelper.load_jwt_secret(current_env_config.JWT_SECRET)  # Load JWT secret key at startup

    # Registering Blueprint to the Flask app
    app.register_blueprint(auth_bp)

    if current_dev_environment == 'development':
        # if environment is development then show all the configuration values in the console
        print(current_env_config.HOST)
        print(current_env_config.PORT)
        print(current_env_config.DEBUG)

    app.run(debug=current_env_config.DEBUG, host=current_env_config.HOST, port=current_env_config.PORT)
