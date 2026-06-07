from flask import g
from app.models.user import UserModel
from app.models.RefreshToken import RefreshToken

class UserRepository :

    def get_by_email(self, email):
        return(
            g.db.query(UserModel).filter(UserModel.email == email).first()
        )

    def updateRefreshToken(self, user_id, refresh_token):
        current_token = g.db.query(RefreshToken).filter(RefreshToken.user_id == user_id).first()

        if not current_token:
            current_token = RefreshToken(user_id=user_id, token=refresh_token)
            g.db.add(current_token)
        else:
            current_token.token = refresh_token

        g.db.commit()
        g.db.refresh(current_token)


