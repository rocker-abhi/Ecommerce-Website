import uuid
from decimal import Decimal
from flask import g, jsonify, make_response, request
from flask.views import MethodView
from sqlalchemy.orm import joinedload
from sqlalchemy.orm.attributes import flag_modified
from app.middleware.jwt_middleware import jwt_required
from app.models.cart import CartModel
from app.models.payment import PaymentModel
from app.models.product import ProductModel
from app.models.order import OrderModel
from app.models.order_item import OrderItemModel
from app.models.enums.database_enums import OrderStatus, PaymentStatus
from app.validators.order_validator import OrderHistoryResponseSchema, OrderCreateResponseSchema

class OrderAPI(MethodView):
    @jwt_required
    def get(self):
        """Return order history for the authenticated user."""
        user_id = g.user_id
        orders = (
            g.db.query(OrderModel)
            .options(
                joinedload(OrderModel.order_items).joinedload(OrderItemModel.product),
                joinedload(OrderModel.payments),
            )
            .filter(OrderModel.user_id == user_id)
            .order_by(OrderModel.created_at.desc())
            .all()
        )

        result = []
        for order in orders:
            # Collect items
            items = []
            for oi in order.order_items:
                product = oi.product
                items.append({
                    "product_id": str(oi.product_id) if oi.product_id else None,
                    "product_name": product.name if product else "Deleted Product",
                    "product_image": product.image_url if product else None,
                    "quantity": oi.quantity,
                    "unit_price": float(oi.price),
                    "subtotal": float(oi.price) * oi.quantity,
                })

            # Latest payment record
            payment = order.payments[0] if order.payments else None

            result.append({
                "id": str(order.id),
                "status": order.status.value,
                "total_amount": float(order.total_amount),
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "items": items,
                "payment": {
                    "status": payment.status.value if payment else None,
                    "method": payment.payment_method if payment else None,
                    "transaction_id": payment.transaction_id if payment else None,
                } if payment else None,
            })

        response_schema = OrderHistoryResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Order history retrieved",
            "data": result,
        })
        return make_response(jsonify(response_payload), 200)

    @jwt_required
    def post(self):
        from app.validators.order_validator import OrderCreateSchema
        user_id = g.user_id
        schema = OrderCreateSchema()
        body = schema.load(request.get_json() or {})
        address_id = body.get("address_id")
        payment_method = body.get("payment_method", "COD")

            
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
                
            product = g.db.query(ProductModel).filter(ProductModel.id == product_id).with_for_update().first()
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
            status=OrderStatus.PAID
        )
        
        g.db.add(order)
        g.db.flush()  # Generate order id
        
        # Link order items to order
        for order_item in order_items_to_create:
            order_item.order_id = order.id
            g.db.add(order_item)
            
        # 4. Record payment as SUCCESS
        payment = PaymentModel(
            order_id=order.id,
            amount=total_amount,
            payment_method=payment_method,
            status=PaymentStatus.SUCCESS,
            transaction_id=f"TXN-{uuid.uuid4().hex[:16].upper()}"
        )
        g.db.add(payment)
 
        # 5. Clear User's Cart
        cart.items = []
        flag_modified(cart, "items")
        g.db.add(cart)
        
        # Commit transaction
        g.db.commit()
        
        response_schema = OrderCreateResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Order placed successfully",
            "data": {
                "id": str(order.id),
                "total_amount": float(order.total_amount),
                "status": order.status.value,
                "payment_status": payment.status.value,
                "transaction_id": payment.transaction_id
            }
        })
        return make_response(jsonify(response_payload), 201)

