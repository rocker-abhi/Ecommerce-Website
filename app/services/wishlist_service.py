from app.repository.wishlist_repository import WishlistRepository

class WishlistService:
    def __init__(self):
        self.wishlist_repository = WishlistRepository()

    def get_wishlist_details(self, user_id):
        return self.wishlist_repository.get_wishlist_details(user_id)

    def add_item(self, user_id, product_id):
        return self.wishlist_repository.add_item(user_id, product_id)

    def remove_item(self, user_id, product_id):
        return self.wishlist_repository.remove_item(user_id, product_id)
