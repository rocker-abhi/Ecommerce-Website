# # importing libraries
# from dotenv import load_dotenv
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy import create_engine
#
# _db_instance =  None  # This will hold the singleton instance of the Database class
#
# class Database:
#
#     def __init__(self, db_url):
#         self.db_url = db_url
#         self.engine = create_engine(self.db_url, echo=True)
#         self.session_factory = sessionmaker(bind=self.engine, autoflush=False, autocommit=False)
#
#     def get_session(self):
#         return self.session_factory()
#
# def init_database(database_uri: str) -> None:
#     """Initialize the shared database instance (call once at app startup)"""
#     global _db_instance
#     if _db_instance is None:
#         _db_instance = Database(database_uri)
#
# def get_db_instance() -> None:
#     if _db_instance is None:
#         raise RuntimeError('Database instance not initialized')
#     return _db_instance
from asyncio import exceptions
from traceback import print_tb

from sqlalchemy import create_engine, text
from sqlalchemy.orm import  sessionmaker

class DatabaseHelper:
    _db_engine = None
    _db_session = None

    @classmethod
    def init_database(cls, connection_string : str):
        try:
            cls._db_engine = create_engine(connection_string, echo=False, pool_pre_ping=True)
            cls._db_session = sessionmaker(bind=cls._db_engine, autoflush=False, autocommit=False)
            cls.check_db_connection()
        except Exception as e :
            raise RuntimeError("Unable To create the database session")

    @classmethod
    def get_db_session(cls):
        try:
            if not cls._db_session :
                raise RuntimeError("Session is not created")
            return cls._db_session
        except Exception as e :
            raise RuntimeError("Session Error")

    @classmethod
    def check_db_connection(cls):
        if not cls._db_engine:
            raise Exception("Session is not created")
        try:
            with cls._db_engine.connect() as conn:
                print("connected sucessfully")
                conn.execute(text("SELECT 1"))
        except Exception as e :
            raise Exception("Unable to connect to database")

if __name__ == "__main__":
    connection_string = "postgresql://abhishek:admin%40123@localhost:5432/website_db"
    DatabaseHelper.init_database(connection_string)
    # DatabaseHelper.check_db_connection()
    session = DatabaseHelper.get_db_session()
