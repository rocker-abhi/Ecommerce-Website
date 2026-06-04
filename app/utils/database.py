# importing libraries
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

_db_instance =  None  # This will hold the singleton instance of the Database class

class Database:

    def __init__(self, db_url):
        self.db_url = db_url
        self.engine = create_engine(self.db_url, echo=True)
        self.session_factory = sessionmaker(bind=self.engine, autoflush=False, autocommit=False)

    def get_session(self):
        return self.session_factory()

def init_database(database_uri: str) -> None:
    """Initialize the shared database instance (call once at app startup)"""
    global _db_instance
    if _db_instance is None:
        _db_instance = Database(database_uri)

def get_db_instance() -> None:
    if _db_instance is None:
        raise RuntimeError('Database instance not initialized')
    return _db_instance
