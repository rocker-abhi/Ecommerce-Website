from flask import g, jsonify, make_response, request, Blueprint
from flask.views import MethodView
from app.middleware.jwt_middleware import jwt_required
from app.services.cart_service import CartService

cart_service = CartService()

class CartView(MethodView):
    @jwt_required
    def get(self):
        user_id = g.user_id
        cart_data = cart_service.get_cart_details(user_id)
        response_payload = {
            "success": True,
            "message": "Cart retrieved successfully",
            "data": cart_data
        }
        return make_response(jsonify(response_payload))

    @jwt_required
    def post(self, product_id):
        user_id = g.user_id
        data = request.get_json() or {}
        quantity = data.get("quantity", 1)
        
        cart_data = cart_service.add_item(user_id, product_id, quantity)
        response_payload = {
            "success": True,
            "message": "Product added to cart successfully",
            "data": cart_data
        }
        return make_response(jsonify(response_payload))

    @jwt_required
    def put(self, product_id):
        user_id = g.user_id
        data = request.get_json() or {}
        quantity = data.get("quantity")
        if quantity is None:
            return make_response(jsonify({
                "success": False,
                "message": "Quantity is required",
                "data": {
                    "error_code": "VALIDATION_ERROR",
                    "errors": {"quantity": ["Field is required."]}
                }
            }), 400)
            
        cart_data = cart_service.update_item_quantity(user_id, product_id, quantity)
        response_payload = {
            "success": True,
            "message": "Cart item quantity updated successfully",
            "data": cart_data
        }
        return make_response(jsonify(response_payload))

    @jwt_required
    def delete(self, product_id):
        user_id = g.user_id
        cart_data = cart_service.remove_item(user_id, product_id)
        response_payload = {
            "success": True,
            "message": "Product removed from cart successfully",
            "data": cart_data
        }
        return make_response(jsonify(response_payload))
