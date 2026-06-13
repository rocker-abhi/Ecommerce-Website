from flask import g, jsonify, make_response, request
from flask.views import MethodView

from app.middleware.jwt_middleware import jwt_required
from app.services.dashboard_service import DashboardService

dashboard_service = DashboardService()


class SellerDashboard(MethodView):
    @jwt_required
    def get(self):
        user_id = g.get("user_id")
        dashboard_data = dashboard_service.get_seller_dashboard_data(user_id)
        response_payload = {
            "success": True,
            "message": "Dashboard metrics retrieved successfully",
            "data": dashboard_data,
        }
        return make_response(jsonify(response_payload))


class HomepageDashboard(MethodView):
    def get(self):
        page = request.args.get("page", 1, type=int)
        limit = request.args.get("limit", 50, type=int)

        products_data = dashboard_service.get_homepage_products(page=page, limit=limit)
        response_payload = {
            "success": True,
            "message": "Homepage products retrieved successfully",
            "data": products_data,
        }
        return make_response(jsonify(response_payload))
