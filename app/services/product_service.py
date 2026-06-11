from app.repository.product_repository import ProductRepository


class ProductService:
    def __init__(self):
        self.product_repository = ProductRepository()

    def create_product_and_inventory(
        self, user_id, name, price, description, image_url, category_name, subcategory_name
    ):
        return self.product_repository.create_product_and_inventory(
            user_id=user_id,
            name=name,
            price=price,
            description=description,
            image_url=image_url,
            category_name=category_name,
            subcategory_name=subcategory_name
        )
