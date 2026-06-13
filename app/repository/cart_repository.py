from flask import g
from sqlalchemy.orm.attributes import flag_modified
from app.models.cart import CartModel
from app.models.product import ProductModel

class CartRepository:
    def get_or_create_cart(self, user_id):
        cart = g.db.query(CartModel).filter(CartModel.user_id == user_id).first()
        if not cart:
            cart = CartModel(user_id=user_id, items=[])
            g.db.add(cart)
            g.db.flush()
            g.db.commit()
        return cart

    def get_cart_details(self, user_id):
        cart = self.get_or_create_cart(user_id)
        
        detailed_items = []
        # Ensure items is a list
        items_list = cart.items if isinstance(cart.items, list) else []
        
        for item in items_list:
            product_id = item.get("product_id")
            quantity = item.get("quantity", 1)
            if not product_id:
                continue
            
            product = g.db.query(ProductModel).filter(ProductModel.id == product_id).first()
            if product:
                detailed_items.append({
                    "product": {
                        "id": str(product.id),
                        "name": product.name,
                        "price": float(product.price),
                        "description": product.description,
                        "image_url": product.image_url,
                        "sku": product.sku,
                        "stock": product.stock
                    },
                    "quantity": quantity
                })
        
        return {
            "id": str(cart.id),
            "user_id": str(cart.user_id),
            "items": detailed_items
        }

    def add_item(self, user_id, product_id, quantity=1):
        cart = self.get_or_create_cart(user_id)
        
        items = list(cart.items) if isinstance(cart.items, list) else []
        
        found = False
        for item in items:
            if item.get("product_id") == str(product_id):
                item["quantity"] = item.get("quantity", 0) + quantity
                found = True
                break
        
        if not found:
            items.append({
                "product_id": str(product_id),
                "quantity": quantity
            })
            
        cart.items = items
        flag_modified(cart, "items")
        g.db.add(cart)
        g.db.commit()
        return self.get_cart_details(user_id)

    def update_item_quantity(self, user_id, product_id, quantity):
        cart = self.get_or_create_cart(user_id)
        
        items = list(cart.items) if isinstance(cart.items, list) else []
        
        if quantity <= 0:
            items = [item for item in items if item.get("product_id") != str(product_id)]
        else:
            found = False
            for item in items:
                if item.get("product_id") == str(product_id):
                    item["quantity"] = quantity
                    found = True
                    break
            if not found:
                items.append({
                    "product_id": str(product_id),
                    "quantity": quantity
                })
                
        cart.items = items
        flag_modified(cart, "items")
        g.db.add(cart)
        g.db.commit()
        return self.get_cart_details(user_id)

    def remove_item(self, user_id, product_id):
        cart = self.get_or_create_cart(user_id)
        
        items = list(cart.items) if isinstance(cart.items, list) else []
        items = [item for item in items if item.get("product_id") != str(product_id)]
        
        cart.items = items
        flag_modified(cart, "items")
        g.db.add(cart)
        g.db.commit()
        return self.get_cart_details(user_id)
