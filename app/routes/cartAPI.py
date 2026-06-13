from flask import g, jsonify, make_response, request, Blueprint
from flask.views import MethodView
from app.middleware.jwt_middleware import jwt_required
from app.services.cart_service import CartService
from app.validators.cart_validator import CartResponseSchema

cart_service = CartService()

class CartView(MethodView):
    @jwt_required
    def get(self):
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
    def post(self, product_id):
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
    def put(self, product_id):
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
    def delete(self, product_id):
        user_id = g.user_id
        cart_data = cart_service.remove_item(user_id, product_id)
        response_schema = CartResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Product removed from cart successfully",
            "data": cart_data
        })
        return make_response(jsonify(response_payload))

