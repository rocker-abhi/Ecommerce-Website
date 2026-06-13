# importing libraries
from flask import Flask, g
import dotenv
from app.utils.logger import configure_logger
from app.routes import auth_bp, dashboard_bp, product_bp, cart_bp, wishlist_bp, address_bp, order_bp
from app.utils.jwt_utility import JwtHelper
from app.utils.request_hooks import register_request_hook
from app.exceptions.global_exception_handler import register_exception_handlers

app = Flask(__name__) # create flask app
register_request_hook(app)
configure_logger("INFO")
register_exception_handlers(app)


app.config['current_env'] = "development"
dotenv.load_dotenv(".env.dev")

from app.config import get_config
from app.utils.database import DatabaseHelper


@app.route("/uploads/<path:filename>")
def serve_uploaded_file(filename):
    from flask import send_from_directory

    return send_from_directory("uploads", filename)


if __name__ == "__main__":
    current_env_config = get_config() # getting the configuration of the current environment

    # Initialize shared database instance (called once at startup)
    DatabaseHelper.init_database(current_env_config.DATABASE_URI)
    JwtHelper.load_jwt_secret(current_env_config.JWT_SECRET)  # Load JWT secret key at startup

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(wishlist_bp)
    app.register_blueprint(address_bp)
    app.register_blueprint(order_bp)

    if app.config.get('current_env') == 'development':
        # if environment is development then show all the configuration values in the console
        print(current_env_config.HOST)
        print(current_env_config.PORT)
        print(current_env_config.DEBUG)

    app.run(debug=current_env_config.DEBUG, host=current_env_config.HOST, port=current_env_config.PORT)
