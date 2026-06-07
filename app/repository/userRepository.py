from flask import g
from app.models.user import UserModel

class UserRepository :

    def get_by_email(self, email):
        return(
            g.db.query(UserModel).filter(UserModel.email == email).first()
        )