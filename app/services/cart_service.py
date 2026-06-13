from app.repository.cart_repository import CartRepository

class CartService:
    def __init__(self):
        self.cart_repository = CartRepository()

    def get_cart_details(self, user_id):
        return self.cart_repository.get_cart_details(user_id)

    def add_item(self, user_id, product_id, quantity=1):
        return self.cart_repository.add_item(user_id, product_id, quantity)

    def update_item_quantity(self, user_id, product_id, quantity):
        return self.cart_repository.update_item_quantity(user_id, product_id, quantity)

    def remove_item(self, user_id, product_id):
        return self.cart_repository.remove_item(user_id, product_id)
