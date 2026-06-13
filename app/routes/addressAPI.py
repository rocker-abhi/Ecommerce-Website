from flask import g, jsonify, make_response, request
from flask.views import MethodView
from app.middleware.jwt_middleware import jwt_required
from app.models.addresses import AddressModel
from app.validators.address_validator import (
    AddressResponseSchema,
    AddressListResponseSchema,
    AddressDeleteResponseSchema,
)

class AddressAPI(MethodView):
    @jwt_required
    def get(self, address_id=None):
        user_id = g.user_id
        if address_id:
            address = g.db.query(AddressModel).filter(
                AddressModel.user_id == user_id,
                AddressModel.id == address_id,
                AddressModel.is_active == True
            ).first()
            if not address:
                return make_response(jsonify({
                    "success": False,
                    "message": "Address not found"
                }), 404)
            data = {
                "id": str(address.id),
                "address_line_1": address.address_line_1,
                "address_line_2": address.address_line_2,
                "city": address.city,
                "state": address.state,
                "zip_code": address.zip_code,
                "country": address.country,
                "is_active": address.is_active
            }
            response_schema = AddressResponseSchema()
            response_payload = response_schema.dump({
                "success": True,
                "message": "Address(es) retrieved successfully",
                "data": data
            })
        else:
            addresses = g.db.query(AddressModel).filter(
                AddressModel.user_id == user_id,
                AddressModel.is_active == True
            ).all()
            data = [{
                "id": str(addr.id),
                "address_line_1": addr.address_line_1,
                "address_line_2": addr.address_line_2,
                "city": addr.city,
                "state": addr.state,
                "zip_code": addr.zip_code,
                "country": addr.country,
                "is_active": addr.is_active
            } for addr in addresses]
            response_schema = AddressListResponseSchema()
            response_payload = response_schema.dump({
                "success": True,
                "message": "Address(es) retrieved successfully",
                "data": data
            })
            
        return make_response(jsonify(response_payload))

    @jwt_required
    def post(self):
        from app.validators.address_validator import AddressCreateSchema
        user_id = g.user_id
        schema = AddressCreateSchema()
        body = schema.load(request.get_json() or {})
        
        address = AddressModel(
            user_id=user_id,
            address_line_1=body.get("address_line_1"),
            address_line_2=body.get("address_line_2"),
            city=body.get("city"),
            state=body.get("state"),
            zip_code=body.get("zip_code"),
            country=body.get("country"),
            is_active=True
        )
        
        g.db.add(address)
        g.db.commit()
        
        response_schema = AddressResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Address created successfully",
            "data": {
                "id": str(address.id),
                "address_line_1": address.address_line_1,
                "address_line_2": address.address_line_2,
                "city": address.city,
                "state": address.state,
                "zip_code": address.zip_code,
                "country": address.country,
                "is_active": address.is_active
            }
        })
        return make_response(jsonify(response_payload), 201)

    @jwt_required
    def put(self, address_id):
        from app.validators.address_validator import AddressUpdateSchema
        user_id = g.user_id
        schema = AddressUpdateSchema()
        body = schema.load(request.get_json() or {})
        
        address = g.db.query(AddressModel).filter(
            AddressModel.user_id == user_id,
            AddressModel.id == address_id,
            AddressModel.is_active == True
        ).first()
        
        if not address:
            return make_response(jsonify({
                "success": False,
                "message": "Address not found"
            }), 404)
            
        if "address_line_1" in body:
            address.address_line_1 = body["address_line_1"]
        if "address_line_2" in body:
            address.address_line_2 = body["address_line_2"]
        if "city" in body:
            address.city = body["city"]
        if "state" in body:
            address.state = body["state"]
        if "zip_code" in body:
            address.zip_code = body["zip_code"]
        if "country" in body:
            address.country = body["country"]
            
        g.db.commit()
        
        response_schema = AddressResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Address updated successfully",
            "data": {
                "id": str(address.id),
                "address_line_1": address.address_line_1,
                "address_line_2": address.address_line_2,
                "city": address.city,
                "state": address.state,
                "zip_code": address.zip_code,
                "country": address.country,
                "is_active": address.is_active
            }
        })
        return make_response(jsonify(response_payload))


    @jwt_required
    def delete(self, address_id):
        user_id = g.user_id
        address = g.db.query(AddressModel).filter(
            AddressModel.user_id == user_id,
            AddressModel.id == address_id,
            AddressModel.is_active == True
        ).first()
        
        if not address:
            return make_response(jsonify({
                "success": False,
                "message": "Address not found"
            }), 404)
            
        address.is_active = False
        g.db.commit()
        
        response_schema = AddressDeleteResponseSchema()
        response_payload = response_schema.dump({
            "success": True,
            "message": "Address deleted successfully"
        })
        return make_response(jsonify(response_payload))

