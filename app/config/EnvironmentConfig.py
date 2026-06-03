# importing libraries
from app.config.setting import BaseConfig

class DevelopmentConfig(BaseConfig):
    Debug = True

class StagingConfig(BaseConfig):
    DEBUG = False

class ProductionConfig(BaseConfig):
    DEBUG = False
