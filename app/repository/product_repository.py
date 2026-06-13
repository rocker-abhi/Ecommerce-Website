import base64
import os
import uuid

from flask import g

from app.models.category import CategoryModel
from app.models.product import ProductModel
from app.models.subcategory import SubCategoryModel
from app.utils.fileHandling.local_fs_operation import FileHandler


class ProductRepository:
    @staticmethod
    def _convert_to_base64(image_url):
        """Helper to convert relative upload path to base64 Data URL."""
        if image_url and image_url.startswith("/uploads/"):
            try:
                relative_path = image_url.replace("/uploads/", "")
                abs_path = FileHandler.get_file_path(relative_path)
                
                if os.path.exists(abs_path):
                    ext = abs_path.split(".")[-1].lower()
                    mime_type = f"image/{ext}"
                    if ext in ("jpg", "jpeg", "png", "webp"):
                        mime_type = f"image/{ext}"
                    
                    with open(abs_path, "rb") as image_file:
                        encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
                        return f"data:{mime_type};base64,{encoded_string}"
            except Exception:
                pass
        return image_url

    def create_product_and_inventory(
        self,
        user_id,
        name,
        price,
        description,
        image_url,
        category_name,
        subcategory_name,
    ):
        # Resolve category
        category = (
            g.db.query(CategoryModel)
            .filter(CategoryModel.name == category_name)
            .first()
        )
        if not category:
            mapped_name = category_name
            if category_name == "Apparel":
                mapped_name = "Clothing"
            elif category_name == "Fitness":
                mapped_name = "Sports & Fitness"
            elif category_name == "Home":
                mapped_name = "Furniture"
            category = (
                g.db.query(CategoryModel)
                .filter(CategoryModel.name == mapped_name)
                .first()
            )

            if not category:
                category = CategoryModel(
                    name=category_name, description=f"Dynamic category {category_name}"
                )
                g.db.add(category)
                g.db.flush()

        # Resolve subcategory
        subcategory = (
            g.db.query(SubCategoryModel)
            .filter(
                SubCategoryModel.name == subcategory_name,
                SubCategoryModel.category_id == category.id,
            )
            .first()
        )
        if not subcategory:
            mapped_sub = subcategory_name
            if subcategory_name == "Men's Wear":
                mapped_sub = "Men"
            elif subcategory_name == "Women's Wear":
                mapped_sub = "Women"
            elif subcategory_name == "Kids' Wear":
                mapped_sub = "Kids"
            subcategory = (
                g.db.query(SubCategoryModel)
                .filter(
                    SubCategoryModel.name == mapped_sub,
                    SubCategoryModel.category_id == category.id,
                )
                .first()
            )

            if not subcategory:
                subcategory = SubCategoryModel(
                    name=subcategory_name,
                    category_id=category.id,
                    description=f"Dynamic subcategory {subcategory_name}",
                )
                g.db.add(subcategory)
                g.db.flush()

        # Generate unique SKU
        sku = f"SKU-{category_name[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"

        # Create product with stock and sku directly
        product = ProductModel(
            name=name,
            price=price,
            description=description,
            image_url=image_url,
            category_id=category.id,
            subcategory_id=subcategory.id,
            user_id=user_id,
            sku=sku,
            stock=50,  # Default stock level
        )
        g.db.add(product)
        g.db.flush()
        g.db.commit()

        return {
            "id": str(product.id),
            "name": product.name,
            "price": float(product.price),
            "description": product.description,
            "image_url": self._convert_to_base64(product.image_url),
            "category": category.name,
            "subcategory": subcategory.name,
            "sku": product.sku,
            "stock": product.stock,
        }

    def delete_product(self, product_id):
        g.db.query(ProductModel).filter(ProductModel.id == product_id).delete()
        g.db.commit()
        return

    def update_product(
        self,
        product_id,
        name,
        price,
        description,
        image_url,
        category_name,
        subcategory_name,
    ):
        product = g.db.query(ProductModel).filter(ProductModel.id == product_id).first()
        if not product:
            raise ValueError("Product not found")

        # Resolve category
        category = (
            g.db.query(CategoryModel)
            .filter(CategoryModel.name == category_name)
            .first()
        )
        if not category:
            mapped_name = category_name
            if category_name == "Apparel":
                mapped_name = "Clothing"
            elif category_name == "Fitness":
                mapped_name = "Sports & Fitness"
            elif category_name == "Home":
                mapped_name = "Furniture"
            category = (
                g.db.query(CategoryModel)
                .filter(CategoryModel.name == mapped_name)
                .first()
            )
            if not category:
                category = CategoryModel(
                    name=category_name, description=f"Dynamic category {category_name}"
                )
                g.db.add(category)
                g.db.flush()

        # Resolve subcategory
        subcategory = (
            g.db.query(SubCategoryModel)
            .filter(
                SubCategoryModel.name == subcategory_name,
                SubCategoryModel.category_id == category.id,
            )
            .first()
        )
        if not subcategory:
            mapped_sub = subcategory_name
            if subcategory_name == "Men's Wear":
                mapped_sub = "Men"
            elif subcategory_name == "Women's Wear":
                mapped_sub = "Women"
            elif subcategory_name == "Kids' Wear":
                mapped_sub = "Kids"
            subcategory = (
                g.db.query(SubCategoryModel)
                .filter(
                    SubCategoryModel.name == mapped_sub,
                    SubCategoryModel.category_id == category.id,
                )
                .first()
            )
            if not subcategory:
                subcategory = SubCategoryModel(
                    name=subcategory_name,
                    category_id=category.id,
                    description=f"Dynamic subcategory {subcategory_name}",
                )
                g.db.add(subcategory)
                g.db.flush()

        # Update product values
        product.name = name
        product.price = price
        product.description = description
        if image_url:
            product.image_url = image_url
        product.category_id = category.id
        product.subcategory_id = subcategory.id

        g.db.commit()
        return {
            "id": str(product.id),
            "name": product.name,
            "price": float(product.price),
            "description": product.description,
            "image_url": self._convert_to_base64(product.image_url),
            "category": category.name,
            "subcategory": subcategory.name,
            "sku": product.sku,
            "stock": product.stock,
        }

    def get_products_by_seller_id(self, user_id):
        """Retrieves products listed by a specific seller, converting local upload images to base64."""
        from sqlalchemy import select
        from sqlalchemy.orm import joinedload
        
        stmt = (
            select(ProductModel)
            .options(
                joinedload(ProductModel.category),
                joinedload(ProductModel.subcategory)
            )
            .where(ProductModel.user_id == user_id)
        )
        results = g.db.execute(stmt).scalars().all()

        serialized = []
        for p in results:
            serialized.append(
                {
                    "id": str(p.id),
                    "name": p.name,
                    "description": p.description,
                    "price": float(p.price),
                    "image_url": self._convert_to_base64(p.image_url),
                    "category": p.category.name if p.category else None,
                    "subcategory": p.subcategory.name if p.subcategory else None,
                    "sku": p.sku,
                    "stock": p.stock,
                }
            )
        return serialized

    def get_all_products_paginated(self, page=1, limit=50):
        """Retrieves all products ordered by created_at descending with pagination, converting local upload images to base64."""
        from sqlalchemy import select, desc, func
        from sqlalchemy.orm import joinedload
        import math

        # Input sanitization
        try:
            page = int(page)
            if page < 1:
                page = 1
        except (ValueError, TypeError):
            page = 1

        try:
            limit = int(limit)
            if limit < 1:
                limit = 50
        except (ValueError, TypeError):
            limit = 50

        offset = (page - 1) * limit

        # Get total product count
        total_stmt = select(func.count(ProductModel.id))
        total_count = g.db.execute(total_stmt).scalar()

        # Query paginated products
        stmt = (
            select(ProductModel)
            .options(
                joinedload(ProductModel.category),
                joinedload(ProductModel.subcategory)
            )
            .order_by(desc(ProductModel.created_at))
            .limit(limit)
            .offset(offset)
        )
        results = g.db.execute(stmt).scalars().all()

        serialized = []
        for p in results:
            serialized.append(
                {
                    "id": str(p.id),
                    "name": p.name,
                    "description": p.description,
                    "price": float(p.price),
                    "image_url": self._convert_to_base64(p.image_url),
                    "category": p.category.name if p.category else None,
                    "subcategory": p.subcategory.name if p.subcategory else None,
                    "sku": p.sku,
                    "stock": p.stock,
                }
            )

        total_pages = math.ceil(total_count / limit) if total_count > 0 else 0

        return {
            "products": serialized,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
