import uuid
from flask import g

from app.models.category import CategoryModel
from app.models.inventory import InventoryModel
from app.models.product import ProductModel
from app.models.subcategory import SubCategoryModel


class ProductRepository:
    def create_product_and_inventory(
        self, user_id, name, price, description, image_url, category_name, subcategory_name
    ):
        # Resolve category
        category = g.db.query(CategoryModel).filter(CategoryModel.name == category_name).first()
        if not category:
            mapped_name = category_name
            if category_name == "Apparel":
                mapped_name = "Clothing"
            elif category_name == "Fitness":
                mapped_name = "Sports & Fitness"
            elif category_name == "Home":
                mapped_name = "Furniture"
            category = g.db.query(CategoryModel).filter(CategoryModel.name == mapped_name).first()
            
            if not category:
                category = CategoryModel(
                    name=category_name,
                    description=f"Dynamic category {category_name}"
                )
                g.db.add(category)
                g.db.flush()

        # Resolve subcategory
        subcategory = g.db.query(SubCategoryModel).filter(
            SubCategoryModel.name == subcategory_name,
            SubCategoryModel.category_id == category.id
        ).first()
        if not subcategory:
            mapped_sub = subcategory_name
            if subcategory_name == "Men's Wear":
                mapped_sub = "Men"
            elif subcategory_name == "Women's Wear":
                mapped_sub = "Women"
            elif subcategory_name == "Kids' Wear":
                mapped_sub = "Kids"
            subcategory = g.db.query(SubCategoryModel).filter(
                SubCategoryModel.name == mapped_sub,
                SubCategoryModel.category_id == category.id
            ).first()

            if not subcategory:
                subcategory = SubCategoryModel(
                    name=subcategory_name,
                    category_id=category.id,
                    description=f"Dynamic subcategory {subcategory_name}"
                )
                g.db.add(subcategory)
                g.db.flush()

        # Create product
        product = ProductModel(
            name=name,
            price=price,
            description=description,
            image_url=image_url,
            category_id=category.id,
            subcategory_id=subcategory.id
        )
        g.db.add(product)
        g.db.flush()

        # Generate unique SKU
        sku = f"SKU-{category_name[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"

        # Create inventory
        inventory = InventoryModel(
            product_id=product.id,
            user_id=user_id,
            quantity=50,
            sku=sku
        )
        g.db.add(inventory)
        g.db.flush()

        return {
            "id": str(product.id),
            "name": product.name,
            "price": float(product.price),
            "description": product.description,
            "image_url": product.image_url,
            "category": category.name,
            "subcategory": subcategory.name,
            "sku": inventory.sku,
            "stock": inventory.quantity
        }
