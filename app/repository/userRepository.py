from flask import g

from app.models.RefreshToken import RefreshToken
from app.models.user import UserModel


class UserRepository:
    def get_by_email(self, email):
        return g.db.query(UserModel).filter(UserModel.email == email).first()

    def updateRefreshToken(self, user_id, refresh_token):
        current_token = (
            g.db.query(RefreshToken).filter(RefreshToken.user_id == user_id).first()
        )

        if not current_token:
            current_token = RefreshToken(user_id=user_id, token=refresh_token)
            g.db.add(current_token)
        else:
            current_token.token = refresh_token

        g.db.commit()
        g.db.refresh(current_token)

    def create_user(self, user: UserModel) -> UserModel:
        g.db.add(user)
        g.db.commit()
        g.db.refresh(user)
        return user

    def delete_refresh_token(self, user_id):
        g.db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
        g.db.commit()
