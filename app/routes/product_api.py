from flask import g, jsonify, make_response, request
from flask.views import MethodView

from app.middleware.jwt_middleware import jwt_required
from app.middleware.permission_check_middleware import permission_requried
from app.services.product_service import ProductService
from app.validators.product_validator import ProductRequestSchema, ProductResponseSchema

product_service = ProductService()


class ProductView(MethodView):
    @jwt_required
    @permission_requried("product:create")
    def post(self):
        req_schema = ProductRequestSchema()
        data = req_schema.load(request.get_json())
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

        response_schema = ProductResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Product listed successfully",
            "data": product_data,
        })
        return make_response(jsonify(response_payload))

    @jwt_required
    @permission_requried("product:delete")
    def delete(self, product_id):
        product_service.delete_product(product_id)
        response_payload = {
            "success": True,
            "message": "Product deleted successfully",
        }
        return make_response(jsonify(response_payload))

    @jwt_required
    @permission_requried("product:update")
    def put(self, product_id):
        req_schema = ProductRequestSchema()
        data = req_schema.load(request.get_json())
        image_url = data.get("image_url")

        saved_image_url = image_url
        if image_url and image_url.startswith("data:"):
            try:
                import base64
                import io

                from werkzeug.datastructures import FileStorage

                from app.models.product import ProductModel
                from app.utils.fileHandling.local_fs_operation import FileHandler

                header, base64_data = image_url.split(",", 1)
                mime_type = header.split(";")[0].split(":")[1]
                extension = mime_type.split("/")[1]

                if "jpeg" in extension:
                    extension = "jpg"

                file_bytes = base64.b64decode(base64_data)

                # Check if this base64 data matches the existing image file
                is_same_image = False
                product = g.db.query(ProductModel).filter(ProductModel.id == product_id).first()
                old_relative_path = None
                if product and product.image_url and product.image_url.startswith("/uploads/"):
                    old_relative_path = product.image_url.replace("/uploads/", "")
                    if FileHandler.file_exists(old_relative_path):
                        try:
                            old_abs_path = FileHandler.get_file_path(old_relative_path)
                            with open(old_abs_path, "rb") as f:
                                old_file_bytes = f.read()
                            if old_file_bytes == file_bytes:
                                is_same_image = True
                        except Exception:
                            pass

                if is_same_image:
                    saved_image_url = product.image_url
                else:
                    # Save new image file
                    file_stream = io.BytesIO(file_bytes)
                    file_storage = FileStorage(
                        stream=file_stream,
                        filename=f"upload.{extension}",
                        content_type=mime_type,
                    )

                    relative_path = FileHandler.save_file(file_storage, "product")
                    saved_image_url = f"/uploads/{relative_path}"

                    # Delete the old image file if it exists and a new one was uploaded
                    if old_relative_path:
                        FileHandler.delete_file(old_relative_path)
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

        response_schema = ProductResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Product updated successfully",
            "data": product_data,
        })
        return make_response(jsonify(response_payload))

    def get(self, product_id):
        from app.models.product import ProductModel
        product = g.db.query(ProductModel).filter(ProductModel.id == product_id).first()
        if not product:
            return make_response(jsonify({"success": False, "message": "Product not found"}), 404)

        reviews_data = []
        total_rating = 0
        rating_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

        for r in product.reviews:
            total_rating += r.rating
            if r.rating in rating_counts:
                rating_counts[r.rating] += 1

            reviews_data.append({
                "id": str(r.id),
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "user_name": r.user.name if r.user else "Anonymous User",
                "user_profile_pic": r.user.profile_picture_url if r.user else None
            })

        review_count = len(product.reviews)
        average_rating = round(total_rating / review_count, 1) if review_count > 0 else 5.0

        rating_distribution = {}
        for stars in range(1, 6):
            rating_distribution[stars] = round((rating_counts[stars] / review_count) * 100, 1) if review_count > 0 else 0.0

        serialized = {
            "id": str(product.id),
            "name": product.name,
            "description": product.description,
            "price": float(product.price),
            "image_url": product_service.product_repository._convert_to_base64(product.image_url),
            "category": product.category.name if product.category else None,
            "subcategory": product.subcategory.name if product.subcategory else None,
            "sku": product.sku,
            "stock": product.stock,
            "seller": {
                "name": product.seller.name if product.seller else "Unknown Seller",
                "email": product.seller.email if product.seller else "Unknown Email"
            },
            "reviews": reviews_data,
            "average_rating": average_rating,
            "review_count": review_count,
            "rating_distribution": rating_distribution
        }

        return make_response(jsonify({
            "success": True,
            "message": "Product details retrieved successfully",
            "data": serialized
        }))


class ReviewView(MethodView):
    @jwt_required
    def post(self, product_id):
        from app.models.product import ProductModel
        from app.models.review import ReviewModel

        product = g.db.query(ProductModel).filter(ProductModel.id == product_id).first()
        if not product:
            return make_response(jsonify({"success": False, "message": "Product not found"}), 404)

        data = request.get_json() or {}
        rating = data.get("rating")
        comment = data.get("comment")

        if rating is None:
            return make_response(jsonify({"success": False, "message": "Rating is required"}), 400)

        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError()
        except ValueError:
            return make_response(jsonify({"success": False, "message": "Rating must be an integer between 1 and 5"}), 400)

        review = ReviewModel(
            user_id=g.user_id,
            product_id=product.id,
            rating=rating,
            comment=comment
        )
        g.db.add(review)
        g.db.commit()

        return make_response(jsonify({
            "success": True,
            "message": "Review submitted successfully"
        }), 201)

