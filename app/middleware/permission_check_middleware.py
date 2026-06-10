from functools import wraps

from flask import g

from app.exceptions.middleware_exceptions import PermissionDenied


def permission_requried(permission):

    def decorator(func):

        @wraps(func)
        def wrapper(*args, **kwargs):
            if g.is_superuser:
                return func(*args, **kwargs)

            if permission not in g.permissions:
                raise PermissionDenied()

            return func(*args, **kwargs)

        return wrapper

    return decorator
