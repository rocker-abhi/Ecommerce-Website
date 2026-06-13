"""
Wishlist API Endpoints.

Handles retrieval, addition, and deletion of user wishlist items.
All endpoints require JWT authentication and are rate-limited to 3 requests per second.
"""

from flask import g, jsonify, make_response, Blueprint
from flask.views import MethodView

from app.middleware.jwt_middleware import jwt_required
from app.services.wishlist_service import WishlistService
from app.utils.limiter import limiter
from app.validators.wishlist_validator import WishlistResponseSchema

wishlist_service = WishlistService()

# Define Wishlist blueprint
wishlist_bp = Blueprint("wishlist", __name__, url_prefix="/wishlist")



class WishlistView(MethodView):
    """
    Class-based view for managing the user's wishlist.
    Provides GET (retrieve), POST (add), and DELETE (remove) operations.
    """
    @jwt_required
    @limiter.limit("3 per second")
    def get(self):
        user_id = g.user_id
        wishlist_data = wishlist_service.get_wishlist_details(user_id)
        response_schema = WishlistResponseSchema()
        response_payload = response_schema.dump(
            {
                "success": True,
                "message": "Wishlist retrieved successfully",
                "data": wishlist_data,
            }
        )
        return make_response(jsonify(response_payload))

    @jwt_required
    @limiter.limit("3 per second")
    def post(self, product_id):
        user_id = g.user_id
        wishlist_data = wishlist_service.add_item(user_id, product_id)
        response_schema = WishlistResponseSchema()
        response_payload = response_schema.dump(
            {
                "success": True,
                "message": "Product added to wishlist successfully",
                "data": wishlist_data,
            }
        )
        return make_response(jsonify(response_payload))

    @jwt_required
    @limiter.limit("3 per second")
    def delete(self, product_id):
        user_id = g.user_id
        wishlist_data = wishlist_service.remove_item(user_id, product_id)
        response_schema = WishlistResponseSchema()
        response_payload = response_schema.dump(
            {
                "success": True,
                "message": "Product removed from wishlist successfully",
                "data": wishlist_data,
            }
        )
        return make_response(jsonify(response_payload))


# Registering View to the Blueprint
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

