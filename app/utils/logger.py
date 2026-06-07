import logging
import sys
from pathlib import Path
from datetime import datetime


def configure_logger(log_level: str = "INFO"):
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level.upper())

    formatter = logging.Formatter(
        fmt=(
            "%(asctime)s | "
            "%(levelname)s | "
            "%(name)s | "
            "%(filename)s:%(lineno)d | "
            "%(message)s"
        ),
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Log file: logs/YYYY-MM-DD.log
    log_file = log_dir / f"{datetime.now().strftime('%Y-%m-%d')}.log"

    # Console Handler
    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)

    # File Handler
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setFormatter(formatter)


    root_logger.addHandler(stream_handler)
    root_logger.addHandler(file_handler)