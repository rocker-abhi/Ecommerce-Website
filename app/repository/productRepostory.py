from flask import g

from app.models.product import ProductModel


class ProductRepository:
    def get_inventory_corresponse(userId):
        g.db.query(ProductModel).filter(ProductModel.user_id == userId.all())

    def create_product(self, product: Product):
        g.db.add(product)
        g.db.commit()
        g.db.refresh(product)
        return product

    def get_all_products(self):
        return g.db.query(Product).all()

    def update_product(self, product: Product):
        g.db.commit()
        g.db.refresh(product)
        return product

    def delete_product(self, product: Product):
        g.db.delete(product)
        g.db.commit()
