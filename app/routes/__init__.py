from flask import Blueprint

from app.routes.authAPI import auth_me, create_user, login, logout, refresh_token, update_profile, reset_password
from app.routes.dashboardApi import SellerDashboard, HomepageDashboard
from app.routes.product_api import ProductView, ReviewView
from app.routes.cartAPI import CartView
from app.routes.wishlistAPI import WishlistView
from app.routes.addressAPI import AddressAPI
from app.routes.orderAPI import OrderAPI

# creating Blueprint for the current File
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")
product_bp = Blueprint("product", __name__, url_prefix="/product")
cart_bp = Blueprint("cart", __name__, url_prefix="/cart")
wishlist_bp = Blueprint("wishlist", __name__, url_prefix="/wishlist")
address_bp = Blueprint("address", __name__, url_prefix="/address")
order_bp = Blueprint("order", __name__, url_prefix="/order")

# Registering Blueprint to the current Blueprint
auth_bp.add_url_rule("/login", view_func=login, methods=["POST"])
auth_bp.add_url_rule("/register", view_func=create_user, methods=["POST"])

# adding token authentication
auth_bp.add_url_rule("/logout", view_func=logout, methods=["POST"])
auth_bp.add_url_rule("/refresh", view_func=refresh_token, methods=["POST"])
auth_bp.add_url_rule("/me", view_func=auth_me, methods=["GET"])
auth_bp.add_url_rule("/me", view_func=update_profile, methods=["PUT"])
auth_bp.add_url_rule("/reset-password", view_func=reset_password, methods=["POST"])


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
    view_func=ProductView.as_view("product_detail"),
    methods=["GET", "DELETE", "PUT"],
)
product_bp.add_url_rule(
    "/<uuid:product_id>/review",
    view_func=ReviewView.as_view("add_review"),
    methods=["POST"],
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


# adding address routes
address_bp.add_url_rule(
    "",
    view_func=AddressAPI.as_view("address_list"),
    methods=["GET", "POST"],
)
address_bp.add_url_rule(
    "/<uuid:address_id>",
    view_func=AddressAPI.as_view("address_detail"),
    methods=["GET", "PUT", "DELETE"],
)


# adding order routes
order_bp.add_url_rule(
    "",
    view_func=OrderAPI.as_view("order_create"),
    methods=["POST", "GET"],
)


