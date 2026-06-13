from flask import g, jsonify, make_response, request
from flask.views import MethodView

from app.middleware.jwt_middleware import jwt_required
from app.middleware.permission_check_middleware import permission_requried
from app.services.dashboard_service import DashboardService
from app.validators.dashboard_validator import (
    HomepageDashboardQuerySchema,
    HomepageDashboardResponseSchema,
    SellerDashboardResponseSchema,
)

dashboard_service = DashboardService()


class SellerDashboard(MethodView):
    @jwt_required
    @permission_requried("dashboard:view")
    def get(self):
        user_id = g.get("user_id")
        dashboard_data = dashboard_service.get_seller_dashboard_data(user_id)
        
        response_schema = SellerDashboardResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Dashboard metrics retrieved successfully",
            "data": dashboard_data,
        })
        return make_response(jsonify(response_payload))


class HomepageDashboard(MethodView):
    def get(self):
        query_schema = HomepageDashboardQuerySchema()
        validated_args = query_schema.load(request.args)
        page = validated_args.get("page")
        limit = validated_args.get("limit")

        products_data = dashboard_service.get_homepage_products(page=page, limit=limit)
        
        response_schema = HomepageDashboardResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Homepage products retrieved successfully",
            "data": products_data,
        })
        return make_response(jsonify(response_payload))
