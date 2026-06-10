from flask import Blueprint

from app.routes.authAPI import create_user, login, logout, refresh_token
from app.routes.dashboradApi import get_dashboard

# creating Blueprint for the current File
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")

# Registering Blueprint to the current Blueprint
auth_bp.add_url_rule("/login", view_func=login, methods=["POST"])
auth_bp.add_url_rule("/register", view_func=create_user, methods=["POST"])

# adding token authentication
auth_bp.add_url_rule("/logout", view_func=logout, methods=["POST"])
auth_bp.add_url_rule("/refresh", view_func=refresh_token, methods=["POST"])

# adding dashboard route
dashboard_bp.add_url_rule("/", view_func=get_dashboard, methods=["GET"])
