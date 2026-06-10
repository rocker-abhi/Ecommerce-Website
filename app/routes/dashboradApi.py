from flask import jsonify, make_response
from app.middleware.jwt_middleware import jwt_required
from app.middleware.permission_check_middleware import permission_requried
from app.services.dashboardService import DashboardService

dashboard_service = DashboardService()


@jwt_required
@permission_requried("dashboard:view")
def get_dashboard():
    metrics = dashboard_service.get_dashboard_metrics()
    response_payload = {
        "success": True,
        "message": "Dashboard metrics retrieved successfully",
        "data": metrics
    }
    return make_response(jsonify(response_payload))
