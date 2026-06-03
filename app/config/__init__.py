from app.config.EnvironmentConfig import (
    DevelopmentConfig,
    ProductionConfig,
    StagingConfig,
)

CONFIG_MAP = {
    "development": DevelopmentConfig,
    "staging": StagingConfig,
    "production": ProductionConfig,
}

def get_config(env):
    return CONFIG_MAP[env]
