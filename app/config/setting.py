# importing libraries
import os



def validate_config(key, required=False)  :
    """
    :param key:
    :param required:
    :return: value or raise exception
    """
    value = os.getenv(key)
    if required and not value:
        raise RuntimeError('Required environment variable not set.')
    return value

class BaseConfig:
    """ required environment variables """
    HOST = validate_config('HOST', required=True)
    PORT = validate_config('PORT', required=True)
    DEBUG = validate_config('DEBUG', required=True)
    DATABASE_URI = validate_config('DATABASE_URI', required=True)

