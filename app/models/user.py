# importing libraries
import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Integer, String, Uuid
from sqlalchemy import Enum as SQLEnum
from werkzeug.security import check_password_hash, generate_password_hash

from .base import BaseModel


class UserEnum(PyEnum):
    admin = "admin"
    buyer = "buyer"
    seller = "seller"


class UserModel(BaseModel):
    __tablename__ = "users"
    id = Column(Uuid, primary_key=True, nullable=False, unique=True, default=uuid.uuid4)
    name = Column(String(150), unique=False, nullable=False)
    age = Column(Integer, unique=False, nullable=False)
    password = Column(String(255), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    userType = Column(SQLEnum(UserEnum), nullable=False)
    is_active = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow())
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow())
    google_id = Column(String(255), unique=True, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)

    __table_args__ = (CheckConstraint("age >= 18 and age < 80", name="check_age"),)

    @property
    def address(self):
        return {
            "city": self.city,
            "state": self.state,
            "country": self.country
        }

    def hash_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def activate_user(self, status: bool):
        self.is_active = status

    def __repr__(self):
        return f"<User {self.email}>"
