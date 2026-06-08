from flask import Blueprint

from app.routes.authAPI import create_user, login, logout

# creating Blueprint for the current File
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

# Registering Blueprint to the current Blueprint
auth_bp.add_url_rule("/login", view_func=login, methods=["POST"])
auth_bp.add_url_rule("/register", view_func=create_user, methods=["POST"])

# adding token authentication
auth_bp.add_url_rule("/logout", view_func=logout, methods=["POST"])
