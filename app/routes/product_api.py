
from flask import MethodView, g
from app.middleware.jwt_middleware import jwt_required
from app.middleware.permission_check_middleware import permission_requried
from app.services.au

class ProductView(MethodView):


    @jwt_required
    def get(self):
        user_id = g.user_id


    def post(sef):
        pass

    def put(self):
        pass

    def delete(self):
        pass