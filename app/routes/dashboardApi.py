from flask import g, jsonify, make_response
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
