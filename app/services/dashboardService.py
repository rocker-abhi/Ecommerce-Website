from flask import g
from sqlalchemy import func
from app.models.user import UserModel
from app.models.product import ProductModel
from app.models.order import OrderModel
from app.models.inventory import InventoryModel


class DashboardService:
    def get_dashboard_metrics(self):
        # 1. Total counts
        total_products = g.db.query(ProductModel).count()
        total_users = g.db.query(UserModel).count()
        total_orders = g.db.query(OrderModel).count()

        # 2. Total revenue (sum of total_amount of all orders)
        revenue_result = g.db.query(func.sum(OrderModel.total_amount)).scalar()
        total_revenue = float(revenue_result) if revenue_result is not None else 0.0

        # 3. Recent orders (latest 5 orders)
        recent_orders_query = (
            g.db.query(OrderModel)
            .order_by(OrderModel.created_at.desc())
            .limit(5)
            .all()
        )
        recent_orders = []
        for order in recent_orders_query:
            recent_orders.append({
                "id": str(order.id),
                "user_email": order.user.email if order.user else "Deleted User",
                "total_amount": float(order.total_amount),
                "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
                "created_at": order.created_at.isoformat() if order.created_at else None
            })

        # 4. Low stock products (inventory count < 10 or missing)
        low_stock_query = (
            g.db.query(ProductModel)
            .outerjoin(InventoryModel)
            .filter((InventoryModel.id.is_(None)) | (InventoryModel.quantity < 10))
            .limit(10)
            .all()
        )
        low_stock_products = []
        for product in low_stock_query:
            low_stock_products.append({
                "id": str(product.id),
                "name": product.name,
                "price": float(product.price),
                "quantity": product.inventory.quantity if product.inventory else 0,
                "sku": product.inventory.sku if product.inventory else "N/A"
            })

        return {
            "total_products": total_products,
            "total_users": total_users,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "recent_orders": recent_orders,
            "low_stock_products": low_stock_products
        }
