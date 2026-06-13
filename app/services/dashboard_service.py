from app.repository.product_repository import ProductRepository


class DashboardService:
    def __init__(self):
        self.product_repository = ProductRepository()

    def get_seller_dashboard_data(self, user_id):
        product_data = (
            self.product_repository.get_products_by_seller_id(user_id)
        )
        return product_data
