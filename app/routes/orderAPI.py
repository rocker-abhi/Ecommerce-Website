from decimal import Decimal
from flask import g, jsonify, make_response, request
from flask.views import MethodView
from sqlalchemy.orm.attributes import flag_modified
from app.middleware.jwt_middleware import jwt_required
from app.models.cart import CartModel
from app.models.product import ProductModel
from app.models.order import OrderModel
from app.models.order_item import OrderItemModel
from app.models.enums.database_enums import OrderStatus

class OrderAPI(MethodView):
    @jwt_required
    def post(self):
        user_id = g.user_id
        body = request.get_json() or {}
        address_id = body.get("address_id")
        
        if not address_id:
            return make_response(jsonify({
                "success": False,
                "message": "Address selection is required for checkout"
            }), 400)
            
        # 1. Fetch user's cart
        cart = g.db.query(CartModel).filter(CartModel.user_id == user_id).first()
        if not cart or not cart.items:
            return make_response(jsonify({
                "success": False,
                "message": "Cart is empty"
            }), 400)
            
        # 2. Process cart items and calculate total price
        total_amount = Decimal("0.0")
        order_items_to_create = []
        
        for item in cart.items:
            product_id = item.get("product_id")
            quantity = item.get("quantity", 1)
            if not product_id:
                continue
                
            product = g.db.query(ProductModel).filter(ProductModel.id == product_id).first()
            if not product:
                return make_response(jsonify({
                    "success": False,
                    "message": f"Product {product_id} not found"
                }), 400)
                
            if product.stock is not None and product.stock < quantity:
                return make_response(jsonify({
                    "success": False,
                    "message": f"Insufficient stock for product {product.name}"
                }), 400)
                
            item_price = Decimal(str(product.price))
            total_amount += item_price * quantity
            
            # Prepare OrderItem
            order_item = OrderItemModel(
                product_id=product.id,
                quantity=quantity,
                price=item_price
            )
            order_items_to_create.append(order_item)
            
            # Decrement stock
            if product.stock is not None:
                product.stock -= quantity
                g.db.add(product)

        # 3. Create the Order
        order = OrderModel(
            user_id=user_id,
            total_amount=total_amount,
            status=OrderStatus.PENDING
        )
        
        g.db.add(order)
        g.db.flush()  # Generate order id
        
        # Link order items to order
        for order_item in order_items_to_create:
            order_item.order_id = order.id
            g.db.add(order_item)
            
        # 4. Clear User's Cart
        cart.items = []
        flag_modified(cart, "items")
        g.db.add(cart)
        
        # Commit transaction
        g.db.commit()
        
        return make_response(jsonify({
            "success": True,
            "message": "Order placed successfully",
            "data": {
                "id": str(order.id),
                "total_amount": float(order.total_amount),
                "status": order.status.name
            }
        }), 201)
