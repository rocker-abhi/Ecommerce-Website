from flask import Blueprint

from app.routes.authAPI import auth_me, create_user, login, logout, refresh_token
from app.routes.dashboardApi import SellerDashboard
from app.routes.product_api import ProductView

# creating Blueprint for the current File
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")
product_bp = Blueprint("product", __name__, url_prefix="/product")

# Registering Blueprint to the current Blueprint
auth_bp.add_url_rule("/login", view_func=login, methods=["POST"])
auth_bp.add_url_rule("/register", view_func=create_user, methods=["POST"])

# adding token authentication
auth_bp.add_url_rule("/logout", view_func=logout, methods=["POST"])
auth_bp.add_url_rule("/refresh", view_func=refresh_token, methods=["POST"])
auth_bp.add_url_rule("/me", view_func=auth_me, methods=["GET"])


# adding dashboard route
dashboard_bp.add_url_rule(
    "/seller", view_func=SellerDashboard.as_view("seller_dashboard"), methods=["GET"]
)


# adding product route
product_bp.add_url_rule(
    "",
    view_func=ProductView.as_view("add_product"),
    methods=["POST"],
)
