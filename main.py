# importing libraries
from flask import Flask
import dotenv
from app.utils.logger import configure_logger

app = Flask(__name__) # create flask app
configure_logger("INFO")

current_dev_environment = "development" # setting the current development environment

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

if __name__ == '__main__':
    current_env_config = get_config(current_dev_environment) # getting the configuration of the current environment

    if current_dev_environment == 'development':
        # if environment is development then show all the configuration values in the console
        print(current_env_config.HOST)
        print(current_env_config.PORT)
        print(current_env_config.DEBUG)

    app.run(debug=current_env_config.DEBUG, host=current_env_config.HOST, port=current_env_config.PORT)
