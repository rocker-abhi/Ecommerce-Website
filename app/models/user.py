# importing libraries
import uuid
from enum import Enum as PyEnum
from sqlalchemy import (Column, Integer, column, Uuid, String, Enum as SQLEnum, Boolean, DateTime, CheckConstraint)
from .base import BaseModel
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


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

    __table_args__ = (
        CheckConstraint('age >= 18 and age < 80', name='check_age'),
    )

    def hash_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def __repr__(self):
        return f"<User {self.email}>"
