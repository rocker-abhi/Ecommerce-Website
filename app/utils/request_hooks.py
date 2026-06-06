import time
from flask import Flask, g
import uuid

def register_request_hook(app:Flask):

    @app.before_request
    def before_request():
        from app.utils.database import DatabaseHelper

        g.request_id = str(uuid.uuid4())
        g.start_time = time.time()

        # create the db session per request (Session instance)
        try:
            Session = DatabaseHelper.get_db_session()
            # Session is a sessionmaker; instantiate a session for this request
            g.db = Session()
        except Exception:
            # If DB not initialized or session creation fails, keep g.db as None
            raise RuntimeError("unable to establish the connection with the database")

        # extra variables
        g.user_id = None
        g.jwt_payload = None

    @app.after_request
    def after_request(response):
        duration = round((time.time() - g.start_time) * 1000, 2)
        response.headers['X-Response-Time'] = f"{duration} ms"
        response.headers["X-Request-Id"] = g.request_id
        return response

    @app.teardown_request
    def teardown_request(error):
        db = g.pop("db", None)

        if db is not None:
            try:
                if error:
                    db.rollback()
                else:
                    db.commit()
            finally:
                db.close()
