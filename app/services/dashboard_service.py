from app.repository.product_repository import ProductRepository


class DashboardService:
    def __init__(self):
        self.product_repository = ProductRepository()

    def get_seller_dashboard_data(self, user_id):
        product_data = (
            self.product_repository.get_products_by_seller_id(user_id)
        )
        return product_data

    def get_homepage_products(self, page=1, limit=50, search=""):
        return self.product_repository.get_all_products_paginated(page, limit, search)
