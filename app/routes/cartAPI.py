"""
Cart API Endpoints.

Handles retrieval, addition, modification, and deletion of shopping cart items.
All routes in this module require JWT authentication and are rate-limited to 3 requests per second.
"""

from flask import g, jsonify, make_response, request, Blueprint
from flask.views import MethodView
from app.middleware.jwt_middleware import jwt_required
from app.services.cart_service import CartService
from app.validators.cart_validator import CartResponseSchema
from app.utils.limiter import limiter

# Instantiate global Cart service handler
cart_service = CartService()

# Define the cart blueprint
cart_bp = Blueprint("cart", __name__, url_prefix="/cart")

class CartView(MethodView):
    """
    Class-based view for handling user cart resources.
    Allows fetching details, adding items, updating quantities, and removing items.
    All endpoints are secured by JWT token and rate-limited.
    """

    @jwt_required
    @limiter.limit("3 per second")
    def get(self):
        """Retrieve current user's cart details along with serialized items."""
        user_id = g.user_id
        cart_data = cart_service.get_cart_details(user_id)
        response_schema = CartResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Cart retrieved successfully",
            "data": cart_data
        })
        return make_response(jsonify(response_payload))

    @jwt_required
    @limiter.limit("3 per second")
    def post(self, product_id):
        """Add a specified product to the user's cart with validated quantity."""
        from app.validators.cart_validator import CartAddSchema
        user_id = g.user_id
        schema = CartAddSchema()
        data = schema.load(request.get_json() or {})
        quantity = data.get("quantity", 1)
        
        cart_data = cart_service.add_item(user_id, product_id, quantity)
        response_schema = CartResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Product added to cart successfully",
            "data": cart_data
        })
        return make_response(jsonify(response_payload))

    @jwt_required
    @limiter.limit("3 per second")
    def put(self, product_id):
        """Modify the quantity of a specific product already present in the cart."""
        from app.validators.cart_validator import CartUpdateSchema
        user_id = g.user_id
        schema = CartUpdateSchema()
        data = schema.load(request.get_json() or {})
        quantity = data.get("quantity")
            
        cart_data = cart_service.update_item_quantity(user_id, product_id, quantity)
        response_schema = CartResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Cart item quantity updated successfully",
            "data": cart_data
        })
        return make_response(jsonify(response_payload))

    @jwt_required
    @limiter.limit("3 per second")
    def delete(self, product_id):
        """Remove a product completely from the user's shopping cart."""
        user_id = g.user_id
        cart_data = cart_service.remove_item(user_id, product_id)
        response_schema = CartResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Product removed from cart successfully",
            "data": cart_data
        })
        return make_response(jsonify(response_payload))

# Registering View to the Blueprint
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
