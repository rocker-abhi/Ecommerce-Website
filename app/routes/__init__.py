"""
Routes package initialization.

Exposes the blueprints defined in the individual route files to the application.
"""

from app.routes.authAPI import auth_bp
from app.routes.dashboardApi import dashboard_bp
from app.routes.product_api import product_bp
from app.routes.cartAPI import cart_bp
from app.routes.wishlistAPI import wishlist_bp
from app.routes.addressAPI import address_bp
from app.routes.orderAPI import order_bp
