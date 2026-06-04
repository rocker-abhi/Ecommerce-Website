from psycopg2._psycopg import Column
from sqlalchemy import column, Integer, Uuid, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class RefreshToken(BaseModel):
    __tablename__ = "refresh_tokens"
    id = Column(Uuid, primary_key=True)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=False)
    token = Column(String(500),nullable=False)
    expires_at = Column(DateTime,nullable=False)
    user = relationship("User")