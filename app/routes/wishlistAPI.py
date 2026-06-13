from flask import g, jsonify, make_response, request
from flask.views import MethodView
from app.middleware.jwt_middleware import jwt_required
from app.services.wishlist_service import WishlistService
from app.validators.wishlist_validator import WishlistResponseSchema

wishlist_service = WishlistService()

class WishlistView(MethodView):
    @jwt_required
    def get(self):
        user_id = g.user_id
        wishlist_data = wishlist_service.get_wishlist_details(user_id)
        response_schema = WishlistResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Wishlist retrieved successfully",
            "data": wishlist_data
        })
        return make_response(jsonify(response_payload))

    @jwt_required
    def post(self, product_id):
        user_id = g.user_id
        wishlist_data = wishlist_service.add_item(user_id, product_id)
        response_schema = WishlistResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Product added to wishlist successfully",
            "data": wishlist_data
        })
        return make_response(jsonify(response_payload))

    @jwt_required
    def delete(self, product_id):
        user_id = g.user_id
        wishlist_data = wishlist_service.remove_item(user_id, product_id)
        response_schema = WishlistResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Product removed from wishlist successfully",
            "data": wishlist_data
        })
        return make_response(jsonify(response_payload))

