from app.repository.inventory_repository import InventoryRepository


class DashboardService:
    def __init__(self):
        self.inventory_repository = InventoryRepository()

    def get_seller_dashboard_data(self, user_id):
        inventory_data = (
            self.inventory_repository.get_inventory_corresponsding_to_userid(user_id)
        )
        return inventory_data
