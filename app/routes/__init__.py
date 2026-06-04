from flask import Blueprint
from app.routes.auth_routes.authAPI import login

# creating Blueprint for the current File
auth_bp = Blueprint('auth', __name__, url_prefix="/auth")

# Registering Blueprint to the current Blueprint
auth_bp.add_url_rule('/login', view_func=login, methods=['POST'])

