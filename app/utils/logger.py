import logging
import sys

def configure_logger(log_level:str='INFO'):
    root_logger = logging.getLogger()

    # prevent duplicate handlers
    if root_logger.handlers:
        return

    root_logger.setLevel(log_level.upper())

    formatter = logging.Formatter(
        fmt=("%(asctime)s | "
             "%(levelname)s | "
             "%(name)s | "
             "%(filename)s:%(lineno)d | "
             "%(message)s"
             ),
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    root_logger.addHandler(stream_handler)