from flask import g
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.models.inventory import InventoryModel
from app.models.product import ProductModel


class InventoryRepository:
    def get_inventory_corresponsding_to_userid(self, userId):
        stmt = (
            select(InventoryModel)
            .options(
                joinedload(InventoryModel.product).joinedload(ProductModel.category),
                joinedload(InventoryModel.product).joinedload(ProductModel.subcategory)
            )
            .where(InventoryModel.user_id == userId)
        )
        results = g.db.execute(stmt).scalars().all()

        serialized = []
        for inv in results:
            serialized.append(
                {
                    "id": str(inv.id),
                    "quantity": inv.quantity,
                    "sku": inv.sku,
                    "product": {
                        "id": str(inv.product.id) if inv.product else None,
                        "name": inv.product.name if inv.product else None,
                        "description": inv.product.description if inv.product else None,
                        "price": float(inv.product.price) if inv.product else 0.0,
                        "image_url": inv.product.image_url if inv.product else None,
                        "category": inv.product.category.name
                        if inv.product and inv.product.category
                        else None,
                        "subcategory": inv.product.subcategory.name
                        if inv.product and inv.product.subcategory
                        else None,
                    },
                }
            )
        return serialized
