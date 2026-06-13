from flask import g, jsonify, make_response, request
from flask.views import MethodView

from app.middleware.jwt_middleware import jwt_required
from app.middleware.permission_check_middleware import permission_requried
from app.services.dashboard_service import DashboardService
from app.validators.dashboard_validator import (
    HomepageDashboardQuerySchema,
    HomepageDashboardResponseSchema,
    SellerDashboardResponseSchema,
    AdminDashboardResponseSchema,
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
    @jwt_required
    def get(self):
        query_schema = HomepageDashboardQuerySchema()
        validated_args = query_schema.load(request.args)
        page = validated_args.get("page")
        limit = validated_args.get("limit")
        search = validated_args.get("search", "")

        products_data = dashboard_service.get_homepage_products(page=page, limit=limit, search=search)
        
        response_schema = HomepageDashboardResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Homepage products retrieved successfully",
            "data": products_data,
        })
        return make_response(jsonify(response_payload))


class AdminDashboard(MethodView):
    @jwt_required
    def get(self):
        from app.models.user import UserModel
        requesting_user = g.db.query(UserModel).filter(UserModel.id == g.user_id).first()
        if not requesting_user or not requesting_user.is_admin:
            return make_response(jsonify({"success": False, "message": "Admin privileges required"}), 403)

        from app.models.product import ProductModel
        from app.models.order import OrderModel
        from app.models.enums.database_enums import OrderStatus
        from sqlalchemy import func
        import datetime

        total_products = g.db.query(ProductModel).count()
        total_users = g.db.query(UserModel).count()
        
        paid_statuses = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
        total_orders = g.db.query(OrderModel).filter(OrderModel.status.in_(paid_statuses)).count()
        
        total_revenue_val = g.db.query(func.sum(OrderModel.total_amount)).filter(OrderModel.status.in_(paid_statuses)).scalar() or 0.0
        total_revenue = float(total_revenue_val)

        # Get all paid orders
        orders = g.db.query(OrderModel.created_at, OrderModel.total_amount).filter(OrderModel.status.in_(paid_statuses)).all()

        now = datetime.datetime.utcnow()
        
        # 1. Weekly sales (last 7 days)
        weekly_map = {0: 0.0, 1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0, 6: 0.0}
        for o_date, o_amount in orders:
            if o_date:
                o_date_naive = o_date.replace(tzinfo=None) if o_date.tzinfo else o_date
                if (now - o_date_naive).days < 7:
                    weekly_map[o_date_naive.weekday()] += float(o_amount)
        
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        weekly_data = [{"label": day_names[d], "value": amt} for d, amt in weekly_map.items()]

        # 2. Monthly sales (current year)
        monthly_map = {m: 0.0 for m in range(1, 13)}
        for o_date, o_amount in orders:
            if o_date:
                o_date_naive = o_date.replace(tzinfo=None) if o_date.tzinfo else o_date
                if o_date_naive.year == now.year:
                    monthly_map[o_date_naive.month] += float(o_amount)
        
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        monthly_data = [{"label": month_names[m-1], "value": amt} for m, amt in monthly_map.items()]

        # 3. Quarterly sales (current year)
        quarterly_map = {1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0}
        for o_date, o_amount in orders:
            if o_date:
                o_date_naive = o_date.replace(tzinfo=None) if o_date.tzinfo else o_date
                if o_date_naive.year == now.year:
                    q = (o_date_naive.month - 1) // 3 + 1
                    quarterly_map[q] += float(o_amount)
        
        quarterly_data = [{"label": f"Q{q}", "value": amt} for q, amt in quarterly_map.items()]

        # 4. Yearly sales (last 4 years)
        years = [now.year - 3, now.year - 2, now.year - 1, now.year]
        yearly_map = {yr: 0.0 for yr in years}
        for o_date, o_amount in orders:
            if o_date:
                o_date_naive = o_date.replace(tzinfo=None) if o_date.tzinfo else o_date
                if o_date_naive.year in yearly_map:
                    yearly_map[o_date_naive.year] += float(o_amount)
        
        yearly_data = [{"label": str(yr), "value": amt} for yr, amt in sorted(yearly_map.items())]

        response_schema = AdminDashboardResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Admin metrics retrieved successfully",
            "data": {
                "total_products": total_products,
                "total_users": total_users,
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "trends": {
                    "weekly": weekly_data,
                    "monthly": monthly_data,
                    "quarterly": quarterly_data,
                    "yearly": yearly_data
                }
            }
        })
        return make_response(jsonify(response_payload))

