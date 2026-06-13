import uuid
from flask import g
from app.models.wishlist import WishlistModel
from app.models.wishlist_item import WishlistItemModel
from app.models.product import ProductModel

class WishlistRepository:
    def get_or_create_wishlist(self, user_id):
        wishlist = g.db.query(WishlistModel).filter(WishlistModel.user_id == user_id).first()
        if not wishlist:
            wishlist = WishlistModel(user_id=user_id)
            g.db.add(wishlist)
            g.db.flush()
            g.db.commit()
        return wishlist

    def get_wishlist_details(self, user_id):
        wishlist = self.get_or_create_wishlist(user_id)
        
        detailed_items = []
        for item in wishlist.wishlist_items:
            product = item.product
            if product:
                detailed_items.append({
                    "id": str(product.id),
                    "name": product.name,
                    "price": float(product.price),
                    "description": product.description,
                    "image_url": product.image_url,
                    "sku": product.sku,
                    "stock": product.stock
                })
        
        return {
            "id": str(wishlist.id),
            "user_id": str(wishlist.user_id),
            "items": detailed_items
        }

    def add_item(self, user_id, product_id):
        wishlist = self.get_or_create_wishlist(user_id)
        
        # Check if item already in wishlist
        existing_item = g.db.query(WishlistItemModel).filter(
            WishlistItemModel.wishlist_id == wishlist.id,
            WishlistItemModel.product_id == product_id
        ).first()
        
        if not existing_item:
            new_item = WishlistItemModel(wishlist_id=wishlist.id, product_id=product_id)
            g.db.add(new_item)
            g.db.commit()
            
        return self.get_wishlist_details(user_id)

    def remove_item(self, user_id, product_id):
        wishlist = self.get_or_create_wishlist(user_id)
        
        existing_item = g.db.query(WishlistItemModel).filter(
            WishlistItemModel.wishlist_id == wishlist.id,
            WishlistItemModel.product_id == product_id
        ).first()
        
        if existing_item:
            g.db.delete(existing_item)
            g.db.commit()
            
        return self.get_wishlist_details(user_id)
