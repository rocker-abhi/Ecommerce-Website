from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

class Database:

    def __init__(self, db_url):
        self.db_url = db_url
        self.engine = create_engine(self.db_url)
        self.session_factory = sessionmaker(bind=self.engine, autoflush=False, autocommit=False)

