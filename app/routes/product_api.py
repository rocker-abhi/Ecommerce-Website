from flask import g, jsonify, make_response, request
from flask.views import MethodView

from app.middleware.jwt_middleware import jwt_required
from app.services.product_service import ProductService

product_service = ProductService()


class ProductView(MethodView):
    @jwt_required
    def post(self):
        data = request.get_json()
        user_id = g.user_id
        image_url = data.get("image_url")

        saved_image_url = image_url
        if image_url and image_url.startswith("data:"):
            try:
                import base64
                import io

                from werkzeug.datastructures import FileStorage

                from app.utils.fileHandling.local_fs_operation import FileHandler

                header, base64_data = image_url.split(",", 1)
                mime_type = header.split(";")[0].split(":")[1]
                extension = mime_type.split("/")[1]

                if "jpeg" in extension:
                    extension = "jpg"

                file_bytes = base64.b64decode(base64_data)
                file_stream = io.BytesIO(file_bytes)
                file_storage = FileStorage(
                    stream=file_stream,
                    filename=f"upload.{extension}",
                    content_type=mime_type,
                )

                relative_path = FileHandler.save_file(file_storage, "product")
                saved_image_url = f"/uploads/{relative_path}"
            except Exception:
                pass

        product_data = product_service.create_product_and_inventory(
            user_id=user_id,
            name=data.get("name"),
            price=data.get("price"),
            description=data.get("description"),
            image_url=saved_image_url,
            category_name=data.get("category"),
            subcategory_name=data.get("subcategory"),
        )

        response_payload = {
            "success": True,
            "message": "Product listed successfully",
            "data": product_data,
        }
        return make_response(jsonify(response_payload))

    @jwt_required
    def delete(self, product_id):
        # Optional: verify the product belongs to this user
        # (Though we can also just call delete_product and count on the repository/service layer)
        product_service.delete_product(product_id)
        response_payload = {
            "success": True,
            "message": "Product deleted successfully",
        }
        return make_response(jsonify(response_payload))

    @jwt_required
    def put(self, product_id):
        data = request.get_json()
        image_url = data.get("image_url")

        saved_image_url = image_url
        if image_url and image_url.startswith("data:"):
            try:
                import base64
                import io

                from werkzeug.datastructures import FileStorage

                from app.utils.fileHandling.local_fs_operation import FileHandler

                header, base64_data = image_url.split(",", 1)
                mime_type = header.split(";")[0].split(":")[1]
                extension = mime_type.split("/")[1]

                if "jpeg" in extension:
                    extension = "jpg"

                file_bytes = base64.b64decode(base64_data)
                file_stream = io.BytesIO(file_bytes)
                file_storage = FileStorage(
                    stream=file_stream,
                    filename=f"upload.{extension}",
                    content_type=mime_type,
                )

                relative_path = FileHandler.save_file(file_storage, "product")
                saved_image_url = f"/uploads/{relative_path}"
            except Exception:
                pass

        product_data = product_service.update_product(
            product_id=product_id,
            name=data.get("name"),
            price=data.get("price"),
            description=data.get("description"),
            image_url=saved_image_url,
            category_name=data.get("category"),
            subcategory_name=data.get("subcategory"),
        )

        response_payload = {
            "success": True,
            "message": "Product updated successfully",
            "data": product_data,
        }
        return make_response(jsonify(response_payload))
