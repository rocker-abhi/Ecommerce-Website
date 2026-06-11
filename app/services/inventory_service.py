import base64
import os

from app.repository.inventory_repository import InventoryRepository
from app.utils.fileHandling.local_fs_operation import FileHandler


class InventoryService:
    def __init__(self):
        self.inventory_repository = InventoryRepository()

    def get_seller_dashboard_data(self, user_id):
        inventory_data = (
            self.inventory_repository.get_inventory_corresponsding_to_userid(user_id)
        )

        for item in inventory_data:
            product = item.get("product")
            if product and product.get("image_url"):
                image_url = product["image_url"]
                if image_url.startswith("/uploads/"):
                    try:
                        relative_path = image_url.replace("/uploads/", "")
                        abs_path = FileHandler.get_file_path(relative_path)

                        if os.path.exists(abs_path):
                            ext = abs_path.split(".")[-1].lower()
                            mime_type = f"image/{ext}"
                            if ext in ("jpg", "jpeg", "png", "webp"):
                                mime_type = f"image/{ext}"

                            with open(abs_path, "rb") as image_file:
                                encoded_string = base64.b64encode(
                                    image_file.read()
                                ).decode("utf-8")
                                product["image_url"] = (
                                    f"data:{mime_type};base64,{encoded_string}"
                                )
                    except Exception:
                        pass

        return inventory_data
