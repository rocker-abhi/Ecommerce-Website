from flask import Blueprint

from app.routes.authAPI import auth_me, create_user, login, logout, refresh_token
from app.routes.dashboardApi import SellerDashboard, HomepageDashboard
from app.routes.product_api import ProductView
from app.routes.cartAPI import CartView
from app.routes.wishlistAPI import WishlistView

# creating Blueprint for the current File
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")
product_bp = Blueprint("product", __name__, url_prefix="/product")
cart_bp = Blueprint("cart", __name__, url_prefix="/cart")
wishlist_bp = Blueprint("wishlist", __name__, url_prefix="/wishlist")

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
dashboard_bp.add_url_rule(
    "/", view_func=HomepageDashboard.as_view("homepage_dashboard"), methods=["GET"]
)


# adding product route
product_bp.add_url_rule(
    "",
    view_func=ProductView.as_view("add_product"),
    methods=["POST"],
)
product_bp.add_url_rule(
    "/<uuid:product_id>",
    view_func=ProductView.as_view("delete_product"),
    methods=["DELETE", "PUT"],
)


# adding cart route
cart_bp.add_url_rule(
    "",
    view_func=CartView.as_view("cart_get"),
    methods=["GET"],
)
cart_bp.add_url_rule(
    "/<uuid:product_id>",
    view_func=CartView.as_view("cart_item"),
    methods=["POST", "PUT", "DELETE"],
)


# adding wishlist route
wishlist_bp.add_url_rule(
    "",
    view_func=WishlistView.as_view("wishlist_get"),
    methods=["GET"],
)
wishlist_bp.add_url_rule(
    "/<uuid:product_id>",
    view_func=WishlistView.as_view("wishlist_item"),
    methods=["POST", "DELETE"],
)


